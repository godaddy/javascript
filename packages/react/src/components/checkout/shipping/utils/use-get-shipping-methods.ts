import { useMutation } from '@tanstack/react-query';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { getDraftOrderShippingMethods } from '@/lib/godaddy/godaddy';
import type { GetCheckoutSessionShippingRatesInput } from '@/types';

export function useGetShippingMethodByAddress() {
  const { session } = useCheckoutContext();

  return useMutation({
    mutationKey: ['get-shipping-method-by-address', { sessionId: session?.id }],
    mutationFn: async (destination: GetCheckoutSessionShippingRatesInput['destination']) => {
      if (!session) return;

      const data = await getDraftOrderShippingMethods(session, destination);

      return data.checkoutSession?.draftOrder?.calculatedShippingRates?.rates || [];
    },
  });
}
