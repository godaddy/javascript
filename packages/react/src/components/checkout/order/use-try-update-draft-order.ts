import { useCallback } from 'react';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useDraftOrderSyncQueue } from '@/components/checkout/order/draft-order-sync-provider';
import type { UpdateDraftOrderInput } from '@/types';

export function useTryUpdateDraftOrder() {
  const { enqueueDraftOrderPatch } = useDraftOrderSyncQueue();
  const { session } = useCheckoutContext();

  return useCallback(
    (input: Omit<UpdateDraftOrderInput['input'], 'context'>) => {
      if (!session) return;
      const { channelId, storeId, draftOrder } = session;
      if (!channelId || !storeId || !draftOrder?.id) return;

      enqueueDraftOrderPatch(input, {
        immediate: true,
      });
    },
    [enqueueDraftOrderPatch, session]
  );
}
