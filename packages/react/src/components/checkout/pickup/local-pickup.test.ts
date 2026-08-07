import { describe, expect, it } from 'vitest';
import type { DraftOrder } from '@/types';
import { getPickupFulfillmentSyncKey } from './local-pickup';

describe('getPickupFulfillmentSyncKey', () => {
  it('ignores digital line items with missing fulfillment', () => {
    const key = getPickupFulfillmentSyncKey([
      {
        id: 'digital-line-item',
        type: 'DIGITAL',
        fulfillmentMode: 'NONE',
      },
      {
        id: 'pickup-line-item',
        fulfillmentMode: 'PICKUP',
      },
    ] as DraftOrder['lineItems']);

    expect(key).toBeNull();
  });

  it('returns a sync key for non-digital line items with missing fulfillment', () => {
    const key = getPickupFulfillmentSyncKey([
      {
        id: 'pickup-line-item',
        fulfillmentMode: 'NONE',
      },
    ] as DraftOrder['lineItems']);

    expect(key).toBe('pickup-line-item:NONE');
  });
});
