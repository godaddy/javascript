import { useMutation } from '@tanstack/react-query';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useCheckoutApi } from '@/hooks/use-checkout-api';
import type { GetCheckoutSessionTaxesInput } from '@/types';

export function useGetTaxes() {
  const { session } = useCheckoutContext();
  const api = useCheckoutApi(session);

  return useMutation({
    mutationKey: ['get-taxes-without-order', { sessionId: session?.id }],
    mutationFn: async ({
      destination,
      lines,
    }: {
      destination?: GetCheckoutSessionTaxesInput['destination'];
      lines?: GetCheckoutSessionTaxesInput['lines'];
    }) => {
      if (!session) return;

      const data = await api.getDraftOrderTaxes(destination);

      return data.checkoutSession?.draftOrder?.calculatedTaxes?.totalTaxAmount;
    },
  });
}
