import { useQueryClient } from '@tanstack/react-query';
import { useFormContext } from 'react-hook-form';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { DeliveryMethods } from '@/components/checkout/delivery/delivery-methods';
import { useDraftOrder } from '@/components/checkout/order/use-draft-order';
import { useUpdateTaxes } from '@/components/checkout/order/use-update-taxes';
import { buildShippingPayload } from '@/components/checkout/shipping/utils/build-shipping-payload';
import {
  getCurrentShippingServiceCode,
  requiresShippingReconciliation,
  selectShippingMethod,
} from '@/components/checkout/shipping/utils/requires-shipping-reconciliation';
import { useApplyShippingMethodCore } from '@/components/checkout/shipping/utils/use-apply-shipping-method-core';
import { useDraftOrderShippingMethods } from '@/components/checkout/shipping/utils/use-draft-order-shipping-methods';
import { checkoutQueryKeys } from '@/components/checkout/utils/query-keys';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';
import {
  type ApplyDiscountVariables,
  useApplyDiscountCore,
} from './use-apply-discount-core';

export function useReconcileAfterDiscount() {
  const { session, setCheckoutErrors } = useCheckoutContext();
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
      const { data, isError } = await shippingMethodsQuery.refetch();
      // A failed refresh is treated as "no rates": the coupon may have changed
      // what the saved line should cost, so the line is cleared rather than kept
      // unverified. Confirm's shipping guard then blocks payment from the real
      // order state until the customer retries and a method is re-applied.
      const refreshedMethods = isError ? [] : (data ?? []);
      const isAutoSelected = Boolean(
        form.getValues('shippingMethodAutoSelected')
      );
      const currentServiceCode = getCurrentShippingServiceCode({
        formServiceCode: form.getValues('shippingMethod'),
        shippingLineServiceCode:
          draftOrder?.shippingLines?.[0]?.requestedService,
        isAutoSelected,
      });
      const shippingRequiresReconciliation = requiresShippingReconciliation({
        shippingMethods: refreshedMethods,
        previousShippingMethods,
        currentShippingLine: draftOrder?.shippingLines?.[0],
        selectedServiceCode: currentServiceCode,
        isAutoSelected,
      });

      if (shippingRequiresReconciliation) {
        const { selectedMethod, autoSelected } = selectShippingMethod({
          shippingMethods: refreshedMethods,
          currentServiceCode,
          previousShippingMethods,
          isAutoSelected,
        });

        try {
          await applyShippingMethod.mutateAsync(
            selectedMethod ? buildShippingPayload(selectedMethod) : []
          );
        } catch (error) {
          if (
            error instanceof GraphQLErrorWithCodes &&
            error.codes.length > 0
          ) {
            setCheckoutErrors(error.codes);
          } else {
            setCheckoutErrors(['SHIPPING_METHOD_APPLICATION_FAILED']);
          }

          // The failed reapplication left the order's shipping line stale
          // (possibly no longer valid, e.g. a coupon that granted it is gone).
          // Clear it server-side so the order itself is no longer stale,
          // rather than just invalidating caches around unchanged data. If the
          // failed attempt was already a clear (no selectedMethod), retrying
          // the identical call would just duplicate the request for no gain.
          if (selectedMethod) {
            try {
              await applyShippingMethod.mutateAsync([]);
              form.setValue('shippingMethod', '', { shouldDirty: false });
            } catch {
              // Clearing failed too; fall through to invalidation below so
              // mounted views still refresh against whatever the server has.
            }
          }

          // Invalidate after the clear settles so the refetch it triggers
          // picks up the now-actually-empty shippingLines instead of racing
          // ahead of the clear and re-caching the stale line.
          await queryClient.invalidateQueries({
            queryKey: checkoutQueryKeys.draftOrder(session.id),
          });
          await queryClient.invalidateQueries({
            queryKey: checkoutQueryKeys.draftOrderShippingMethods(session.id),
          });
          return;
        }

        setCheckoutErrors(undefined);
        form.setValue('shippingMethod', selectedMethod?.serviceCode ?? '', {
          shouldDirty: false,
        });
        form.setValue('shippingMethodAutoSelected', autoSelected, {
          shouldDirty: false,
        });

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
