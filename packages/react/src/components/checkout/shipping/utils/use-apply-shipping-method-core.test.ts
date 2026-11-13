import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { checkoutQueryKeys } from '@/components/checkout/utils/query-keys';
import { updateShippingMethodCache } from './use-apply-shipping-method-core';

type CacheArgs = Parameters<typeof updateShippingMethodCache>;

function seedDraftOrder(queryClient: QueryClient) {
  queryClient.setQueryData(checkoutQueryKeys.draftOrder('session-1'), {
    checkoutSession: {
      id: 'session-1',
      draftOrder: {
        id: 'draft-order-1',
        totals: { shippingTotal: { value: 0, currencyCode: 'USD' } },
        shippingLines: [
          {
            id: 'shipping-line-1',
            name: 'Standard',
            requestedProvider: 'carrier',
            requestedService: 'standard',
            amount: { value: 0, currencyCode: 'USD' },
            discounts: [
              {
                id: 'discount-freeship',
                code: 'FREESHIP',
                amount: { value: 1000, currencyCode: 'USD' },
              },
            ],
          },
        ],
      },
    },
  });
}

function cachedDraftOrder(queryClient: QueryClient) {
  return (
    queryClient.getQueryData(checkoutQueryKeys.draftOrder('session-1')) as {
      checkoutSession: {
        draftOrder: {
          shippingLines: Array<Record<string, unknown>>;
          totals: { shippingTotal: unknown };
        };
      };
    }
  ).checkoutSession.draftOrder;
}

describe('updateShippingMethodCache', () => {
  it("replaces the shipping line without the previous rate's discounts", () => {
    const queryClient = new QueryClient();
    seedDraftOrder(queryClient);

    updateShippingMethodCache(
      queryClient,
      'session-1',
      {
        applyCheckoutSessionShippingMethod: {
          draftOrder: {
            totals: { shippingTotal: { value: 2000, currencyCode: 'USD' } },
          },
        },
      } as CacheArgs[2],
      [
        {
          name: 'Express',
          requestedProvider: 'carrier',
          requestedService: 'express',
        },
      ] as CacheArgs[3]
    );

    const draftOrder = cachedDraftOrder(queryClient);
    expect(draftOrder.shippingLines).toEqual([
      {
        id: 'shipping-line-1',
        discounts: [],
        name: 'Express',
        requestedProvider: 'carrier',
        requestedService: 'express',
        amount: { value: 2000, currencyCode: 'USD' },
      },
    ]);
    expect(draftOrder.totals.shippingTotal).toEqual({
      value: 2000,
      currencyCode: 'USD',
    });
  });

  it('clears the shipping lines when no method is applied', () => {
    const queryClient = new QueryClient();
    seedDraftOrder(queryClient);

    updateShippingMethodCache(
      queryClient,
      'session-1',
      {
        applyCheckoutSessionShippingMethod: {
          draftOrder: {
            totals: { shippingTotal: { value: 0, currencyCode: 'USD' } },
          },
        },
      } as CacheArgs[2],
      [] as CacheArgs[3]
    );

    expect(cachedDraftOrder(queryClient).shippingLines).toEqual([]);
  });
});
