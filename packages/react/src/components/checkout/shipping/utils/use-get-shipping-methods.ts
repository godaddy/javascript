import { useMutation } from '@tanstack/react-query';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useCheckoutApi } from '@/hooks/use-checkout-api';
import type { GetCheckoutSessionShippingRatesInput } from '@/types';

export function useGetShippingMethodByAddress() {
  const { session } = useCheckoutContext();
  const api = useCheckoutApi(session);

  return useMutation({
    mutationKey: ['get-shipping-method-by-address', { sessionId: session?.id }],
    mutationFn: async (
      destination: GetCheckoutSessionShippingRatesInput['destination']
    ) => {
      if (!session) return;

      const data = await api.getDraftOrderShippingRates(destination);

      return (
        data.checkoutSession?.draftOrder?.calculatedShippingRates?.rates || []
      );
    },
  });
}
