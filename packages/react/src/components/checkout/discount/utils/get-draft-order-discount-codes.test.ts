import { describe, expect, it } from 'vitest';
import type { DraftOrder } from '@/types';
import { getDraftOrderDiscountCodes } from './get-draft-order-discount-codes';

describe('getDraftOrderDiscountCodes', () => {
  it('collects unique order, line-item, and shipping-line discount codes', () => {
    const draftOrder = {
      discounts: [{ code: 'order' }],
      lineItems: [{ discounts: [{ code: 'line' }, { code: 'shared' }] }],
      shippingLines: [
        { discounts: [{ code: 'shipping' }, { code: 'shared' }] },
      ],
    } as DraftOrder;

    expect(getDraftOrderDiscountCodes(draftOrder)).toEqual([
      'line',
      'order',
      'shared',
      'shipping',
    ]);
  });

  it('returns an empty list without a draft order', () => {
    expect(getDraftOrderDiscountCodes()).toEqual([]);
  });
});
