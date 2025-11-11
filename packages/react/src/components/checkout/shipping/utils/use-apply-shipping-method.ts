import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ResultOf } from 'gql.tada';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useDiscountApply } from '@/components/checkout/discount';
import { useDraftOrder } from '@/components/checkout/order/use-draft-order';
import { useUpdateTaxes } from '@/components/checkout/order/use-update-taxes';
import { useGoDaddyContext } from '@/godaddy-provider';
import type { DraftOrderQuery } from '@/lib/godaddy/checkout-queries.ts';
import { applyShippingMethod } from '@/lib/godaddy/godaddy';
import type { ApplyCheckoutSessionShippingMethodInput } from '@/types';

export function useApplyShippingMethod() {
  const { session, jwt } = useCheckoutContext();
  const { apiHost } = useGoDaddyContext();
  const { data: order } = useDraftOrder();
  const updateTaxes = useUpdateTaxes();
  const applyDiscount = useDiscountApply();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: session?.id
      ? ['apply-shipping-method', session.id]
      : ['apply-shipping-method'],
    mutationFn: async (
      shippingMethods: ApplyCheckoutSessionShippingMethodInput['input']
    ) => {
      if (!session) return;
      const data = jwt
        ? await applyShippingMethod(
            shippingMethods,
            { accessToken: jwt },
            apiHost
          )
        : await applyShippingMethod(shippingMethods, session, apiHost);
      return data;
    },
    onSuccess: async data => {
      if (!session) return;

      // Extract shippingTotal from mutation response
      const shippingTotal =
        data?.applyCheckoutSessionShippingMethod?.draftOrder?.totals
          ?.shippingTotal;

      // Update the cached draft-order query (includes totals)
      if (shippingTotal) {
        queryClient.setQueryData(
          ['draft-order', session.id],
          (old: ResultOf<typeof DraftOrderQuery> | undefined) => {
            if (!old) return old;

            return {
              ...old,
              checkoutSession: {
                ...old.checkoutSession,
                draftOrder: {
                  ...old?.checkoutSession?.draftOrder,
                  shippingLines: [
                    {
                      ...old?.checkoutSession?.draftOrder?.shippingLines?.[0],
                      amount: {
                        ...shippingTotal,
                      },
                    },
                  ],
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

      const allCodes = new Set<string>();

      // Add order-level discount codes
      if (order?.discounts) {
        for (const discount of order.discounts) {
          if (discount.code) {
            allCodes.add(discount.code);
          }
        }
      }

      // Line item-level discount codes do not need to be re-applied as they would not be affected by shipping method changes

      // Add shipping line-level discount codes
      if (order?.shippingLines) {
        for (const shippingLine of order.shippingLines) {
          if (shippingLine.discounts) {
            for (const discount of shippingLine.discounts) {
              if (discount.code) {
                allCodes.add(discount.code);
              }
            }
          }
        }
      }

      const discountCodes = Array.from(allCodes);

      if (session?.enablePromotionCodes && discountCodes?.length) {
        /* should re-apply discounts if they were previously applied */
        await applyDiscount.mutateAsync({
          discountCodes,
        });
      } else if (session?.enableTaxCollection) {
        updateTaxes.mutate(undefined);
      } else {
        queryClient.invalidateQueries({
          queryKey: ['draft-order', session.id],
        });
      }
    },
  });
}
