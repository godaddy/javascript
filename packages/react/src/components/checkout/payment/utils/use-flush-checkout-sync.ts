import { useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import {
  type CheckoutFormData,
  useCheckoutContext,
} from '@/components/checkout/checkout';
import { useDraftOrderSyncQueue } from '@/components/checkout/order/draft-order-sync-provider';
import { useDraftOrder } from '@/components/checkout/order/use-draft-order';
import {
  checkoutMutationKeys,
  checkoutQueryKeys,
} from '@/components/checkout/utils/query-keys';
import { getPickupBillingNamesPatch } from '@/components/checkout/utils/sync-pickup-billing-names';

const DEFAULT_TIMEOUT_MS = 10_000;
const POLL_INTERVAL_MS = 50;
const CHECKOUT_SYNC_ERROR = 'DRAFT_ORDER_UPDATE_FAILED';

interface FlushCheckoutSyncOptions {
  timeoutMs?: number;
  includeFetches?: boolean;
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function useFlushCheckoutSync() {
  const queryClient = useQueryClient();
  const form = useFormContext<CheckoutFormData>();
  const { session, setCheckoutErrors } = useCheckoutContext();
  const { data: draftOrder } = useDraftOrder();
  const { enqueueDraftOrderPatch, flushDraftOrderSync } =
    useDraftOrderSyncQueue();

  return React.useCallback(
    async (options: FlushCheckoutSyncOptions = {}) => {
      try {
        // Pickup names live in AddressForm onlyNames, which debounces before
        // enqueue. Flush only drains already-queued patches — so queue the
        // current form names here before draining (standard + confirm paths).
        const pickupNamesPatch = getPickupBillingNamesPatch(form, draftOrder);
        if (pickupNamesPatch) {
          enqueueDraftOrderPatch(pickupNamesPatch, {
            fieldNames: ['billingFirstName', 'billingLastName'],
          });
        }

        await flushDraftOrderSync();

        const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
        const includeFetches = options.includeFetches ?? true;
        const startedAt = Date.now();
        const sessionId = session?.id;

        const criticalMutationKeys = [
          checkoutMutationKeys.updateDraftOrder(sessionId),
          checkoutMutationKeys.applyDiscount(sessionId),
          checkoutMutationKeys.applyDeliveryMethod(sessionId),
          checkoutMutationKeys.applyFulfillmentLocation(sessionId),
          ...(session?.enableTaxCollection
            ? [checkoutMutationKeys.updateDraftOrderTaxes(sessionId)]
            : []),
          ...(session?.enableShipping
            ? [
                checkoutMutationKeys.applyShippingMethod(sessionId),
                checkoutMutationKeys.removeShippingMethod(sessionId),
              ]
            : []),
        ];

        const criticalQueryKeys = [
          checkoutQueryKeys.draftOrder(sessionId),
          ...(session?.enableShipping
            ? [checkoutQueryKeys.draftOrderShippingMethods(sessionId)]
            : []),
        ];

        while (true) {
          const pendingMutations = criticalMutationKeys.reduce(
            (count, mutationKey) =>
              count + queryClient.isMutating({ mutationKey }),
            0
          );

          const pendingFetches = includeFetches
            ? criticalQueryKeys.reduce(
                (count, queryKey) =>
                  count + queryClient.isFetching({ queryKey }),
                0
              )
            : 0;

          if (pendingMutations === 0 && pendingFetches === 0) {
            return;
          }

          if (Date.now() - startedAt > timeoutMs) {
            throw new Error('Timed out waiting for checkout sync to settle');
          }

          await delay(POLL_INTERVAL_MS);
        }
      } catch (error) {
        setCheckoutErrors([CHECKOUT_SYNC_ERROR]);
        throw error;
      }
    },
    [
      draftOrder,
      enqueueDraftOrderPatch,
      flushDraftOrderSync,
      form,
      queryClient,
      session,
      setCheckoutErrors,
    ]
  );
}
