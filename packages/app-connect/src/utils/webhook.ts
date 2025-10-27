import * as crypto from 'node:crypto';
import { type Result, error, ok } from '../types/result';
import type { VerifiableRequest } from '../types/verifiable-request';

import { VerificationError } from '../errors/base-error';
import type { WebhookVerificationOptions } from './config';
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
 * Get the webhook secret from options or environment
 * @throws Error if no webhook secret is available
 */
export function getWebhookSecret(options?: WebhookVerificationOptions): string {
  // Try to get the webhook secret from options first
  const secret = options?.secret || process.env.GODADDY_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error(
      'Webhook secret is required. Provide it via options or GODADDY_WEBHOOK_SECRET environment variable',
    );
  }

  return secret;
}

/**
 * Generates an HMAC signature for webhook verification
 *
 * @param secret The webhook secret
 * @param webhookId The webhook ID from the request header
 * @param timestamp The timestamp from the request header
 * @param payload The request body
 * @returns The generated HMAC signature
 */
export function generateHmac(
  secret: string,
  webhookId: string,
  timestamp: string,
  payload: Buffer | string | Record<string, unknown> | unknown,
): string {
  let payloadStr: string;

  if (payload === undefined || payload === null) {
    payloadStr = '';
  } else if (Buffer.isBuffer(payload)) {
    payloadStr = payload.toString();
  } else if (typeof payload === 'string') {
    payloadStr = payload;
  } else if (typeof payload === 'object') {
    // Handle objects by JSON stringifying them
    payloadStr = JSON.stringify(payload);
  } else {
    // Convert anything else to string
    payloadStr = String(payload);
  }

  const toSignStr = `${webhookId}.${timestamp}.${payloadStr}`;
  const toSignBytes = Buffer.from(toSignStr);
  const hmacDigest = crypto
    .createHmac('sha256', secret)
    .update(toSignBytes)
    .digest();
  return `V1,${hmacDigest.toString('base64')}`;
}

/**
 * Verifies a webhook subscription request using GoDaddy's HMAC signing mechanism
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

  // Extract required headers
  const signature = req.headers['webhook-signature'];
  const webhookId = req.headers['webhook-id'];
  const timestamp = req.headers['webhook-timestamp'];

  // Check all required headers exist
  if (!signature) {
    const err = new MissingWebhookHeaderError({
      headerName: 'webhook-signature',
      correlationId,
    });
    logger.debug(
      {
        error: err.name,
        correlationId,
        request: req,
      },
      'Webhook verification failed - missing signature header',
    );
    return error(err.toJSON());
  }

  if (!webhookId) {
    const err = new MissingWebhookHeaderError({
      headerName: 'webhook-id',
      correlationId,
    });
    logger.debug(
      {
        error: err.name,
        correlationId,
        request: req,
      },
      'Webhook verification failed - missing webhook-id header',
    );
    return error(err.toJSON());
  }

  if (!timestamp) {
    const err = new MissingWebhookHeaderError({
      headerName: 'webhook-timestamp',
      correlationId,
    });
    logger.debug(
      {
        error: err.name,
        correlationId,
        request: req,
      },
      'Webhook verification failed - missing webhook-timestamp header',
    );
    return error(err.toJSON());
  }

  try {
    // Get the webhook secret
    const secret = getWebhookSecret(options);

    // Convert headers to string if they're arrays
    const signatureStr = Array.isArray(signature)
      ? signature[0]
      : (signature as string);
    const webhookIdStr = Array.isArray(webhookId)
      ? webhookId[0]
      : (webhookId as string);
    const timestampStr = Array.isArray(timestamp)
      ? timestamp[0]
      : (timestamp as string);

    // Generate the expected HMAC signature
    const expectedSignature = generateHmac(
      secret,
      webhookIdStr,
      timestampStr,
      req.body || '',
    );

    // Compare signatures
    if (signatureStr !== expectedSignature) {
      const err = new InvalidWebhookSignatureError({ correlationId });
      logger.debug(
        {
          error: err.name,
          correlationId,
          request: req,
        },
        'Webhook verification failed - invalid signature',
      );
      return error(err.toJSON());
    }

    return ok(undefined);
  } catch (err) {
    if (err instanceof VerificationError) {
      logger.debug(
        {
          error: err.name,
          correlationId,
          request: req,
        },
        'Webhook verification error',
      );
      return error(err.toJSON());
    }

    // Generic verification failure
    const verificationError = new InvalidWebhookSignatureError({
      correlationId,
    });
    logger.debug(
      {
        originalError: err,
        error: verificationError.name,
        correlationId,
        request: req,
      },
      'Webhook verification error - generic failure',
    );
    return error(verificationError.toJSON());
  }
}
