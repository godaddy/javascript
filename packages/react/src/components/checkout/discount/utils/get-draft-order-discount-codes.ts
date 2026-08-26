import type { DraftOrder } from '@/types';

export function getDraftOrderDiscountCodes(
  draftOrder?: DraftOrder | null
): string[] {
  const codes = new Set<string>();

  for (const discount of draftOrder?.discounts ?? []) {
    if (discount.code) codes.add(discount.code);
  }

  for (const lineItem of draftOrder?.lineItems ?? []) {
    for (const discount of lineItem.discounts ?? []) {
      if (discount.code) codes.add(discount.code);
    }
  }

  for (const shippingLine of draftOrder?.shippingLines ?? []) {
    for (const discount of shippingLine.discounts ?? []) {
      if (discount.code) codes.add(discount.code);
    }
  }

  return Array.from(codes).sort();
}
