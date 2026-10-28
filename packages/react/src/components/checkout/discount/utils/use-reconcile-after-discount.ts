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
import { getProductDiscountTotal } from './get-product-discount-total';
import {
  type ApplyDiscountVariables,
  type DiscountOrder,
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

  return async (
    variables: ApplyDiscountVariables,
    updatedOrder?: DiscountOrder | null
  ) => {
    if (!session) return;

    const deliveryMethod = form.getValues('deliveryMethod');
    const shippingAddress = draftOrder?.shipping?.address;
    const hasShippingDestination = Boolean(
      shippingAddress?.addressLine1 &&
        shippingAddress.postalCode &&
        shippingAddress.countryCode
    );

    // A coupon can only change shipping rates through the product discount,
    // the one coupon input to checkout-api's rate request (adjustedOrderTotal).
    // A failed rates query is refetched regardless so the coupon acts as a retry.
    const productDiscountChanged =
      !updatedOrder ||
      getProductDiscountTotal(updatedOrder) !==
        getProductDiscountTotal(draftOrder);

    if (
      deliveryMethod === DeliveryMethods.SHIP &&
      hasShippingDestination &&
      (productDiscountChanged || shippingMethodsQuery.isError)
    ) {
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
          setCheckoutErrors(undefined);
          setShippingSelection(selectedMethod?.serviceCode, autoSelected);
        } catch (error) {
          setCheckoutErrors(
            getErrorCodes(error, 'SHIPPING_METHOD_APPLICATION_FAILED')
          );

          // The failed reapplication left the order's shipping line stale
          // (possibly no longer valid, e.g. a coupon that granted it is gone).
          // Clear it server-side so the order itself is no longer stale,
          // rather than just invalidating caches around unchanged data. If the
          // failed attempt was already a clear (no selectedMethod), retrying
          // the identical call would just duplicate the request for no gain.
          if (selectedMethod) {
            try {
              await applyShippingMethod.mutateAsync([]);
              setShippingSelection(undefined, false);
            } catch {
              // Clearing failed too; the refresh below still re-syncs mounted
              // views against whatever the server has.
            }
          }

          await queryClient.invalidateQueries({
            queryKey: checkoutQueryKeys.draftOrderShippingMethods(session.id),
          });
          // Shipping may have changed or been cleared, so totals and taxes
          // still need reconciling against the order as it now stands.
          await refreshTotals();
          return;
        }

        if (session.enablePromotionCodes && variables.discountCodes?.length) {
          try {
            await reapplyDiscount.mutateAsync(variables);
          } catch (error) {
            // The coupon was applied; only the post-shipping re-apply failed
            // (e.g. it no longer qualifies at the new shipping price). Surface
            // it without failing the original apply, and still reconcile totals.
            setCheckoutErrors(
              getErrorCodes(error, 'DISCOUNT_APPLICATION_FAILED')
            );
          }
        }

        await refreshTotals();
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

  // Taxes are recalculated from the order's saved shipping line and address.
  function refreshTotals() {
    return session?.enableTaxCollection
      ? updateTaxes.mutateAsync(undefined)
      : invalidateDraftOrder();
  }

  function setShippingSelection(
    serviceCode: string | null | undefined,
    autoSelected: boolean
  ) {
    form.setValue('shippingMethod', serviceCode ?? '', { shouldDirty: false });
    // A cleared selection has no origin, so it's never "auto selected".
    form.setValue(
      'shippingMethodAutoSelected',
      Boolean(serviceCode) && autoSelected,
      {
        shouldDirty: false,
      }
    );
  }
}

function getErrorCodes(error: unknown, fallback: string) {
  return error instanceof GraphQLErrorWithCodes && error.codes.length > 0
    ? error.codes
    : [fallback];
}
