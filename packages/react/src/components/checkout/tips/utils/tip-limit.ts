/**
 * The smallest ceiling the API will apply, in minor units.
 *
 * It is what allows a tip on an order too small to cover it — a zero-total order
 * can still be tipped (see `applyTipOnlyChargeError`), so the ceiling cannot be
 * the total alone. The API holds it as a flat minor-units amount rather than one
 * scaled per currency, so it is not scaled here either.
 *
 * Kept in step with `checkout-api`: changing the bound there without changing it
 * here either hides presets the API would have taken or offers ones it will
 * reject.
 */
const TIP_LIMIT_FLOOR = 2000;

/**
 * Whether the API will accept this tip on this order.
 *
 * The bound is `max(orderTotal, TIP_LIMIT_FLOOR)`; above it the tip comes back as
 * `TIP_EXCEEDS_LIMIT`. Note which amount the total is — presets are worked out
 * from the item subtotal, so a discount can put one out of reach without
 * changing what it reads.
 *
 * @param tipAmount tip in minor units
 * @param orderTotal order total in minor units, tip excluded, after discounts
 *   and including tax and shipping
 */
export function isTipWithinLimit(
  tipAmount: number,
  orderTotal: number
): boolean {
  return tipAmount <= Math.max(orderTotal, TIP_LIMIT_FLOOR);
}
