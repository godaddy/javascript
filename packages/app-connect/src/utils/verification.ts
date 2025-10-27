import * as crypto from 'node:crypto';
import { VerificationError } from '../errors/base-error';
import {
  ExpiredSignatureError,
  InvalidAlgorithmError,
  InvalidSignatureError,
  InvalidVersionError,
  MissingHeaderError,
} from '../errors/verification-errors';
import { type Result, error, ok } from '../types/result';
import type { VerifiableRequest } from '../types/verifiable-request';
import {
  VERIFICATION_CONSTANTS,
  type VerificationOptions,
  type WebhookVerificationOptions,
  getPublicKeyBuffer,
  getWebhookSecret,
} from './config';
import { logger } from './logger';
import { base64ToArrayBuffer, stringToArrayBuffer } from './strings';

/**
 * Headers that are included in the canonicalization for signatures
 * IMPORTANT: Order must match the Go middleware exactly
 */
const HEADERS_TO_SIGN = ['content-length', 'content-type', 'x-store-id'];

/**
 * Canonicalizes a request for signature verification
 *
 * IMPORTANT: This must produce byte-for-byte identical output to the Go middleware's
 * canonicalizeRequest function or signature verification will fail.
 * Do not change the order of operations or formatting without testing against
 * real signatures produced by the middleware.
 */
export function canonicalizeRequest(req: VerifiableRequest): string {
  logger.info('Starting request canonicalization');

  // 1. HTTP Method (Uppercase)
  const method = req.method.toUpperCase();
  logger.debug({ method }, 'HTTP method processed');

  // 2. URI Path with query parameters
  let path = req.path || req.url || '/';

  // Add query parameters if they exist
  if (req.query && Object.keys(req.query).length > 0) {
    const sortedEntries = Object.entries(req.query).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    const queryString = sortedEntries
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    path = `${path}?${queryString}`;
  }

  logger.debug({ path }, 'Request path with query parameters');

  // 3. Include headers in canonical form
  const headerParts = [];

  // Create map of allowed headers for quick lookup
  const allowedHeaders: Record<string, boolean> = {};
  for (const header of HEADERS_TO_SIGN) {
    allowedHeaders[header] = true;
  }

  // Get all header keys and sort them
  const headerKeys = Object.keys(req.headers).sort();

  // Add headers in sorted order, but only those in the allow list
  for (const key of headerKeys) {
    const lowerKey = key.toLowerCase();

    // Skip if not in allowed list or if it's a signature header
    if (
      !allowedHeaders[lowerKey] ||
      lowerKey.startsWith('x-godaddy-signature')
    ) {
      continue;
    }

    const values = req.headers[key];
    const headerValues = Array.isArray(values) ? values : [values];

    for (const value of headerValues) {
      if (value !== undefined && value !== null) {
        const headerLine = `${lowerKey}: ${value}`;
        logger.debug({ headerLine }, 'Added header to canonical string');
        headerParts.push(headerLine);
      }
    }
  }

  // Create canonical string with method, path, and headers
  let canonicalString = `${method} ${path}\n${headerParts.join('\n')}\n`;

  // Add request body if it exists
  if (req.body && (req.headers['content-length'] || '0') !== '0') {
    logger.debug('Adding request body to canonical string');
    // Add an extra blank line before the body
    canonicalString += '\n';

    // Add the body to the canonical string
    // Use original body exactly as received to match Go middleware
    const bodyContent =
      typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    canonicalString += bodyContent;

    logger.debug(
      { bodyLength: bodyContent.length },
      'Request body added to canonical string',
    );
  }

  console.log('==== START CANONICAL STRING ===');
  console.log(canonicalString);
  console.log('==== END CANONICAL STRING ===');
  // logger.debug({ canonicalString }, "Generated canonical string");

  return canonicalString;
}

/**
 * Verifies a signed action request
 */
export async function verifyAction(
  req: VerifiableRequest,
  options?: VerificationOptions,
): Promise<Result<void>> {
  try {
    logger.info('Starting signature verification');

    // Get required headers
    const signatureHeader = req.headers['x-godaddy-signature'];
    const algorithmHeader = req.headers['x-godaddy-signature-algorithm'];
    const versionHeader = req.headers['x-godaddy-signature-version'];
    const timestampHeader = req.headers['x-godaddy-signature-timestamp'];

    logger.debug(
      {
        signature: signatureHeader,
        algorithm: algorithmHeader,
        version: versionHeader,
        timestamp: timestampHeader,
      },
      'Retrieved signature headers',
    );

    // Check if required headers exist
    if (!signatureHeader) {
      logger.warn('Missing required signature header');
      return error(
        new MissingHeaderError({ headerName: 'x-godaddy-signature' }).toJSON(),
      );
    }

    if (!algorithmHeader) {
      logger.warn('Missing required algorithm header');
      return error(
        new MissingHeaderError({
          headerName: 'x-godaddy-signature-algorithm',
        }).toJSON(),
      );
    }

    if (!versionHeader) {
      logger.warn('Missing required version header');
      return error(
        new MissingHeaderError({
          headerName: 'x-godaddy-signature-version',
        }).toJSON(),
      );
    }

    if (!timestampHeader) {
      logger.warn('Missing required timestamp header');
      return error(
        new MissingHeaderError({
          headerName: 'x-godaddy-signature-timestamp',
        }).toJSON(),
      );
    }

    // Validate algorithm
    const algorithm = Array.isArray(algorithmHeader)
      ? algorithmHeader[0]
      : (algorithmHeader as string);
    logger.debug(
      {
        algorithm,
        expected: VERIFICATION_CONSTANTS.SUPPORTED_ALGORITHM,
      },
      'Validating algorithm',
    );
    if (algorithm !== VERIFICATION_CONSTANTS.SUPPORTED_ALGORITHM) {
      logger.warn(
        { algorithm, expected: VERIFICATION_CONSTANTS.SUPPORTED_ALGORITHM },
        'Invalid algorithm',
      );
      return error(new InvalidAlgorithmError({ algorithm }).toJSON());
    }

    // Validate version
    const version = Array.isArray(versionHeader)
      ? versionHeader[0]
      : (versionHeader as string);
    logger.debug(
      {
        version,
        expected: VERIFICATION_CONSTANTS.SUPPORTED_VERSION,
      },
      'Validating version',
    );
    if (version !== VERIFICATION_CONSTANTS.SUPPORTED_VERSION) {
      logger.warn(
        { version, expected: VERIFICATION_CONSTANTS.SUPPORTED_VERSION },
        'Invalid version',
      );
      return error(new InvalidVersionError({ version }).toJSON());
    }

    // Validate timestamp
    const timestamp = Array.isArray(timestampHeader)
      ? timestampHeader[0]
      : (timestampHeader as string);
    const signatureTime = new Date(timestamp);
    const now = new Date();
    const maxAge =
      options?.maxTimestampAgeSeconds ||
      VERIFICATION_CONSTANTS.DEFAULT_MAX_TIMESTAMP_AGE_SECONDS;

    const timeDiffSeconds = (now.getTime() - signatureTime.getTime()) / 1000;
    logger.debug(
      {
        timestamp,
        currentTime: now.toISOString(),
        timeDiffSeconds,
        maxAge,
      },
      'Validating timestamp',
    );

    if (timeDiffSeconds > maxAge) {
      logger.warn(
        { timestamp, timeDiffSeconds, maxAge },
        'Signature timestamp expired',
      );
      return error(new ExpiredSignatureError({ timestamp, maxAge }).toJSON());
    }

    // Get the public key
    const publicKeyBuffer = getPublicKeyBuffer(options);
    logger.debug(
      {
        publicKeyLength: publicKeyBuffer.byteLength,
      },
      'Retrieved public key',
    );

    // Canonicalize the request
    const canonicalString = canonicalizeRequest(req);
    logger.debug({ canonicalString }, 'Generated canonical request string');
    const canonicalStringBuffer = stringToArrayBuffer(canonicalString);
    const signatureBuffer = base64ToArrayBuffer(signatureHeader as string);

    // Try multiple verification methods
    const publicKey = await crypto.subtle.importKey(
      'spki',
      publicKeyBuffer,
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true,
      ['verify'],
    );

    const isValid = await crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' },
      },
      publicKey,
      signatureBuffer,
      canonicalStringBuffer,
    );

    logger.info({ isValid }, 'Signature verification completed');

    // Add more debugging suggestions if verification failed
    if (!isValid) {
      logger.warn('Signature verification failed');
      return error(new InvalidSignatureError().toJSON());
    }

    logger.info('Signature verification successful');
    return ok();
  } catch (err) {
    logger.error({ err }, 'Error during signature verification');
    return error(new InvalidSignatureError().toJSON());
  }
}

/**
 * Error thrown when a required webhook header is missing
 */
export class MissingWebhookHeaderError extends VerificationError {
  constructor(headerName: string) {
    super({
      name: 'MISSING_WEBHOOK_HEADER',
      message: `Missing required header: ${headerName}`,
      details: [
        {
          issue: 'MISSING_REQUIRED_HEADER',
          description: `The ${headerName} header is required for webhook verification`,
          field: headerName,
          location: 'header',
        },
      ],
    });
  }
}

/**
 * Error thrown when webhook signature verification fails
 */
export class InvalidWebhookSignatureError extends VerificationError {
  constructor() {
    super({
      name: 'INVALID_WEBHOOK_SIGNATURE',
      message: 'The webhook signature is invalid',
      details: [
        {
          issue: 'SIGNATURE_VERIFICATION_FAILED',
          description:
            'The webhook signature could not be verified with the provided secret',
          field: 'x-godaddy-webhook-signature',
          location: 'header',
        },
      ],
    });
  }
}

/**
 * Verifies a webhook subscription request
 */
/**
 * Recursively stringifies a JavaScript value into a canonical JSON string
 * that exactly matches Go's json.Marshal(json.Unmarshal(data)) behavior.
 *
 * This is critical for signature verification to work correctly between
 * the Go signer middleware and Node.js verification code.
 *
 * @param value The JavaScript value to stringify.
 * @returns A canonical JSON string representation of the value.
 */
export function canonicalJsonStringify(value: unknown): string {
  // Match Go's behavior for special values
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    // Go omits undefined/nil fields with omitempty tag or converts to null
    return 'null';
  }

  // Handle primitives
  if (typeof value !== 'object') {
    if (typeof value === 'number') {
      // Go uses decimal notation for all numbers without scientific notation
      // Format numbers using simple toString() to match Go's behavior
      return value.toString();
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    // Go escapes certain characters differently than JS
    // But basic JSON.stringify is sufficient for most cases
    return JSON.stringify(value);
  }

  // Handle arrays - preserve order but canonicalize contents
  if (Array.isArray(value)) {
    const arrayElements = value.map((element) =>
      canonicalJsonStringify(element),
    );
    return `[${arrayElements.join(',')}]`;
  }

  // Handle objects - Go sorts keys with basic string comparison
  // This is a critical difference from JS JSON.stringify which doesn't sort keys
  const objectKeys = Object.keys(value).sort();

  const keyValuePairs = objectKeys
    .map((key) => {
      const propValue = (value as Record<string, unknown>)[key];
      // Skip undefined values to match Go's handling of nil with omitempty
      if (propValue === undefined) {
        return null;
      }
      const keyString = JSON.stringify(key);
      const valueString = canonicalJsonStringify(propValue);
      return `${keyString}:${valueString}`;
    })
    .filter(Boolean); // Remove null entries (undefined values)

  return `{${keyValuePairs.join(',')}}`;
}

/**
 * Verifies a webhook subscription request
 */
export function verifyWebhookSubscription(
  req: VerifiableRequest,
  options?: WebhookVerificationOptions,
): Result<void> {
  try {
    // Get required headers
    const signatureHeader = req.headers['x-godaddy-webhook-signature'];

    // Check if required headers exist
    if (!signatureHeader) {
      return error(
        new MissingWebhookHeaderError('x-godaddy-webhook-signature').toJSON(),
      );
    }

    // Get the webhook secret
    const secret = getWebhookSecret(options);

    // Create string to sign (request body)
    const stringToSign =
      typeof req.body === 'string' ? req.body : JSON.stringify(req.body || '');

    // Create the signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(stringToSign)
      .digest('hex');

    // Compare signatures
    const providedSignature = Array.isArray(signatureHeader)
      ? signatureHeader[0]
      : (signatureHeader as string);

    if (providedSignature !== expectedSignature) {
      return error(new InvalidWebhookSignatureError().toJSON());
    }

    return ok();
  } catch (err) {
    return error(new InvalidWebhookSignatureError().toJSON());
  }
}
