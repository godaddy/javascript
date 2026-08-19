import { describe, expect, it } from 'vitest';
import { DeliveryMethods } from '@/components/checkout/delivery/delivery-methods';
import { PaymentMethodType } from '@/types';
import {
  type BillingCollectionMode,
  type BillingPolicy,
  type BillingPolicyInput,
  getBillingPolicy,
} from './billing-collection';

const deliveryMethods = [
  DeliveryMethods.SHIP,
  DeliveryMethods.PICKUP,
  DeliveryMethods.PURCHASE,
  DeliveryMethods.DIGITAL,
];
const paymentMethods = [
  PaymentMethodType.CREDIT_CARD,
  PaymentMethodType.ACH,
  PaymentMethodType.OFFLINE,
  PaymentMethodType.PAYPAL,
];
const flags = [true, false];

function everyPolicyCombination(callback: (input: BillingPolicyInput) => void) {
  for (const deliveryMethod of deliveryMethods) {
    for (const paymentMethod of paymentMethods) {
      for (const isFreeOrder of flags) {
        for (const paymentUseShippingAddress of flags) {
          for (const enableShipping of flags) {
            for (const enableShippingAddressCollection of flags) {
              for (const enableBillingAddressCollection of flags) {
                for (const enableTaxCollection of flags) {
                  callback({
                    isFreeOrder,
                    paymentMethod,
                    deliveryMethod,
                    paymentUseShippingAddress,
                    enableShipping,
                    enableShippingAddressCollection,
                    enableBillingAddressCollection,
                    enableTaxCollection,
                  });
                }
              }
            }
          }
        }
      }
    }
  }
}

function getExpectedMode({
  isFreeOrder,
  paymentMethod,
  deliveryMethod,
  paymentUseShippingAddress,
  enableBillingAddressCollection,
  enableTaxCollection,
}: BillingPolicyInput): BillingCollectionMode {
  if (
    deliveryMethod === DeliveryMethods.SHIP &&
    paymentUseShippingAddress
  ) {
    return 'none';
  }

  const effectivePaymentMethod = isFreeOrder
    ? PaymentMethodType.OFFLINE
    : paymentMethod;
  const isOffline = effectivePaymentMethod === PaymentMethodType.OFFLINE;

  if (isOffline) {
    if (deliveryMethod === DeliveryMethods.PICKUP) return 'names';
    if (
      deliveryMethod === DeliveryMethods.PURCHASE ||
      deliveryMethod === DeliveryMethods.DIGITAL
    ) {
      if (!enableTaxCollection) return 'names';
      return enableBillingAddressCollection ? 'address' : 'names';
    }
  }

  return enableBillingAddressCollection ? 'address' : 'names';
}

function getExpectedPolicy(input: BillingPolicyInput): BillingPolicy {
  const mode = getExpectedMode(input);
  const usesShippingAddress = Boolean(
    input.deliveryMethod === DeliveryMethods.SHIP &&
      input.paymentUseShippingAddress
  );

  if (mode === 'none') {
    return { mode, location: 'none', usesShippingAddress };
  }

  if (input.isFreeOrder) {
    return { mode, location: 'free-payment-form', usesShippingAddress };
  }

  if (
    input.paymentMethod === PaymentMethodType.CREDIT_CARD ||
    input.paymentMethod === PaymentMethodType.ACH
  ) {
    return { mode, location: 'inline-payment-form', usesShippingAddress };
  }

  return { mode, location: 'top-level', usesShippingAddress };
}

describe('getBillingPolicy', () => {
  it('implements the authoritative matrix for every supported input combination', () => {
    everyPolicyCombination(input => {
      expect({ input, policy: getBillingPolicy(input) }).toEqual({
        input,
        policy: getExpectedPolicy(input),
      });
    });
  });

  it('forces free orders through offline rules when a stale inline payment remains selected', () => {
    for (const paymentMethod of [
      PaymentMethodType.CREDIT_CARD,
      PaymentMethodType.ACH,
    ]) {
      const input: BillingPolicyInput = {
        isFreeOrder: true,
        paymentMethod,
        deliveryMethod: DeliveryMethods.PICKUP,
        paymentUseShippingAddress: false,
        enableShipping: true,
        enableShippingAddressCollection: true,
        enableBillingAddressCollection: true,
        enableTaxCollection: true,
      };

      expect(getBillingPolicy(input)).toEqual(
        getBillingPolicy({
          ...input,
          paymentMethod: PaymentMethodType.OFFLINE,
        })
      );
      expect(getBillingPolicy(input)).toEqual({
        mode: 'names',
        location: 'free-payment-form',
        usesShippingAddress: false,
      });
    }
  });

  it('uses the inline payment form for active paid card and ACH billing', () => {
    for (const paymentMethod of [
      PaymentMethodType.CREDIT_CARD,
      PaymentMethodType.ACH,
    ]) {
      for (const deliveryMethod of [
        DeliveryMethods.PICKUP,
        DeliveryMethods.PURCHASE,
        DeliveryMethods.DIGITAL,
        DeliveryMethods.SHIP,
      ]) {
        const policy = getBillingPolicy({
          isFreeOrder: false,
          paymentMethod,
          deliveryMethod,
          paymentUseShippingAddress: false,
          enableShipping: true,
          enableShippingAddressCollection: true,
          enableBillingAddressCollection: true,
          enableTaxCollection: false,
        });

        expect(policy.location).toBe('inline-payment-form');
        expect(policy.mode).toBe('address');
      }
    }
  });

  it('uses the top-level payment form for active paid non-inline methods', () => {
    for (const paymentMethod of [
      PaymentMethodType.OFFLINE,
      PaymentMethodType.PAYPAL,
      PaymentMethodType.APPLE_PAY,
    ]) {
      const policy = getBillingPolicy({
        isFreeOrder: false,
        paymentMethod,
        deliveryMethod: DeliveryMethods.PICKUP,
        paymentUseShippingAddress: false,
        enableShipping: true,
        enableShippingAddressCollection: true,
        enableBillingAddressCollection: true,
        enableTaxCollection: true,
      });

      expect(policy.location).toBe('top-level');
      expect(policy.mode).not.toBe('none');
    }
  });

  it('uses the free payment form for active free-order billing', () => {
    for (const deliveryMethod of [
      DeliveryMethods.PICKUP,
      DeliveryMethods.PURCHASE,
      DeliveryMethods.DIGITAL,
      DeliveryMethods.SHIP,
    ]) {
      const policy = getBillingPolicy({
        isFreeOrder: true,
        paymentMethod: PaymentMethodType.PAYPAL,
        deliveryMethod,
        paymentUseShippingAddress: false,
        enableShipping: true,
        enableShippingAddressCollection: true,
        enableBillingAddressCollection: true,
        enableTaxCollection: true,
      });

      expect(policy.location).toBe('free-payment-form');
      expect(policy.mode).not.toBe('none');
    }
  });

  it('returns no billing location whenever mode is none', () => {
    everyPolicyCombination(input => {
      const policy = getBillingPolicy(input);

      if (policy.mode === 'none') {
        expect(policy.location).toBe('none');
      }
    });
  });

  it('does not collect separate billing when shipping is reused as billing', () => {
    for (const isFreeOrder of flags) {
      for (const paymentMethod of paymentMethods) {
        const policy = getBillingPolicy({
          isFreeOrder,
          paymentMethod,
          deliveryMethod: DeliveryMethods.SHIP,
          paymentUseShippingAddress: true,
          enableShipping: true,
          enableShippingAddressCollection: true,
          enableBillingAddressCollection: true,
          enableTaxCollection: true,
        });

        expect(policy).toEqual({
          mode: 'none',
          location: 'none',
          usesShippingAddress: true,
        });
      }
    }
  });

  it('never returns address mode when billing address collection is disabled', () => {
    everyPolicyCombination(input => {
      const policy = getBillingPolicy({
        ...input,
        enableBillingAddressCollection: false,
      });

      expect(policy.mode).not.toBe('address');
    });
  });
});
