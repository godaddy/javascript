import { describe, expect, it } from 'vitest';
import type { ShippingLines, ShippingMethod } from '@/types';
import {
  requiresShippingReconciliation,
  selectShippingMethod,
} from './requires-shipping-reconciliation';

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

describe('selectShippingMethod', () => {
  const standard = shippingMethod('standard', 500);
  const express = shippingMethod('express', 2000);

  it('keeps an offered method on first load even when it is not the cheapest', () => {
    expect(
      selectShippingMethod({
        shippingMethods: [standard, express],
        currentServiceCode: 'express',
        previousShippingMethods: null,
      })
    ).toMatchObject({ selectedMethod: express, autoSelected: false });
  });

  it("keeps the customer's choice when rates are repriced", () => {
    expect(
      selectShippingMethod({
        shippingMethods: [
          shippingMethod('standard', 600),
          shippingMethod('express', 2100),
        ],
        currentServiceCode: 'express',
        previousShippingMethods: [standard, express],
        isAutoSelected: false,
      })
    ).toMatchObject({
      selectedMethod: { serviceCode: 'express' },
      autoSelected: false,
    });
  });

  it('moves an automatic selection to the cheapest method when rates change', () => {
    expect(
      selectShippingMethod({
        shippingMethods: [shippingMethod('standard', 2500), express],
        currentServiceCode: 'standard',
        previousShippingMethods: [standard, express],
        isAutoSelected: true,
      })
    ).toMatchObject({
      selectedMethod: { serviceCode: 'express' },
      autoSelected: true,
    });
  });

  it('keeps an automatic selection while the rates are unchanged', () => {
    expect(
      selectShippingMethod({
        shippingMethods: [standard, express],
        currentServiceCode: 'express',
        previousShippingMethods: [standard, express],
        isAutoSelected: true,
      })
    ).toMatchObject({ selectedMethod: express, autoSelected: true });
  });

  it("switches a customer's choice to free shipping when it newly appears", () => {
    const free = shippingMethod('free', 0);

    expect(
      selectShippingMethod({
        shippingMethods: [standard, express, free],
        currentServiceCode: 'express',
        previousShippingMethods: [standard, express],
        isAutoSelected: false,
      })
    ).toMatchObject({ selectedMethod: free, autoSelected: true });
  });

  it('falls back to the cheapest method when the current one is gone', () => {
    expect(
      selectShippingMethod({
        shippingMethods: [standard],
        currentServiceCode: 'express',
        previousShippingMethods: [standard, express],
        isAutoSelected: false,
      })
    ).toMatchObject({ selectedMethod: standard, autoSelected: true });
  });
});
