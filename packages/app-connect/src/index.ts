// Export main verification functions
export { verifyAction } from './utils/verification';
export { verifyWebhookSubscription } from './utils/webhook';

// Export framework adapters
export { createActionMiddleware, createWebhookMiddleware } from './express';
export * as next from './next';
export * as tanstack from './tanstack';

// Export types
export type { Result } from './types/result';
export type { VerifiableRequest } from './types/verifiable-request';

// Export errors
export { VerificationError } from './errors/base-error';
export {
  MissingHeaderError,
  ExpiredSignatureError,
  InvalidSignatureError,
  InvalidAlgorithmError,
  InvalidVersionError,
} from './errors/verification-errors';
// Export webhook verification types and errors
export {
  InvalidWebhookSignatureError,
  MissingWebhookHeaderError,
} from './utils/webhook';

// Export action verification types and options
export type {
  VerificationOptions,
  WebhookVerificationOptions,
} from './utils/config';

// Export error schema types
export type {
  GoDaddyError,
  ErrorDetails,
  LinkDescription,
} from './types/error-schema';
