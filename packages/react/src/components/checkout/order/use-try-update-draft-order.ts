import { useCallback } from 'react';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useUpdateOrder } from '@/components/checkout/order/use-update-order';
import type { UpdateDraftOrderInput } from '@/types';

export function useTryUpdateDraftOrder() {
  const updateDraftOrder = useUpdateOrder();
  const { session } = useCheckoutContext();

  return useCallback(
    (input: Omit<UpdateDraftOrderInput['input'], 'context'>) => {
      if (!session) return;
      const { channelId, storeId, draftOrder, customerId } = session;
      if (!channelId || !storeId || !draftOrder?.id) return;

      updateDraftOrder.mutate({
        input: {
          ...input,
          context: { channelId, storeId },
          ...(customerId ? { customerId } : {}),
        },
      });
    },
    [session, updateDraftOrder]
  );
}
