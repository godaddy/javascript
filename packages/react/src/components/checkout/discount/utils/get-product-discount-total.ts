type DiscountAmounts =
  | ReadonlyArray<{ amount?: { value?: number | null } | null }>
  | null
  | undefined;

interface OrderWithProductDiscounts {
  discounts?: DiscountAmounts;
  lineItems?: ReadonlyArray<{ discounts?: DiscountAmounts }> | null;
}

function sumDiscounts(discounts: DiscountAmounts) {
  return (discounts ?? []).reduce(
    (total, discount) => total + (discount.amount?.value ?? 0),
    0
  );
}

// Mirrors the product discount checkout-api subtracts from the subtotal for
// shipping rate requests: order-level and line-item discounts, not shipping.
export function getProductDiscountTotal(
  order?: OrderWithProductDiscounts | null
) {
  return (
    sumDiscounts(order?.discounts) +
    (order?.lineItems ?? []).reduce(
      (total, lineItem) => total + sumDiscounts(lineItem.discounts),
      0
    )
  );
}
