import { getPaymentActionRequiredResult } from '@/lib/graphql-with-errors';

export function getStripeNextAction(
  error: unknown
): { clientSecret: string } | undefined {
  const result = getPaymentActionRequiredResult(error);
  const step = result?.nextStep;
  if (
    result?.provider !== 'STRIPE' ||
    step?.type !== 'SDK_ACTION' ||
    step.sdk !== 'STRIPE_JS' ||
    step.action !== 'HANDLE_NEXT_ACTION' ||
    typeof step.clientSecret !== 'string' ||
    !step.clientSecret.trim()
  )
    return undefined;
  return { clientSecret: step.clientSecret };
}

// Stripe SDK error codes are not customer-facing localization keys.
export function stripeCheckoutErrorCode(code?: string): string {
  switch (code) {
    case 'payment_intent_authentication_failure':
    case 'payment_intent_payment_attempt_failed':
    case 'setup_intent_authentication_failure':
      return 'AUTHORIZATION_FAILED';
    default:
      return 'TRANSACTION_PROCESSING_FAILED';
  }
}
