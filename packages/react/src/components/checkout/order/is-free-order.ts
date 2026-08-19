import { useDraftOrderTotals } from '@/components/checkout/order/use-draft-order';
import type { Totals } from '@/types';

/**
 * Single definition of "free order" so the rendered payment form, the trigger
 * field filter, and the schema all agree. A missing total is treated as free to
 * match the order summary, which renders an absent total as 0.
 */
export function isFreeOrderTotal(totals?: Totals | null): boolean {
  return (totals?.total?.value ?? 0) <= 0;
}

export function useIsFreeOrder(): boolean {
  const { data: totals } = useDraftOrderTotals();
  return isFreeOrderTotal(totals);
}
