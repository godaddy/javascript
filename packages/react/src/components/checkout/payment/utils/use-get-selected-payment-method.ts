import { useMemo } from 'react';
import { useCheckoutContext } from '@/components/checkout/checkout';
import type { PaymentMethodConfig, PaymentMethodValue } from '@/types';

export function useGetSelectedPaymentMethod(
  paymentMethod: PaymentMethodValue | undefined | null
): PaymentMethodConfig | null {
  const { session } = useCheckoutContext();

  return useMemo(() => {
    if (!paymentMethod || !session?.paymentMethods) return null;

    const paymentMethods = session.paymentMethods as unknown as Partial<
      Record<PaymentMethodValue, PaymentMethodConfig>
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
