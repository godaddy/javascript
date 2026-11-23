import * as crypto from 'node:crypto';
import { types } from 'node:util';
import { type Result, error, ok } from '../types/result';
import type { VerifiableRequest } from '../types/verifiable-request';

import { VerificationError } from '../errors/base-error';
import {
  INVALID_WEBHOOK_OPTIONS,
  WEBHOOK_RAW_BODY_REQUIRED,
  WEBHOOK_SECRET_REQUIRED,
  WEBHOOK_VERIFICATION_FAILED,
  type WebhookVerificationOptions,
  webhookFailureStatus,
  webhookOptionsProblem,
} from './config';
import { logger } from './logger';

/**
 * Error thrown when a webhook signature verification fails
 */
export class InvalidWebhookSignatureError extends VerificationError {
  constructor({ correlationId }: { correlationId?: string } = {}) {
    super({
      name: 'INVALID_WEBHOOK_SIGNATURE',
      message: 'The webhook signature is invalid',
      correlationId,
      details: [
        {
          issue: 'SIGNATURE_VERIFICATION_FAILED',
          description:
            'The webhook signature could not be verified with the provided secret',
          field: 'webhook-signature',
          location: 'header',
        },
      ],
    });
  }
}

/**
 * Error thrown when a required webhook header is missing
 */
export class MissingWebhookHeaderError extends VerificationError {
  constructor({
    headerName,
    correlationId,
  }: {
    headerName: string;
    correlationId?: string;
  }) {
    super({
      name: 'MISSING_WEBHOOK_HEADER',
      message: `Missing required header: ${headerName}`,
      correlationId,
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
 * Error returned when the webhook timestamp is outside the configured tolerance
 */
export class WebhookTimestampOutOfToleranceError extends VerificationError {
  constructor({
    toleranceSeconds,
    correlationId,
  }: {
    toleranceSeconds: number;
    correlationId?: string;
  }) {
    super({
      name: 'WEBHOOK_TIMESTAMP_OUT_OF_TOLERANCE',
      message: 'The webhook timestamp is outside the allowed tolerance',
      correlationId,
      details: [
        {
          issue: 'TIMESTAMP_OUT_OF_TOLERANCE',
          description: `The webhook-timestamp header must be Unix seconds within ${toleranceSeconds} seconds of now`,
          field: 'webhook-timestamp',
          location: 'header',
        },
      ],
    });
  }
}

/**
 * Error returned when strict raw-body verification is on and the request body
 * is not the raw bytes the platform signed (a string or a Buffer)
 */
export class WebhookRawBodyRequiredError extends VerificationError {
  constructor({ correlationId }: { correlationId?: string } = {}) {
    super({
      name: WEBHOOK_RAW_BODY_REQUIRED,
      message:
        'The raw webhook request body is required to verify the signature',
      correlationId,
      details: [
        {
          issue: 'RAW_BODY_UNAVAILABLE',
          description:
            "The body was already parsed or is missing. Pass the raw body as a string or Buffer, for example from express.raw({ type: 'application/json' }), or from express.json() with a verify hook that keeps req.rawBody",
          location: 'body',
        },
      ],
    });
  }
}

/**
 * Error thrown when no webhook secret is configured. It is the app's setup
 * problem, not the sender's, so adapters answer it with 500.
 */
export class WebhookSecretRequiredError extends VerificationError {
  constructor({ correlationId }: { correlationId?: string } = {}) {
    super({
      name: WEBHOOK_SECRET_REQUIRED,
      message:
        'Webhook secret is required. Provide it via options or GODADDY_WEBHOOK_SECRET environment variable',
      correlationId,
    });
  }
}

/**
 * Error returned when webhook options would refuse every delivery, such as a
 * toleranceSeconds that is NaN or negative. Adapters answer it with 500.
 */
export class InvalidWebhookOptionsError extends VerificationError {
  constructor({
    problem,
    correlationId,
  }: {
    problem: string;
    correlationId?: string;
  }) {
    super({
      name: INVALID_WEBHOOK_OPTIONS,
      message: `Invalid webhook verification options: ${problem}`,
      correlationId,
    });
  }
}

/**
 * Error returned when verification itself failed inside the app, for example a
 * body that can't be serialized. It isn't the sender's fault, so adapters
 * answer it with 500 and the sender retries.
 */
export class WebhookVerificationFailedError extends VerificationError {
  constructor({ correlationId }: { correlationId?: string } = {}) {
    super({
      name: WEBHOOK_VERIFICATION_FAILED,
      message: 'Webhook verification failed with an internal error',
      correlationId,
    });
  }
}

/**
 * Get the webhook secret from options or environment
 * @param correlationId Carried on the error, to match it with the request's logs
 * @throws WebhookSecretRequiredError if no webhook secret is available
 */
export function getWebhookSecret(
  options?: WebhookVerificationOptions,
  correlationId?: string,
): string {
  // Try to get the webhook secret from options first
  const secret = options?.secret || process.env.GODADDY_WEBHOOK_SECRET;

  if (!secret) {
    throw new WebhookSecretRequiredError({ correlationId });
  }

  return secret;
}

/**
 * Returns the signed payload bytes. Buffers, byte arrays, ArrayBuffers and
 * strings are used as they are. Any other value is the legacy fallback: an object is
 * JSON-stringified, which only matches when the sender serialized it the same way.
 */
function payloadBytes(payload: unknown): Buffer {
  if (payload === undefined || payload === null) {
    return Buffer.alloc(0);
  }
  if (Buffer.isBuffer(payload)) {
    return payload;
  }
  if (ArrayBuffer.isView(payload)) {
    return Buffer.from(payload.buffer, payload.byteOffset, payload.byteLength);
  }
  if (types.isAnyArrayBuffer(payload)) {
    return Buffer.from(payload);
  }
  if (typeof payload === 'string') {
    return Buffer.from(payload, 'utf8');
  }
  if (typeof payload === 'object') {
    return Buffer.from(JSON.stringify(payload), 'utf8');
  }
  return Buffer.from(String(payload), 'utf8');
}

function hmacBase64(
  secret: string,
  webhookId: string,
  timestamp: string,
  payload: unknown,
): string {
  return crypto
    .createHmac('sha256', secret)
    .update(`${webhookId}.${timestamp}.`, 'utf8')
    .update(payloadBytes(payload))
    .digest('base64');
}

/**
 * Generates an HMAC signature for webhook verification
 *
 * @param secret The webhook secret
 * @param webhookId The webhook ID from the request header
 * @param timestamp The timestamp from the request header
 * @param payload The request body
 * @returns The generated HMAC signature, `V1,<base64 HMAC-SHA256>`
 */
export function generateHmac(
  secret: string,
  webhookId: string,
  timestamp: string,
  payload: Buffer | string | Record<string, unknown> | unknown,
): string {
  return `V1,${hmacBase64(secret, webhookId, timestamp, payload)}`;
}

/**
 * Compares two strings in constant time when they have the same length. The
 * length check leaks only the length, which is fixed for a base64 HMAC-SHA256.
 */
function constantTimeEqual(given: string, expected: string): boolean {
  const givenBytes = Buffer.from(given, 'utf8');
  const expectedBytes = Buffer.from(expected, 'utf8');
  return (
    givenBytes.length === expectedBytes.length &&
    crypto.timingSafeEqual(givenBytes, expectedBytes)
  );
}

/**
 * Checks a `webhook-signature` header value against the expected digest. The
 * header may hold several space-separated `v1,<base64>` entries, for example
 * during a secret rotation, and a match on any one of them passes. The version
 * tag is read without regard to case, so the platform's `V1,` and the `v1,`
 * form both work. Entries with any other version are ignored. A trailing comma
 * is dropped from each entry, because Node and the Fetch API join a repeated
 * header with ", ", and base64 never ends in a comma.
 */
function signatureMatches(header: string, expectedDigest: string): boolean {
  let matched = false;
  // Split on whitespace, and on a bare comma that starts another entry: an
  // intermediary may join repeated headers with "," alone. Base64 has no comma.
  for (const listed of header.split(/\s+|,(?=v\d+,)/i)) {
    const entry = listed.endsWith(',') ? listed.slice(0, -1) : listed;
    const comma = entry.indexOf(',');
    if (comma <= 0 || entry.slice(0, comma).toLowerCase() !== 'v1') {
      continue;
    }
    // Every entry is checked, so the time taken doesn't depend on which one matched.
    if (constantTimeEqual(entry.slice(comma + 1), expectedDigest)) {
      matched = true;
    }
  }
  return matched;
}

function isRawBody(body: unknown): boolean {
  return (
    typeof body === 'string' ||
    ArrayBuffer.isView(body) ||
    types.isAnyArrayBuffer(body)
  );
}

/**
 * A single-valued header: the first value when it was sent more than once,
 * whether as an array or joined with commas the way Node and Fetch join a
 * repeated header. Platform ids and Unix timestamps never contain a comma.
 */
function firstHeaderValue(value: unknown): string | undefined {
  const first: unknown = Array.isArray(value) ? value[0] : value;
  // A hand-built request may carry a number; read it as text, as before.
  return first === undefined || first === null
    ? undefined
    : String(first).split(',')[0]?.trim();
}

/** The signature header: repeated values are one list. */
function signatureHeaderValue(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.map(String).join(' ') : undefined;
  }
  return value === undefined || value === null ? undefined : String(value);
}

function timestampWithinTolerance(
  timestamp: string,
  toleranceSeconds: number,
): boolean {
  if (!/^\d+$/.test(timestamp)) {
    return false;
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  return Math.abs(nowSeconds - Number(timestamp)) <= toleranceSeconds;
}

/** Setup error names already logged at error level in this process. */
const setupErrorsLogged = new Set<string>();

/**
 * Verifies a webhook subscription request using GoDaddy's HMAC signing mechanism
 *
 * The signature is `v1,<base64 HMAC-SHA256>` over
 * `<webhook-id>.<webhook-timestamp>.<raw body>`, keyed with the webhook secret,
 * and is compared in constant time.
 *
 * @param req The request to verify
 * @param options Options for verification including webhook secret
 * @returns Result indicating success or failure with appropriate error
 */
export function verifyWebhookSubscription(
  req: VerifiableRequest,
  options?: WebhookVerificationOptions,
): Result<void> {
  const correlationId = crypto.randomUUID();
  // The body and headers are never logged: the body can hold shopper data.
  const logContext = { correlationId, method: req.method, path: req.path };

  const fail = (err: VerificationError, message: string): Result<void> => {
    // The app's own setup problems are logged as errors, with the detail the
    // adapters leave out of the response.
    if (webhookFailureStatus(err.name) === 500) {
      // Once per kind at error level, then debug: unsigned requests to a
      // misconfigured route can't flood the error log.
      const first = !setupErrorsLogged.has(err.name);
      setupErrorsLogged.add(err.name);
      logger[first ? 'error' : 'debug'](
        { ...logContext, error: err.name, detail: err.message },
        message,
      );
    } else {
      logger.debug({ ...logContext, error: err.name }, message);
    }
    return error(err.toJSON());
  };

  const problem = webhookOptionsProblem(options);
  if (problem) {
    return fail(
      new InvalidWebhookOptionsError({ problem, correlationId }),
      'Webhook verification failed - invalid options',
    );
  }

  // Extract required headers
  const signature = signatureHeaderValue(req.headers['webhook-signature']);
  const webhookId = firstHeaderValue(req.headers['webhook-id']);
  const timestamp = firstHeaderValue(req.headers['webhook-timestamp']);

  // Check all required headers exist
  if (!signature) {
    return fail(
      new MissingWebhookHeaderError({
        headerName: 'webhook-signature',
        correlationId,
      }),
      'Webhook verification failed - missing signature header',
    );
  }

  if (!webhookId) {
    return fail(
      new MissingWebhookHeaderError({
        headerName: 'webhook-id',
        correlationId,
      }),
      'Webhook verification failed - missing webhook-id header',
    );
  }

  if (!timestamp) {
    return fail(
      new MissingWebhookHeaderError({
        headerName: 'webhook-timestamp',
        correlationId,
      }),
      'Webhook verification failed - missing webhook-timestamp header',
    );
  }

  if (options?.strictRawBody === true && !isRawBody(req.body)) {
    return fail(
      new WebhookRawBodyRequiredError({ correlationId }),
      'Webhook verification failed - raw body unavailable',
    );
  }

  try {
    // Get the webhook secret
    const secret = getWebhookSecret(options, correlationId);

    const expectedDigest = hmacBase64(secret, webhookId, timestamp, req.body);

    if (!signatureMatches(signature, expectedDigest)) {
      return fail(
        new InvalidWebhookSignatureError({ correlationId }),
        'Webhook verification failed - invalid signature',
      );
    }

    // Checked after the signature, so only a signed timestamp is judged.
    const toleranceSeconds = options?.toleranceSeconds;
    if (
      toleranceSeconds !== undefined &&
      toleranceSeconds !== null &&
      !timestampWithinTolerance(timestamp, toleranceSeconds)
    ) {
      return fail(
        new WebhookTimestampOutOfToleranceError({
          toleranceSeconds,
          correlationId,
        }),
        'Webhook verification failed - timestamp outside tolerance',
      );
    }

    return ok(undefined);
  } catch (err) {
    if (err instanceof VerificationError) {
      return fail(err, 'Webhook verification error');
    }

    // An internal failure is the app's problem, not a bad signature: 500, so
    // the sender retries. Throttled like the other setup errors; the stack is
    // in every entry, at error level the first time.
    const first = !setupErrorsLogged.has(WEBHOOK_VERIFICATION_FAILED);
    setupErrorsLogged.add(WEBHOOK_VERIFICATION_FAILED);
    logger[first ? 'error' : 'debug'](
      { ...logContext, error: WEBHOOK_VERIFICATION_FAILED, err },
      'Webhook verification error - internal failure',
    );
    return error(
      new WebhookVerificationFailedError({ correlationId }).toJSON(),
    );
  }
}
