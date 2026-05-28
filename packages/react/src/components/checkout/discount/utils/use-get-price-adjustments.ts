import { useMutation } from '@tanstack/react-query';

import { useCheckoutContext } from '@/components/checkout/checkout';
import { checkoutMutationKeys } from '@/components/checkout/utils/query-keys';
import { useGoDaddyContext } from '@/godaddy-provider';
import { getDraftOrderPriceAdjustments } from '@/lib/godaddy/godaddy';
import type {
  CalculatedAdjustments,
  DraftOrderPriceAdjustmentsQueryInput,
} from '@/types';

type Vars = {
  discountCodes: DraftOrderPriceAdjustmentsQueryInput['discountCodes'];
  shippingLines?: DraftOrderPriceAdjustmentsQueryInput['shippingLines'];
};

export function useGetPriceAdjustments() {
  const { session, jwt } = useCheckoutContext();
  const { apiHost } = useGoDaddyContext();

  return useMutation<CalculatedAdjustments | null | undefined, Error, Vars>({
    mutationKey: checkoutMutationKeys.getPriceAdjustments(session?.id),
    mutationFn: async ({ discountCodes, shippingLines }) => {
      const data = jwt
        ? await getDraftOrderPriceAdjustments(
            { accessToken: jwt },
            discountCodes,
            shippingLines,
            apiHost
          )
        : await getDraftOrderPriceAdjustments(
            session,
            discountCodes,
            shippingLines,
            apiHost
          );

      return data.checkoutSession?.draftOrder?.calculatedAdjustments;
    },
  });
}
