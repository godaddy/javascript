import { useDraftOrderSyncQueue } from '@/components/checkout/order/draft-order-sync-provider';

export function useFlushDraftOrderSync() {
  return useDraftOrderSyncQueue().flushDraftOrderSync;
}
