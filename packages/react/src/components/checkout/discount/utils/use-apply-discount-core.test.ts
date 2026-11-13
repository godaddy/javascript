import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { checkoutQueryKeys } from '@/components/checkout/utils/query-keys';
import { updateDiscountCache } from './use-apply-discount-core';

type UpdatedOrder = Parameters<typeof updateDiscountCache>[2];

const freeShippingDiscount = {
  id: 'discount-freeship',
  code: 'freeship',
  amount: { value: 500, currencyCode: 'USD' },
};

function seedDraftOrder(queryClient: QueryClient) {
  queryClient.setQueryData(checkoutQueryKeys.draftOrder('session-1'), {
    checkoutSession: {
      id: 'session-1',
      draftOrder: {
        id: 'draft-order-1',
        totals: {},
        discounts: [],
        lineItems: [],
        shippingLines: [
          { id: 'shipping-a', name: 'A', discounts: [] },
          { id: 'shipping-b', name: 'B', discounts: [] },
        ],
      },
    },
  });
}

function cachedShippingLines(queryClient: QueryClient) {
  return (
    queryClient.getQueryData(checkoutQueryKeys.draftOrder('session-1')) as {
      checkoutSession: {
        draftOrder: {
          shippingLines: Array<{ id: string; discounts: unknown[] }>;
        };
      };
    }
  ).checkoutSession.draftOrder.shippingLines;
}

describe('updateDiscountCache', () => {
  it('matches shipping-line discounts by id, not position', () => {
    const queryClient = new QueryClient();
    seedDraftOrder(queryClient);

    updateDiscountCache(
      queryClient,
      'session-1',
      {
        shippingLines: [
          { id: 'shipping-b', discounts: [freeShippingDiscount] },
          { id: 'shipping-a', discounts: [] },
        ],
      } as unknown as UpdatedOrder,
      ['freeship']
    );

    expect(cachedShippingLines(queryClient)).toEqual([
      expect.objectContaining({ id: 'shipping-a', discounts: [] }),
      expect.objectContaining({
        id: 'shipping-b',
        discounts: [freeShippingDiscount],
      }),
    ]);
  });

  it('clears shipping-line discounts that are missing from the response when codes are removed', () => {
    const queryClient = new QueryClient();
    seedDraftOrder(queryClient);
    updateDiscountCache(
      queryClient,
      'session-1',
      {
        shippingLines: [
          { id: 'shipping-a', discounts: [freeShippingDiscount] },
        ],
      } as unknown as UpdatedOrder,
      ['freeship']
    );

    updateDiscountCache(
      queryClient,
      'session-1',
      { shippingLines: [] } as unknown as UpdatedOrder,
      []
    );

    expect(cachedShippingLines(queryClient)).toEqual([
      expect.objectContaining({ id: 'shipping-a', discounts: [] }),
      expect.objectContaining({ id: 'shipping-b', discounts: [] }),
    ]);
  });
});
