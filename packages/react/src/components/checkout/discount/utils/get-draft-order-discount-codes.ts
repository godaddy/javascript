type Discount = {
  code?: string | null;
  amount?: { value?: number | null } | null;
};
type Discounts = ReadonlyArray<Discount> | null | undefined;

export interface OrderWithDiscounts {
  discounts?: Discounts;
  lineItems?: ReadonlyArray<{ discounts?: Discounts }> | null;
  shippingLines?: ReadonlyArray<{ discounts?: Discounts }> | null;
}

interface OrderDiscount {
  code?: string | null;
  amount: number;
  // Shipping-line discounts are not product discounts: they don't affect the
  // subtotal checkout-api sends for shipping rates.
  isShipping: boolean;
}

// Single walk over every discount level of an order, order-level first.
export function getOrderDiscounts(
  order?: OrderWithDiscounts | null
): OrderDiscount[] {
  const toOrderDiscounts = (discounts: Discounts, isShipping: boolean) =>
    (discounts ?? []).map(discount => ({
      code: discount.code,
      amount: discount.amount?.value ?? 0,
      isShipping,
    }));

  return [
    ...toOrderDiscounts(order?.discounts, false),
    ...(order?.lineItems ?? []).flatMap(lineItem =>
      toOrderDiscounts(lineItem.discounts, false)
    ),
    ...(order?.shippingLines ?? []).flatMap(shippingLine =>
      toOrderDiscounts(shippingLine.discounts, true)
    ),
  ];
}

export function getDraftOrderDiscountCodes(
  draftOrder?: OrderWithDiscounts | null
): string[] {
  const codes = new Set<string>();

  for (const { code } of getOrderDiscounts(draftOrder)) {
    if (code) codes.add(code);
  }

  return Array.from(codes);
}

// Express wallets accept a single coupon, so prefill the product code worth
// the most. The wallet is an isolated cart whose shipping is chosen in the
// wallet, so shipping-only codes are skipped: they can't be priced until the
// wallet supplies an address and rate, and checkout-api would otherwise price
// them against the main order's shipping line. Shoppers can still enter one
// in the wallet, where it's priced with the wallet's shipping.
export function getHighestValueDraftOrderDiscountCode(
  draftOrder?: OrderWithDiscounts | null
): string | undefined {
  const totalsByCode = new Map<string, number>();

  for (const { code, amount, isShipping } of getOrderDiscounts(draftOrder)) {
    if (!code || isShipping) continue;
    totalsByCode.set(code, (totalsByCode.get(code) ?? 0) + amount);
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
