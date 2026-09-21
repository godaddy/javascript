import { describe, expect, it } from 'vitest';
import type { ShippingLines, ShippingMethod } from '@/types';
import { requiresShippingReconciliation } from './requires-shipping-reconciliation';

function shippingMethod(serviceCode: string, cost: number): ShippingMethod {
  return {
    serviceCode,
    carrierCode: 'carrier',
    displayName: serviceCode,
    description: null,
    features: [],
    minDeliveryDate: null,
    maxDeliveryDate: null,
    cost: { value: cost, currencyCode: 'USD' },
  };
}

function shippingLine(serviceCode: string, cost: number): ShippingLines {
  return {
    id: `shipping-${serviceCode}`,
    requestedService: serviceCode,
    requestedProvider: 'carrier',
    name: serviceCode,
    amount: { value: cost, currencyCode: 'USD' },
    discounts: [],
  };
}

describe('requiresShippingReconciliation', () => {
  it('returns false when the selected service and cost are unchanged', () => {
    expect(
      requiresShippingReconciliation({
        shippingMethods: [shippingMethod('standard', 1000)],
        currentShippingLine: shippingLine('standard', 1000),
        selectedServiceCode: 'standard',
      })
    ).toBe(false);
  });

  it('returns true when a cheaper default method becomes available', () => {
    expect(
      requiresShippingReconciliation({
        shippingMethods: [
          shippingMethod('standard', 1000),
          shippingMethod('free', 0),
        ],
        currentShippingLine: shippingLine('standard', 1000),
        selectedServiceCode: 'standard',
      })
    ).toBe(true);
  });

  it('preserves the selected method when available methods are unchanged', () => {
    const shippingMethods = [
      shippingMethod('standard', 1000),
      shippingMethod('free', 0),
    ];

    expect(
      requiresShippingReconciliation({
        shippingMethods,
        previousShippingMethods: shippingMethods,
        currentShippingLine: shippingLine('standard', 1000),
        selectedServiceCode: 'standard',
      })
    ).toBe(false);
  });

  it('returns true when the selected service becomes free', () => {
    expect(
      requiresShippingReconciliation({
        shippingMethods: [shippingMethod('standard', 0)],
        currentShippingLine: shippingLine('standard', 1000),
        selectedServiceCode: 'standard',
      })
    ).toBe(true);
  });

  it('returns true when the selected service is no longer available', () => {
    expect(
      requiresShippingReconciliation({
        shippingMethods: [shippingMethod('express', 1500)],
        currentShippingLine: shippingLine('standard', 1000),
        selectedServiceCode: 'standard',
      })
    ).toBe(true);
  });

  it('returns true when no methods remain for an applied shipping line', () => {
    expect(
      requiresShippingReconciliation({
        shippingMethods: [],
        currentShippingLine: shippingLine('standard', 1000),
        selectedServiceCode: 'standard',
      })
    ).toBe(true);
  });

  it('returns false when there are no methods and no applied shipping line', () => {
    expect(
      requiresShippingReconciliation({
        shippingMethods: [],
        currentShippingLine: null,
        selectedServiceCode: null,
      })
    ).toBe(false);
  });
});
