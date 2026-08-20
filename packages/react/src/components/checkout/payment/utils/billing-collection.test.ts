import { describe, expect, it } from 'vitest';
import { DeliveryMethods } from '@/components/checkout/delivery/delivery-methods';
import { PaymentMethodType } from '@/types';
import {
  BillingCollectionLocations,
  type BillingCollectionMode,
  BillingCollectionModes,
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
  enableShipping,
  enableShippingAddressCollection,
  enableBillingAddressCollection,
  enableTaxCollection,
}: BillingPolicyInput): BillingCollectionMode {
  if (
    deliveryMethod === DeliveryMethods.SHIP &&
    enableShipping &&
    enableShippingAddressCollection &&
    paymentUseShippingAddress
  ) {
    return BillingCollectionModes.NONE;
  }

  const effectivePaymentMethod = isFreeOrder
    ? PaymentMethodType.OFFLINE
    : paymentMethod;
  const isOffline = effectivePaymentMethod === PaymentMethodType.OFFLINE;

  if (isOffline) {
    if (deliveryMethod === DeliveryMethods.PICKUP) {
      return BillingCollectionModes.NAMES;
    }
    if (
      deliveryMethod === DeliveryMethods.PURCHASE ||
      deliveryMethod === DeliveryMethods.DIGITAL
    ) {
      if (!enableTaxCollection) return BillingCollectionModes.NAMES;
      return enableBillingAddressCollection
        ? BillingCollectionModes.ADDRESS
        : BillingCollectionModes.NAMES;
    }
  }

  return enableBillingAddressCollection
    ? BillingCollectionModes.ADDRESS
    : BillingCollectionModes.NAMES;
}

function getExpectedPolicy(input: BillingPolicyInput): BillingPolicy {
  const mode = getExpectedMode(input);
  const usesShippingAddress = Boolean(
    input.deliveryMethod === DeliveryMethods.SHIP &&
      input.enableShipping &&
      input.enableShippingAddressCollection &&
      input.paymentUseShippingAddress
  );

  if (mode === BillingCollectionModes.NONE) {
    return {
      mode,
      location: BillingCollectionLocations.NONE,
      usesShippingAddress,
    };
  }

  if (input.isFreeOrder) {
    return {
      mode,
      location: BillingCollectionLocations.FREE_PAYMENT_FORM,
      usesShippingAddress,
    };
  }

  if (
    input.paymentMethod === PaymentMethodType.CREDIT_CARD ||
    input.paymentMethod === PaymentMethodType.ACH
  ) {
    return {
      mode,
      location: BillingCollectionLocations.INLINE_PAYMENT_FORM,
      usesShippingAddress,
    };
  }

  return {
    mode,
    location: BillingCollectionLocations.TOP_LEVEL,
    usesShippingAddress,
  };
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
        mode: BillingCollectionModes.NAMES,
        location: BillingCollectionLocations.FREE_PAYMENT_FORM,
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

        expect(policy.location).toBe(
          BillingCollectionLocations.INLINE_PAYMENT_FORM
        );
        expect(policy.mode).toBe(BillingCollectionModes.ADDRESS);
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

      expect(policy.location).toBe(BillingCollectionLocations.TOP_LEVEL);
      expect(policy.mode).not.toBe(BillingCollectionModes.NONE);
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

      expect(policy.location).toBe(
        BillingCollectionLocations.FREE_PAYMENT_FORM
      );
      expect(policy.mode).not.toBe(BillingCollectionModes.NONE);
    }
  });

  it('returns no billing location whenever mode is none', () => {
    everyPolicyCombination(input => {
      const policy = getBillingPolicy(input);

      if (policy.mode === BillingCollectionModes.NONE) {
        expect(policy.location).toBe(BillingCollectionLocations.NONE);
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
          mode: BillingCollectionModes.NONE,
          location: BillingCollectionLocations.NONE,
          usesShippingAddress: true,
        });
      }
    }
  });

  it('does not reuse shipping as billing when shipping address collection is disabled', () => {
    expect(
      getBillingPolicy({
        isFreeOrder: false,
        paymentMethod: PaymentMethodType.CREDIT_CARD,
        deliveryMethod: DeliveryMethods.SHIP,
        paymentUseShippingAddress: true,
        enableShipping: true,
        enableShippingAddressCollection: false,
        enableBillingAddressCollection: true,
        enableTaxCollection: true,
      })
    ).toEqual({
      mode: BillingCollectionModes.ADDRESS,
      location: BillingCollectionLocations.INLINE_PAYMENT_FORM,
      usesShippingAddress: false,
    });
  });

  it('does not reuse shipping as billing when shipping is disabled', () => {
    expect(
      getBillingPolicy({
        isFreeOrder: false,
        paymentMethod: PaymentMethodType.CREDIT_CARD,
        deliveryMethod: DeliveryMethods.SHIP,
        paymentUseShippingAddress: true,
        enableShipping: false,
        enableShippingAddressCollection: true,
        enableBillingAddressCollection: true,
        enableTaxCollection: true,
      })
    ).toEqual({
      mode: BillingCollectionModes.ADDRESS,
      location: BillingCollectionLocations.INLINE_PAYMENT_FORM,
      usesShippingAddress: false,
    });
  });

  it('never returns address mode when billing address collection is disabled', () => {
    everyPolicyCombination(input => {
      const policy = getBillingPolicy({
        ...input,
        enableBillingAddressCollection: false,
      });

      expect(policy.mode).not.toBe(BillingCollectionModes.ADDRESS);
    });
  });
});
