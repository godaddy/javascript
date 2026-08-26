import { useQueryClient } from '@tanstack/react-query';
import { useFormContext } from 'react-hook-form';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { DeliveryMethods } from '@/components/checkout/delivery/delivery-methods';
import { useDraftOrder } from '@/components/checkout/order/use-draft-order';
import { useUpdateTaxes } from '@/components/checkout/order/use-update-taxes';
import { buildShippingPayload } from '@/components/checkout/shipping/utils/build-shipping-payload';
import {
  getShippingMethodsKey,
  requiresShippingReconciliation,
  selectShippingMethod,
} from '@/components/checkout/shipping/utils/requires-shipping-reconciliation';
import { useApplyShippingMethodCore } from '@/components/checkout/shipping/utils/use-apply-shipping-method-core';
import { useDraftOrderShippingMethods } from '@/components/checkout/shipping/utils/use-draft-order-shipping-methods';
import { checkoutQueryKeys } from '@/components/checkout/utils/query-keys';
import {
  type ApplyDiscountVariables,
  useApplyDiscountCore,
} from './use-apply-discount-core';

export function useReconcileAfterDiscount() {
  const { session } = useCheckoutContext();
  const form = useFormContext();
  const queryClient = useQueryClient();
  const updateTaxes = useUpdateTaxes();
  const { data: draftOrder } = useDraftOrder();
  const shippingMethodsQuery = useDraftOrderShippingMethods();
  const applyShippingMethod = useApplyShippingMethodCore();
  const reapplyDiscount = useApplyDiscountCore();

  return async (variables: ApplyDiscountVariables) => {
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

      if (shippingRequiresReconciliation) {
        const currentServiceCode =
          form.getValues('shippingMethod') ||
          draftOrder?.shippingLines?.[0]?.requestedService;
        const { selectedMethod } = selectShippingMethod({
          shippingMethods: refreshedMethods ?? [],
          currentServiceCode,
          previousMethodsKey: getShippingMethodsKey(previousShippingMethods),
        });

        form.setValue('shippingMethod', selectedMethod?.serviceCode ?? '', {
          shouldDirty: false,
        });
        await applyShippingMethod.mutateAsync(
          selectedMethod ? buildShippingPayload(selectedMethod) : []
        );

        if (session.enablePromotionCodes && variables.discountCodes?.length) {
          await reapplyDiscount.mutateAsync(variables);
        }

        if (session.enableTaxCollection) {
          await updateTaxes.mutateAsync(undefined);
        } else {
          await invalidateDraftOrder();
        }
        return;
      }
    }

    if (session.enableTaxCollection) {
      if (deliveryMethod === DeliveryMethods.PICKUP) {
        const pickupLocationId = form.getValues('pickupLocationId');
        const locationAddress = session.locations?.find(
          location => location.id === pickupLocationId
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
      } else if (shippingAddress?.postalCode && shippingAddress?.countryCode) {
        await updateTaxes.mutateAsync(undefined);
        return;
      }
    }

    await invalidateDraftOrder();
  };

  function invalidateDraftOrder() {
    return queryClient.invalidateQueries({
      queryKey: checkoutQueryKeys.draftOrder(session?.id),
    });
  }
}
