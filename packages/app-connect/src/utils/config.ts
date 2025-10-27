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
}

/**
 * Constants for verification
 */
export const VERIFICATION_CONSTANTS = {
  SUPPORTED_ALGORITHM: 'ECDSA-P256-SHA256',
  SUPPORTED_VERSION: '1.0',
  DEFAULT_MAX_TIMESTAMP_AGE_SECONDS: 300, // 5 minutes
};

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

/**
 * Gets the webhook secret for verification
 */
export function getWebhookSecret(options?: WebhookVerificationOptions): string {
  const secret = options?.secret || process.env.GODADDY_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error(
      'Webhook secret is required for verification. Set GODADDY_WEBHOOK_SECRET environment variable or provide in options.',
    );
  }

  return secret;
}
