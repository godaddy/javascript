import { describe, expect, it } from 'vitest';
import { DeliveryMethods } from '@/components/checkout/delivery/delivery-methods';
import {
  BillingCollectionLocations,
  BillingCollectionModes,
} from '@/components/checkout/payment/utils/billing-collection';
import { type CheckoutSession, PaymentMethodType, type Totals } from '@/types';
import { resolveBillingPolicyForCheckoutState } from './use-billing-policy';

const paidTotals = {
  total: { value: 1000, currencyCode: 'USD' },
} as Totals;

const freeTotals = {
  total: { value: 0, currencyCode: 'USD' },
} as Totals;

const values = {
  deliveryMethod: DeliveryMethods.SHIP,
  paymentMethod: PaymentMethodType.CREDIT_CARD,
  paymentUseShippingAddress: true,
};

function buildSession(overrides: Partial<CheckoutSession> = {}) {
  return {
    enableShipping: true,
    enableShippingAddressCollection: true,
    enableBillingAddressCollection: true,
    enableTaxCollection: true,
    ...overrides,
  } as CheckoutSession;
}

describe('resolveBillingPolicyForCheckoutState', () => {
  it.each([
    {
      enableShipping: null,
      enableShippingAddressCollection: true,
    },
    {
      enableShipping: true,
      enableShippingAddressCollection: null,
    },
    {
      enableShipping: undefined,
      enableShippingAddressCollection: undefined,
    },
  ])(
    'does not reuse shipping when its collection flags are not explicitly enabled',
    session => {
      expect(
        resolveBillingPolicyForCheckoutState({
          values,
          session: buildSession(session),
          totals: paidTotals,
        })
      ).toEqual({
        mode: BillingCollectionModes.ADDRESS,
        location: BillingCollectionLocations.INLINE_PAYMENT_FORM,
        usesShippingAddress: false,
      });
    }
  );

  it('reuses shipping when shipping and address collection are explicitly enabled', () => {
    expect(
      resolveBillingPolicyForCheckoutState({
        values,
        session: buildSession(),
        totals: paidTotals,
      })
    ).toEqual({
      mode: BillingCollectionModes.NONE,
      location: BillingCollectionLocations.NONE,
      usesShippingAddress: true,
    });
  });

  it('collects separate billing when the customer opts out of shipping reuse', () => {
    expect(
      resolveBillingPolicyForCheckoutState({
        values: { ...values, paymentUseShippingAddress: false },
        session: buildSession(),
        totals: paidTotals,
      })
    ).toEqual({
      mode: BillingCollectionModes.ADDRESS,
      location: BillingCollectionLocations.INLINE_PAYMENT_FORM,
      usesShippingAddress: false,
    });
  });

  it('uses free offline pickup rules when the total is zero', () => {
    expect(
      resolveBillingPolicyForCheckoutState({
        values: {
          ...values,
          deliveryMethod: DeliveryMethods.PICKUP,
          paymentUseShippingAddress: false,
        },
        session: buildSession(),
        totals: freeTotals,
      })
    ).toEqual({
      mode: BillingCollectionModes.NAMES,
      location: BillingCollectionLocations.FREE_PAYMENT_FORM,
      usesShippingAddress: false,
    });
  });

  it('does not treat a missing total as a free order', () => {
    expect(
      resolveBillingPolicyForCheckoutState({
        values: {
          ...values,
          deliveryMethod: DeliveryMethods.PURCHASE,
          paymentUseShippingAddress: false,
        },
        session: buildSession({ enableTaxCollection: false }),
        totals: undefined,
      })
    ).toEqual({
      mode: BillingCollectionModes.ADDRESS,
      location: BillingCollectionLocations.INLINE_PAYMENT_FORM,
      usesShippingAddress: false,
    });
  });

  it('keeps a positive-total card order in the paid inline flow', () => {
    expect(
      resolveBillingPolicyForCheckoutState({
        values: {
          ...values,
          deliveryMethod: DeliveryMethods.PICKUP,
          paymentUseShippingAddress: false,
        },
        session: buildSession(),
        totals: paidTotals,
      })
    ).toEqual({
      mode: BillingCollectionModes.ADDRESS,
      location: BillingCollectionLocations.INLINE_PAYMENT_FORM,
      usesShippingAddress: false,
    });
  });
});
