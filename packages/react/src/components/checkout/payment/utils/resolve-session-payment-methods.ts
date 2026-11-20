import type { CheckoutSession } from '@/types';

export type SessionPaymentMethods = NonNullable<
  CheckoutSession
>['paymentMethods'];

/**
 * Prefer dynamically discovered methods under
 * `paymentProviderConfiguration.paymentMethods`; fall back to the legacy
 * top-level `session.paymentMethods` (caller-owned) when discovery is absent.
 */
export function resolveSessionPaymentMethods(
  session: CheckoutSession | null | undefined
): SessionPaymentMethods | null | undefined {
  return (
    session?.paymentProviderConfiguration?.paymentMethods ??
    session?.paymentMethods
  );
}
