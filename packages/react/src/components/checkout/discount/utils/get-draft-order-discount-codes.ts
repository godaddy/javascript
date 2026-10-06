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

  return Array.from(codes);
}

// Express wallets accept a single coupon, so use the one worth the most.
export function getHighestValueDraftOrderDiscountCode(
  draftOrder?: DraftOrder | null
): string | undefined {
  const totalsByCode = new Map<string, number>();
  const addDiscounts = (
    discounts?: ReadonlyArray<{
      code?: string | null;
      amount?: { value?: number | null } | null;
    }> | null
  ) => {
    for (const discount of discounts ?? []) {
      if (!discount.code) continue;
      totalsByCode.set(
        discount.code,
        (totalsByCode.get(discount.code) ?? 0) + (discount.amount?.value ?? 0)
      );
    }
  };

  addDiscounts(draftOrder?.discounts);
  for (const lineItem of draftOrder?.lineItems ?? []) {
    addDiscounts(lineItem.discounts);
  }
  for (const shippingLine of draftOrder?.shippingLines ?? []) {
    addDiscounts(shippingLine.discounts);
  }

  let highestCode: string | undefined;
  let highestTotal = Number.NEGATIVE_INFINITY;
  for (const [code, total] of totalsByCode) {
    if (total > highestTotal) {
      highestCode = code;
      highestTotal = total;
    }
  }

  return highestCode;
}
