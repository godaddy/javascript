import { expect, it } from 'vitest';
import type { DraftOrder } from '@/types';
import { buildStripePaymentMethodParams } from './use-build-payment-request';
import { buildStripeExpressPaymentMethodParams } from './use-stripe-checkout';

it('builds Stripe billing details from the supplied draft order', () => {
  const order = {
    billing: {
      firstName: 'Latest',
      lastName: 'Buyer',
      email: 'latest@example.com',
      phone: '+12015550123',
      address: {
        addressLine1: '123 Current St',
        addressLine2: 'Suite 4',
        adminArea2: 'Austin',
        adminArea1: 'TX',
        postalCode: '78701',
        countryCode: 'US',
      },
    },
  } as DraftOrder;

  expect(buildStripePaymentMethodParams(order)).toEqual({
    billing_details: {
      name: 'Latest Buyer',
      email: 'latest@example.com',
      phone: '+12015550123',
      address: {
        line1: '123 Current St',
        line2: 'Suite 4',
        city: 'Austin',
        state: 'TX',
        postal_code: '78701',
        country: 'US',
      },
    },
  });
});

it('builds Stripe Express billing details from the wallet event', () => {
  expect(
    buildStripeExpressPaymentMethodParams({
      name: 'Wallet Buyer',
      email: 'wallet@example.com',
      phone: '+12015550999',
      address: {
        line1: '789 Wallet Ave',
        line2: null,
        city: 'Phoenix',
        state: 'AZ',
        postal_code: '85001',
        country: 'US',
      },
    })
  ).toEqual({
    billing_details: {
      name: 'Wallet Buyer',
      email: 'wallet@example.com',
      phone: '+12015550999',
      address: {
        line1: '789 Wallet Ave',
        line2: undefined,
        city: 'Phoenix',
        state: 'AZ',
        postal_code: '85001',
        country: 'US',
      },
    },
  });
});
