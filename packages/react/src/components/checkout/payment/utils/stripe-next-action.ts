import { getPaymentActionRequiredResult } from '@/lib/graphql-with-errors';

export function getStripeNextAction(
  error: unknown
): { clientSecret: string; paymentReference: string } | undefined {
  const result = getPaymentActionRequiredResult(error);
  const step = result?.nextStep;
  if (
    result?.provider !== 'STRIPE' ||
    typeof result.paymentReference !== 'string' ||
    !result.paymentReference.trim() ||
    step?.type !== 'SDK_ACTION' ||
    step.sdk !== 'STRIPE_JS' ||
    step.action !== 'HANDLE_NEXT_ACTION' ||
    typeof step.clientSecret !== 'string' ||
    !step.clientSecret.trim()
  )
    return undefined;
  return {
    clientSecret: step.clientSecret,
    paymentReference: result.paymentReference,
  };
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
