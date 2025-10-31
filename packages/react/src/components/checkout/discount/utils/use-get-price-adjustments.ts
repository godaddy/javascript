import { useMutation } from '@tanstack/react-query';

import { useCheckoutContext } from '@/components/checkout/checkout';
import { useCheckoutApi } from '@/hooks/use-checkout-api';
import type { DraftOrderPriceAdjustmentsQueryInput } from '@/types';

export function useGetPriceAdjustments() {
  const { session } = useCheckoutContext();
  const api = useCheckoutApi(session);

  return useMutation({
    mutationKey: [
      'get-price-adjustments-by-discount-code',
      { sessionId: session?.id },
    ],
    mutationFn: async ({
      discountCodes,
      shippingLines,
    }: {
      discountCodes: DraftOrderPriceAdjustmentsQueryInput['discountCodes'];
      shippingLines?: DraftOrderPriceAdjustmentsQueryInput['shippingLines'];
    }) => {
      const data = await api.getDraftOrderPriceAdjustments(
        discountCodes ?? undefined,
        shippingLines
      );

      return data.checkoutSession?.draftOrder?.calculatedAdjustments
        ?.totalDiscountAmount?.value;
    },
  });
}
