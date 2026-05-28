import * as React from 'react';
import { type UseFormReturn, useFormContext } from 'react-hook-form';
import {
  type CheckoutFormData,
  useCheckoutContext,
} from '@/components/checkout/checkout';
import { useDraftOrderSyncQueue } from '@/components/checkout/order/draft-order-sync-provider';
import { useDraftOrder } from '@/components/checkout/order/use-draft-order';
import type { DraftOrder, UpdateDraftOrderInput } from '@/types';

// Helper function to merge updates while preserving existing behavior around
// copying explicit shipping patches to billing when the user has selected
// "use shipping address as billing address".
function mergeWithExistingFormData(
  updates: Omit<UpdateDraftOrderInput['input'], 'context'>,
  form: UseFormReturn<CheckoutFormData>,
  draftOrder: DraftOrder | null | undefined,
  preserveFormData = true
): Omit<UpdateDraftOrderInput['input'], 'context'> {
  if (!preserveFormData || !draftOrder) return updates;

  const useShippingAddress = form.getValues('paymentUseShippingAddress');
  const result = { ...updates };

  // If updating shipping, only include changed shipping data
  if (updates.shipping) {
    // Only include explicit shipping updates. Other form values may be newer than
    // the cached draft order but belong to separate sync hooks; merging all of
    // them here can re-send stale defaults after checkout confirmation/refetches.
    result.shipping = updates.shipping;

    // If paymentUseShippingAddress is true, also update billing with the same
    // explicit shipping patch, not the entire current shipping form snapshot.
    if (useShippingAddress && result.shipping) {
      result.billing = {
        ...result.shipping,
      };
    }
  }

  // If updating billing, only include changed billing data
  if (updates.billing && !useShippingAddress) {
    // Only include explicit billing updates. This avoids a names-only billing
    // form syncing hidden/stale billing address fields.
    result.billing = updates.billing;
  }

  return result;
}

export function useDraftOrderFieldSync<T>({
  data,
  deps,
  enabled,
  mapToInput,
  key,
  fieldNames,
  preserveFormData = true,
}: {
  data: T;
  deps: React.DependencyList;
  enabled: boolean;
  mapToInput: (data: T) => Omit<UpdateDraftOrderInput['input'], 'context'>;
  key: string;
  fieldNames?: string[];
  preserveFormData?: boolean;
}) {
  const lastSubmittedRef = React.useRef<Record<string, string>>({});
  const { enqueueDraftOrderPatch } = useDraftOrderSyncQueue();
  const { session, isConfirmingCheckout } = useCheckoutContext();
  const { data: draftOrderData } = useDraftOrder();
  const form = useFormContext<CheckoutFormData>();

  React.useEffect(() => {
    if (!enabled || isConfirmingCheckout) return;

    const memoKey = key ?? 'default';
    const currentSerialized = JSON.stringify(data);

    const hasChanged = lastSubmittedRef.current[memoKey] !== currentSerialized;

    if (!hasChanged) return;

    lastSubmittedRef.current[memoKey] = currentSerialized;

    if (!session) return;
    const { channelId, storeId } = session;
    if (!channelId || !storeId || !draftOrderData?.id) return;

    const rawInput = mapToInput(data);
    const input = mergeWithExistingFormData(
      rawInput,
      form,
      draftOrderData,
      preserveFormData
    );

    // Don't sync if input is effectively empty (only contains context/customerId)
    const hasActualContent = Object.entries(input).some(
      ([inputKey, value]) =>
        inputKey !== 'context' && inputKey !== 'customerId' && value != null
    );

    if (!hasActualContent) return;

    enqueueDraftOrderPatch(input, {
      fieldNames,
      debounceMs: 1000,
    });
  }, [
    isConfirmingCheckout,
    enabled,
    data,
    mapToInput,
    key,
    enqueueDraftOrderPatch,
    session,
    form,
    fieldNames,
    preserveFormData,
    draftOrderData,
    ...deps,
  ]);
}
