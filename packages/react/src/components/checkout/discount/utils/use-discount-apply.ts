import { useQueryClient } from '@tanstack/react-query';
import { useFormContext } from 'react-hook-form';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { DeliveryMethods } from '@/components/checkout/delivery/delivery-methods';
import { useDraftOrder } from '@/components/checkout/order/use-draft-order';
import { useUpdateTaxes } from '@/components/checkout/order/use-update-taxes';
import { requiresShippingReconciliation } from '@/components/checkout/shipping/utils/requires-shipping-reconciliation';
import { useDraftOrderShippingMethods } from '@/components/checkout/shipping/utils/use-draft-order-shipping-methods';
import { checkoutQueryKeys } from '@/components/checkout/utils/query-keys';
import { useApplyDiscountCore } from './use-apply-discount-core';

export function useDiscountApply() {
  const { session } = useCheckoutContext();
  const form = useFormContext();
  const queryClient = useQueryClient();
  const updateTaxes = useUpdateTaxes();
  const { data: draftOrder } = useDraftOrder();
  const shippingMethodsQuery = useDraftOrderShippingMethods();

  return useApplyDiscountCore({
    onSuccess: async () => {
      if (!session) return;

      const deliveryMethod = form.getValues('deliveryMethod');

      const shippingAddress = draftOrder?.shipping?.address;
      const hasShippingDestination = Boolean(
        shippingAddress?.addressLine1 &&
          shippingAddress.postalCode &&
          shippingAddress.countryCode
      );

      if (deliveryMethod === DeliveryMethods.SHIP && hasShippingDestination) {
        const previousShippingMethods = shippingMethodsQuery.data ?? [];
        const { data: refreshedMethods } = await shippingMethodsQuery.refetch();
        const shippingRequiresReconciliation = requiresShippingReconciliation({
          shippingMethods: refreshedMethods ?? [],
          previousShippingMethods,
          currentShippingLine: draftOrder?.shippingLines?.[0],
          selectedServiceCode: form.getValues('shippingMethod'),
        });

        if (shippingRequiresReconciliation) return;
      }

      if (session.enableTaxCollection) {
        // TODO: Move this to API layer

        if (deliveryMethod === DeliveryMethods.PICKUP) {
          const pickupLocationId = form.getValues('pickupLocationId');
          const locationAddress = session.locations?.find(
            loc => loc.id === pickupLocationId
          )?.address;

          if (locationAddress) {
            await updateTaxes.mutateAsync(locationAddress);
            return;
          }
        } else if (
          deliveryMethod === DeliveryMethods.PURCHASE ||
          deliveryMethod === DeliveryMethods.DIGITAL
        ) {
          const billingAddress = draftOrder?.billing?.address;

          if (billingAddress?.postalCode && billingAddress?.countryCode) {
            await updateTaxes.mutateAsync(billingAddress);
            return;
          }
        } else if (
          shippingAddress?.postalCode &&
          shippingAddress?.countryCode
        ) {
          await updateTaxes.mutateAsync(undefined);
          return;
        }
      }

      await queryClient.invalidateQueries({
        queryKey: checkoutQueryKeys.draftOrder(session.id),
      });
    },
  });
}
