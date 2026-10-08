import { useQueryClient } from '@tanstack/react-query';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { getDraftOrderDiscountCodes } from '@/components/checkout/discount/utils/get-draft-order-discount-codes';
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

      // Applying discounts replaces the order's full code list, so include
      // line-item codes too or they are dropped.
      const discountCodes = getDraftOrderDiscountCodes(order);

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
