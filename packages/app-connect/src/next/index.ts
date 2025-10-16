import type { VerifiableRequest } from '../types/verifiable-request';
import type {
  VerificationOptions,
  WebhookVerificationOptions,
} from '../utils/config';
import { verifyAction as coreVerifyAction } from '../utils/verification';
import { verifyWebhookSubscription as coreVerifyWebhookSubscription } from '../utils/webhook';

// Re-export the VerifiableRequest type for Next.js users
export type { VerifiableRequest } from '../types/verifiable-request';

/**
 * Verifies a signed action request in a Next.js environment
 */
export function verifyAction(
  req: VerifiableRequest,
  options?: VerificationOptions,
) {
  return coreVerifyAction(req, options);
}

/**
 * Verifies a webhook subscription request in a Next.js environment
 */
export function verifyWebhookSubscription(
  req: VerifiableRequest,
  options?: WebhookVerificationOptions,
) {
  return coreVerifyWebhookSubscription(req, options);
}
