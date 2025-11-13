import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ResultOf } from 'gql.tada';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useDiscountApply } from '@/components/checkout/discount';
import { useDraftOrder } from '@/components/checkout/order/use-draft-order';
import { useGoDaddyContext } from '@/godaddy-provider';
import type { DraftOrderQuery } from '@/lib/godaddy/checkout-queries.ts';
import { removeShippingMethod } from '@/lib/godaddy/godaddy';
import type { RemoveAppliedCheckoutSessionShippingMethodInput } from '@/types';

export function useRemoveShippingMethod() {
  const { session, jwt } = useCheckoutContext();
  const { apiHost } = useGoDaddyContext();
  const queryClient = useQueryClient();
  const { data: order } = useDraftOrder();
  const applyDiscount = useDiscountApply();

  return useMutation({
    mutationKey: session?.id
      ? ['remove-shipping-method', session.id]
      : ['remove-shipping-method'],
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

      // Add line item-level discount codes
      if (order?.lineItems) {
        for (const lineItem of order.lineItems) {
          if (lineItem?.discounts) {
            for (const discount of lineItem.discounts) {
              if (discount.code) {
                allCodes.add(discount.code);
              }
            }
          }
        }
      }

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
      }
    },
  });
}
