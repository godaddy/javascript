import { describe, expect, it } from 'vitest';
import type { DraftOrder, ShippingLines, ShippingMethod } from '@/types';
import {
  getShippingFulfillmentSyncKey,
  shouldApplyShippingMethod,
} from './should-apply-shipping-method';

const shippingMethod = {
  serviceCode: 'ground',
  cost: {
    value: 100,
    currencyCode: 'USD',
  },
} as ShippingMethod;

const shippingLine = {
  requestedService: 'ground',
  amount: {
    value: 100,
  },
} as ShippingLines;

const processedState = {
  serviceCode: 'ground',
  cost: 100,
  inFlightFulfillmentKey: null,
};

describe('getShippingFulfillmentSyncKey', () => {
  it('returns a sync key when a line item has NONE fulfillment', () => {
    const key = getShippingFulfillmentSyncKey([
      {
        id: 'line-item-1',
        fulfillmentMode: 'SHIP',
      },
      {
        id: 'line-item-2',
        fulfillmentMode: 'NONE',
      },
    ] as DraftOrder['lineItems']);

    expect(key).toBe('line-item-1:SHIP|line-item-2:NONE');
  });

  it('returns a sync key when a line item has null fulfillment', () => {
    const key = getShippingFulfillmentSyncKey([
      {
        id: 'line-item-1',
        fulfillmentMode: null,
      },
    ] as DraftOrder['lineItems']);

    expect(key).toBe('line-item-1:');
  });

  it('returns null when all line items are already shipping fulfilled', () => {
    const key = getShippingFulfillmentSyncKey([
      {
        id: 'line-item-1',
        fulfillmentMode: 'SHIP',
      },
    ] as DraftOrder['lineItems']);

    expect(key).toBeNull();
  });
});

describe('shouldApplyShippingMethod', () => {
  it('applies when the shipping line matches but line items are missing SHIP fulfillment', () => {
    const result = shouldApplyShippingMethod({
      methodToApply: shippingMethod,
      shippingLine,
      fulfillmentSyncKey: 'line-item-1:NONE',
      lastState: processedState,
    });

    expect(result.needsMutation).toBe(true);
    expect(result.alreadyProcessed).toBe(false);
  });

  it('does not repeatedly apply while the same fulfillment sync is in flight', () => {
    const result = shouldApplyShippingMethod({
      methodToApply: shippingMethod,
      shippingLine,
      fulfillmentSyncKey: 'line-item-1:NONE',
      lastState: {
        ...processedState,
        inFlightFulfillmentKey: 'line-item-1:NONE',
      },
    });

    expect(result.needsMutation).toBe(false);
    expect(result.alreadyProcessed).toBe(true);
    expect(result.isFulfillmentSyncInFlight).toBe(true);
  });

  it('allows retrying after the in-flight fulfillment key is cleared', () => {
    const result = shouldApplyShippingMethod({
      methodToApply: shippingMethod,
      shippingLine,
      fulfillmentSyncKey: 'line-item-1:NONE',
      lastState: processedState,
    });

    expect(result.needsMutation).toBe(true);
    expect(result.alreadyProcessed).toBe(false);
  });

  it('applies when a later cart edit creates a different fulfillment sync key', () => {
    const result = shouldApplyShippingMethod({
      methodToApply: shippingMethod,
      shippingLine,
      fulfillmentSyncKey: 'line-item-2:NONE',
      lastState: {
        ...processedState,
        inFlightFulfillmentKey: 'line-item-1:NONE',
      },
    });

    expect(result.needsMutation).toBe(true);
    expect(result.alreadyProcessed).toBe(false);
    expect(result.isFulfillmentSyncInFlight).toBe(false);
  });

  it('does not apply when shipping line and method match and line items are fulfilled', () => {
    const result = shouldApplyShippingMethod({
      methodToApply: shippingMethod,
      shippingLine,
      fulfillmentSyncKey: null,
      lastState: processedState,
    });

    expect(result.needsMutation).toBe(false);
    expect(result.alreadyProcessed).toBe(true);
  });

  it('applies when the selected shipping method changed', () => {
    const result = shouldApplyShippingMethod({
      methodToApply: {
        ...shippingMethod,
        serviceCode: 'express',
      } as ShippingMethod,
      shippingLine,
      fulfillmentSyncKey: null,
      lastState: processedState,
    });

    expect(result.needsMutation).toBe(true);
    expect(result.alreadyProcessed).toBe(false);
  });

  it('applies when the existing shipping line service code differs', () => {
    const result = shouldApplyShippingMethod({
      methodToApply: shippingMethod,
      shippingLine: {
        ...shippingLine,
        requestedService: 'express',
      } as ShippingLines,
      fulfillmentSyncKey: null,
      lastState: {
        serviceCode: 'express',
        cost: 100,
        inFlightFulfillmentKey: null,
      },
    });

    expect(result.needsMutation).toBe(true);
    expect(result.alreadyProcessed).toBe(false);
  });

  it('applies when the existing shipping line cost differs', () => {
    const result = shouldApplyShippingMethod({
      methodToApply: shippingMethod,
      shippingLine: {
        ...shippingLine,
        amount: {
          value: 200,
        },
      } as ShippingLines,
      fulfillmentSyncKey: null,
      lastState: {
        serviceCode: 'ground',
        cost: 200,
        inFlightFulfillmentKey: null,
      },
    });

    expect(result.needsMutation).toBe(true);
    expect(result.alreadyProcessed).toBe(false);
  });

  it('applies when there is no existing shipping line', () => {
    const result = shouldApplyShippingMethod({
      methodToApply: shippingMethod,
      shippingLine: null,
      fulfillmentSyncKey: null,
      lastState: {
        serviceCode: null,
        cost: null,
        inFlightFulfillmentKey: null,
      },
    });

    expect(result.needsMutation).toBe(true);
    expect(result.alreadyProcessed).toBe(false);
  });

  it('does not treat an unprocessed first render as already processed', () => {
    const result = shouldApplyShippingMethod({
      methodToApply: shippingMethod,
      shippingLine,
      fulfillmentSyncKey: null,
      lastState: {
        serviceCode: null,
        cost: null,
        inFlightFulfillmentKey: null,
      },
    });

    expect(result.needsMutation).toBe(false);
    expect(result.alreadyProcessed).toBe(false);
  });
});
