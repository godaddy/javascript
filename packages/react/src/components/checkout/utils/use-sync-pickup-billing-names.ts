import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { type CheckoutFormData } from '@/components/checkout/checkout';
import { useDraftOrderSyncQueue } from '@/components/checkout/order/draft-order-sync-provider';
import { useDraftOrder } from '@/components/checkout/order/use-draft-order';
import { getPickupBillingNamesPatch } from '@/components/checkout/utils/sync-pickup-billing-names';

/**
 * Queue current pickup billing names immediately (bypass AddressForm debounce)
 * and drain the draft-order sync queue. Call before confirm / express submit.
 */
export function useSyncPickupBillingNames() {
  const form = useFormContext<CheckoutFormData>();
  const { data: draftOrder } = useDraftOrder();
  const { enqueueDraftOrderPatch, flushDraftOrderSync } =
    useDraftOrderSyncQueue();

  return useCallback(async () => {
    const patch = getPickupBillingNamesPatch(form, draftOrder);
    if (!patch) {
      return;
    }

    enqueueDraftOrderPatch(patch, {
      fieldNames: ['billingFirstName', 'billingLastName'],
    });
    await flushDraftOrderSync();
  }, [enqueueDraftOrderPatch, flushDraftOrderSync, form, draftOrder]);
}
