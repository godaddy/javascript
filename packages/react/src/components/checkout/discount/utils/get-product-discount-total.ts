import {
  getOrderDiscounts,
  type OrderWithDiscounts,
} from './get-draft-order-discount-codes';

// Mirrors the product discount checkout-api subtracts from the subtotal for
// shipping rate requests: order-level and line-item discounts, not shipping.
export function getProductDiscountTotal(order?: OrderWithDiscounts | null) {
  return getOrderDiscounts(order).reduce(
    (total, discount) =>
      discount.isShipping ? total : total + discount.amount,
    0
  );
}
