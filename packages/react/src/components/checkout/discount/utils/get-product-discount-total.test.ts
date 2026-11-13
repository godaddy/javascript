import { describe, expect, it } from 'vitest';
import { getProductDiscountTotal } from './get-product-discount-total';

describe('getProductDiscountTotal', () => {
  it('sums order-level and line-item discounts but not shipping-line discounts', () => {
    expect(
      getProductDiscountTotal({
        discounts: [{ amount: { value: 500 } }],
        lineItems: [
          {
            discounts: [{ amount: { value: 300 } }, { amount: { value: 200 } }],
          },
          { discounts: null },
        ],
        shippingLines: [{ discounts: [{ amount: { value: 800 } }] }],
      } as Parameters<typeof getProductDiscountTotal>[0])
    ).toBe(1000);
  });

  it('treats missing orders, lists, and amounts as zero', () => {
    expect(getProductDiscountTotal()).toBe(0);
    expect(getProductDiscountTotal(null)).toBe(0);
    expect(
      getProductDiscountTotal({
        discounts: [{ amount: null }, { amount: { value: null } }],
        lineItems: null,
      })
    ).toBe(0);
  });
});
