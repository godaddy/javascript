import { useDraftOrderTotals } from '@/components/checkout/order/use-draft-order';
import type { Totals } from '@/types';

/**
 * Single definition of "free order" so the rendered payment form, the trigger
 * field filter, and the schema all agree.
 */
export function isFreeOrderTotal(totals?: Totals | null): boolean {
  const totalValue = totals?.total?.value;
  return typeof totalValue === 'number' && totalValue <= 0;
}

export function useIsFreeOrder(): boolean {
  const { data: totals } = useDraftOrderTotals();
  return isFreeOrderTotal(totals);
}
