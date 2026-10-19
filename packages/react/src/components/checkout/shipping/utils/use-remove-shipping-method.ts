import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ResultOf } from 'gql.tada';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { getDraftOrderDiscountCodes } from '@/components/checkout/discount/utils/get-draft-order-discount-codes';
import { useApplyDiscountCore } from '@/components/checkout/discount/utils/use-apply-discount-core';
import { useDraftOrder } from '@/components/checkout/order/use-draft-order';
import {
  checkoutMutationKeys,
  checkoutQueryKeys,
} from '@/components/checkout/utils/query-keys';
import { useGoDaddyContext } from '@/godaddy-provider';
import type { DraftOrderQuery } from '@/lib/godaddy/checkout-queries.ts';
import { removeShippingMethod } from '@/lib/godaddy/godaddy';
import type { RemoveAppliedCheckoutSessionShippingMethodInput } from '@/types';

export function useRemoveShippingMethod() {
  const { session, jwt } = useCheckoutContext();
  const { apiHost } = useGoDaddyContext();
  const queryClient = useQueryClient();
  const { data: order } = useDraftOrder();
  // The core mutation skips shipping reconciliation, which could otherwise
  // re-apply a shipping method right after it is removed.
  const applyDiscount = useApplyDiscountCore();

  return useMutation({
    mutationKey: checkoutMutationKeys.removeShippingMethod(session?.id),
    mutationFn: async (
      input: RemoveAppliedCheckoutSessionShippingMethodInput['input']
    ) => {
      const data = jwt
        ? await removeShippingMethod(input, { accessToken: jwt }, apiHost)
        : await removeShippingMethod(input, session, apiHost);
      return data;
    },
    onSuccess: async data => {
      if (!session) return;

      // Extract shippingTotal from mutation response
      const shippingTotal =
        data?.removeAppliedCheckoutSessionShippingMethod?.draftOrder?.totals
          ?.shippingTotal;

      // Update the cached draft-order query (includes totals)
      if (shippingTotal) {
        queryClient.setQueryData(
          checkoutQueryKeys.draftOrder(session.id),
          (old: ResultOf<typeof DraftOrderQuery> | undefined) => {
            if (!old) return old;
            return {
              ...old,
              checkoutSession: {
                ...old.checkoutSession,
                draftOrder: {
                  ...old?.checkoutSession?.draftOrder,
                  shippingLines: [],
                  totals: {
                    ...old?.checkoutSession?.draftOrder?.totals,
                    shippingTotal: {
                      ...shippingTotal,
                    },
                  },
                },
              },
            };
          }
        );
      }

      const discountCodes = getDraftOrderDiscountCodes(order);

      if (session.enablePromotionCodes && discountCodes.length) {
        await applyDiscount.mutateAsync({ discountCodes });
      }

      await queryClient.invalidateQueries({
        queryKey: checkoutQueryKeys.draftOrder(session.id),
      });
    },
  });
}
