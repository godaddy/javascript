import { describe, expect, it } from 'vitest';
import type { DraftOrder } from '@/types';
import {
  getDraftOrderDiscountCodes,
  getHighestValueDraftOrderDiscountCode,
} from './get-draft-order-discount-codes';

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
      'order',
      'line',
      'shared',
      'shipping',
    ]);
  });

  it('returns an empty list without a draft order', () => {
    expect(getDraftOrderDiscountCodes()).toEqual([]);
  });
});

describe('getHighestValueDraftOrderDiscountCode', () => {
  it('returns the code with the largest combined discount across all levels', () => {
    const draftOrder = {
      discounts: [{ code: 'SAVE10', amount: { value: 500 } }],
      lineItems: [
        { discounts: [{ code: 'BIGLINE', amount: { value: 400 } }] },
        { discounts: [{ code: 'BIGLINE', amount: { value: 400 } }] },
      ],
      shippingLines: [
        { discounts: [{ code: 'FREESHIP', amount: { value: 700 } }] },
      ],
    } as DraftOrder;

    expect(getHighestValueDraftOrderDiscountCode(draftOrder)).toBe('BIGLINE');
  });

  it('prefers the first code seen, order-level first, on a tie', () => {
    const draftOrder = {
      discounts: [{ code: 'SAVE10', amount: { value: 500 } }],
      shippingLines: [
        { discounts: [{ code: 'FREESHIP', amount: { value: 500 } }] },
      ],
    } as DraftOrder;

    expect(getHighestValueDraftOrderDiscountCode(draftOrder)).toBe('SAVE10');
  });

  it('returns undefined when no discount codes are applied', () => {
    expect(getHighestValueDraftOrderDiscountCode()).toBeUndefined();
    expect(
      getHighestValueDraftOrderDiscountCode({
        discounts: [],
      } as unknown as DraftOrder)
    ).toBeUndefined();
  });
});
