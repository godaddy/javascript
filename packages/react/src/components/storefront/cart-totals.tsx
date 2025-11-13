import {
  DraftOrderTotals,
  DraftOrderTotalsProps,
} from '@/components/checkout/totals/totals.tsx';

export function CartTotals({
  ...props
}: Omit<DraftOrderTotalsProps, 'enableDiscounts'>) {
  return <DraftOrderTotals {...props} enableDiscounts={false} />;
}
