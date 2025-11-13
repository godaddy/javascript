import {
  DraftOrderLineItems,
  DraftOrderLineItemsProps,
} from '@/components/checkout/line-items/line-items';

export function CartLineItems({ ...props }: DraftOrderLineItemsProps) {
  return <DraftOrderLineItems {...props} />;
}
