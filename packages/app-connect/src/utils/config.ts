import type { GoDaddyError } from '../types/error-schema';
import { base64ToArrayBuffer } from './strings';

/**
 * Configuration options for request verification
 */
export interface VerificationOptions {
  /**
   * The public key to use for verification.
   * If not provided, it will be read from the GODADDY_PUBLIC_KEY environment variable.
   */
  publicKey?: string;

  /**
   * The maximum age of a signature timestamp in seconds.
   * Default is 300 seconds (5 minutes).
   */
  maxTimestampAgeSeconds?: number;
}

/**
 * Configuration options for webhook subscription verification
 */
export interface WebhookVerificationOptions {
  /**
   * The secret to use for verification.
   * If not provided, it will be read from the GODADDY_WEBHOOK_SECRET environment variable.
   */
  secret?: string;

  /**
   * Refuse a body that is not the raw bytes the platform signed (a string,
   * Buffer or ArrayBuffer), instead of falling back to `JSON.stringify` of a
   * parsed body. A re-serialized body can differ from what was signed (key
   * order, spacing, escapes), so the fallback can refuse real deliveries.
   * A missing body (undefined) is refused too, since it usually means the raw
   * body was lost; pass `Buffer.alloc(0)` for a request that had no body.
   * Off by default for direct calls; the Express and TanStack middleware turn it on.
   */
  strictRawBody?: boolean;

  /**
   * When set, refuse a delivery whose `webhook-timestamp` (Unix seconds) is more
   * than this many seconds away from now. Off by default, because the platform's
   * retry timing is not documented and a retried delivery refused as too old is lost.
   * Use a few minutes at least: 0 only accepts a delivery checked in the same
   * second it was signed, which network delay alone usually misses.
   */
  toleranceSeconds?: number;
}

/**
 * Constants for verification
 */
export const VERIFICATION_CONSTANTS = {
  SUPPORTED_ALGORITHM: 'ECDSA-P256-SHA256',
  SUPPORTED_VERSION: '1.0',
  DEFAULT_MAX_TIMESTAMP_AGE_SECONDS: 300, // 5 minutes
};

/** Error name for a webhook whose raw body is unavailable under strict verification. */
export const WEBHOOK_RAW_BODY_REQUIRED = 'WEBHOOK_RAW_BODY_REQUIRED';

/** Error name for webhook verification without a configured secret. */
export const WEBHOOK_SECRET_REQUIRED = 'WEBHOOK_SECRET_REQUIRED';

/** Error name for webhook options that would refuse every delivery. */
export const INVALID_WEBHOOK_OPTIONS = 'INVALID_WEBHOOK_OPTIONS';

/** Error name for verification that failed inside the app. */
export const WEBHOOK_VERIFICATION_FAILED = 'WEBHOOK_VERIFICATION_FAILED';

/**
 * The HTTP status to answer a failed webhook verification with. The app's own
 * problems (no raw body, no secret, bad options, an internal failure) are
 * server errors, so the sender keeps retrying while the app is fixed;
 * everything else is 401. The adapters use it; call it from your own handler
 * when you use verifyWebhookSubscription directly.
 */
export function webhookFailureStatus(errorName: string | undefined): 401 | 500 {
  return errorName === WEBHOOK_RAW_BODY_REQUIRED ||
    errorName === WEBHOOK_SECRET_REQUIRED ||
    errorName === INVALID_WEBHOOK_OPTIONS ||
    errorName === WEBHOOK_VERIFICATION_FAILED
    ? 500
    : 401;
}

/**
 * The body an adapter answers a failed webhook verification with. A setup
 * problem gets a generic body with only its correlationId, so an unsigned
 * caller learns nothing about how the app is configured; the detail is
 * logged with the same correlationId.
 */
export function webhookFailureBody(
  err: GoDaddyError | undefined,
): GoDaddyError | undefined {
  if (!err || webhookFailureStatus(err.name) !== 500) {
    return err;
  }
  return {
    name: 'WEBHOOK_VERIFICATION_UNAVAILABLE',
    message: 'Webhook verification is not available',
    correlationId: err.correlationId,
  };
}

/**
 * Describes an option that would quietly refuse every delivery, such as a
 * toleranceSeconds that is NaN or negative. Returns undefined when the
 * options are usable.
 */
export function webhookOptionsProblem(
  options?: WebhookVerificationOptions,
): string | undefined {
  const secret: unknown = options?.secret;
  // null and '' mean no secret here, as they always did: GODADDY_WEBHOOK_SECRET is used.
  if (secret !== undefined && secret !== null && typeof secret !== 'string') {
    return 'secret must be a string';
  }
  const strict: unknown = options?.strictRawBody;
  if (strict !== undefined && strict !== null && typeof strict !== 'boolean') {
    return 'strictRawBody must be true or false';
  }
  // null means not set, like undefined.
  const tolerance = options?.toleranceSeconds;
  if (
    tolerance !== undefined &&
    tolerance !== null &&
    (typeof tolerance !== 'number' ||
      !Number.isFinite(tolerance) ||
      tolerance < 0)
  ) {
    return 'toleranceSeconds must be a finite number of seconds, zero or more';
  }
  return undefined;
}

/**
 * Throws a TypeError for options that would quietly refuse every delivery,
 * so middleware fails when it is created rather than on each request.
 */
export function checkWebhookOptions(
  options?: WebhookVerificationOptions,
): void {
  const problem = webhookOptionsProblem(options);
  if (problem) {
    throw new TypeError(problem);
  }
}

/**
 * Gets the public key for verification
 */
export function getPublicKeyBuffer(options?: VerificationOptions): ArrayBuffer {
  const publicKey = options?.publicKey || process.env.GODADDY_PUBLIC_KEY;

  if (!publicKey) {
    throw new Error(
      'Public key is required for verification. Set GODADDY_PUBLIC_KEY environment variable or provide in options.',
    );
  }

  return base64ToArrayBuffer(publicKey);
}
