import { describe, expect, it } from 'vitest';
import type { CheckoutSession } from '@/types';
import { resolveSessionPaymentMethods } from './resolve-session-payment-methods';

describe('resolveSessionPaymentMethods', () => {
  it('prefers paymentProviderConfiguration.paymentMethods when present', () => {
    expect(
      resolveSessionPaymentMethods({
        paymentMethods: {
          card: { processor: 'godaddy', checkoutTypes: ['standard'] },
        },
        paymentProviderConfiguration: {
          paymentMethods: {
            card: {
              processor: 'godaddy',
              checkoutTypes: ['standard', 'express'],
            },
            paypal: { processor: 'paypal', checkoutTypes: ['standard'] },
          },
        },
      } as CheckoutSession)
    ).toEqual({
      card: {
        processor: 'godaddy',
        checkoutTypes: ['standard', 'express'],
      },
      paypal: { processor: 'paypal', checkoutTypes: ['standard'] },
    });
  });

  it('falls back to legacy session.paymentMethods when discovery is absent', () => {
    expect(
      resolveSessionPaymentMethods({
        paymentMethods: {
          card: { processor: 'godaddy', checkoutTypes: ['standard'] },
        },
      } as CheckoutSession)
    ).toEqual({
      card: { processor: 'godaddy', checkoutTypes: ['standard'] },
    });
  });

  it('falls back to legacy when paymentProviderConfiguration.paymentMethods is null', () => {
    expect(
      resolveSessionPaymentMethods({
        paymentMethods: {
          paypal: { processor: 'paypal', checkoutTypes: ['standard'] },
        },
        paymentProviderConfiguration: {
          paymentMethods: null,
        },
      } as CheckoutSession)
    ).toEqual({
      paypal: { processor: 'paypal', checkoutTypes: ['standard'] },
    });
  });

  it('returns undefined when neither source has payment methods', () => {
    expect(resolveSessionPaymentMethods({} as CheckoutSession)).toBeUndefined();
  });
});
