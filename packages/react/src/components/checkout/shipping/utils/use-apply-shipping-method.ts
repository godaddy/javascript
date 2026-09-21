import { useQueryClient } from '@tanstack/react-query';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useApplyDiscountCore } from '@/components/checkout/discount/utils/use-apply-discount-core';
import { useDraftOrder } from '@/components/checkout/order/use-draft-order';
import { useUpdateTaxes } from '@/components/checkout/order/use-update-taxes';
import { checkoutQueryKeys } from '@/components/checkout/utils/query-keys';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';
import { useApplyShippingMethodCore } from './use-apply-shipping-method-core';

export function useApplyShippingMethod() {
  const { session, setCheckoutErrors } = useCheckoutContext();
  const { data: order } = useDraftOrder();
  const updateTaxes = useUpdateTaxes();
  const applyDiscount = useApplyDiscountCore();
  const queryClient = useQueryClient();

  return useApplyShippingMethodCore({
    onSuccess: async () => {
      setCheckoutErrors(undefined);
      if (!session) return;

      const allCodes = new Set<string>();

      if (order?.discounts) {
        for (const discount of order.discounts) {
          if (discount.code) {
            allCodes.add(discount.code);
          }
        }
      }

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

      if (session.enablePromotionCodes && discountCodes.length) {
        await applyDiscount.mutateAsync({ discountCodes });
      }

      if (session.enableTaxCollection) {
        await updateTaxes.mutateAsync(undefined);
      } else {
        await queryClient.invalidateQueries({
          queryKey: checkoutQueryKeys.draftOrder(session.id),
        });
      }
    },
    onError: error => {
      if (error instanceof GraphQLErrorWithCodes && error.codes.length > 0) {
        setCheckoutErrors(error.codes);
        return;
      }

      setCheckoutErrors(['SHIPPING_METHOD_APPLICATION_FAILED']);
    },
  });
}
