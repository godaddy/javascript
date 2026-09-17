import { useMemo } from 'react';
import { useCheckoutContext } from '@/components/checkout/checkout';
import type { PaymentMethodConfig, PaymentMethodValue } from '@/types';

export function useGetSelectedPaymentMethod(
  paymentMethod: PaymentMethodValue | undefined | null
): PaymentMethodConfig | null {
  const { session } = useCheckoutContext();

  return useMemo(() => {
    if (!paymentMethod || !session?.paymentMethods) return null;

    // Every method on the session is individually nullable, so the cast has to
    // admit null rather than promising a config for each configured key.
    const paymentMethods = session.paymentMethods as unknown as Partial<
      Record<PaymentMethodValue, PaymentMethodConfig | null>
    >;
    const methodConfig = paymentMethods[paymentMethod];
    if (!methodConfig) return null;

    return {
      type: paymentMethod,
      processor: methodConfig.processor,
      checkoutTypes: methodConfig.checkoutTypes || [],
    };
  }, [paymentMethod, session?.paymentMethods]);
}
