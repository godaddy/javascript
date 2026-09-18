/**
 * Whether the API will accept this tip on this order.
 *
 * The bound is the order total: above it the tip comes back as
 * `TIP_EXCEEDS_LIMIT`. Note which amount that is — presets are worked out from
 * the item subtotal, so a discount can put one out of reach without changing
 * what it reads.
 *
 * There is also some floor that allows a tip on an order too small to cover it;
 * a zero-total order can be tipped (see `applyTipOnlyChargeError`), so the bound
 * cannot be the total alone. That floor's value is not established anywhere we
 * control, so rather than guess at one, an order with no total to measure
 * against is left for the API to rule on.
 *
 * @param tipAmount tip in minor units
 * @param orderTotal order total in minor units, tip excluded, after discounts
 *   and including tax and shipping
 */
export function isTipWithinLimit(
  tipAmount: number,
  orderTotal: number
): boolean {
  if (orderTotal <= 0) return true;
  return tipAmount <= orderTotal;
}
