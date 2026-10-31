import { describe, expect, it } from 'vitest';
import type { CheckoutSession } from '@/types';
import { resolveGodaddyPaymentsConfig } from './resolve-godaddy-payments-config';

describe('resolveGodaddyPaymentsConfig', () => {
  it('returns the explicit prop when supplied', () => {
    expect(
      resolveGodaddyPaymentsConfig(
        { businessId: 'prop-business', appId: 'prop-app' },
        {
          paymentProviderConfiguration: {
            godaddy: {
              businessId: 'session-business',
              applicationId: 'session-app',
            },
          },
        } as CheckoutSession
      )
    ).toEqual({ businessId: 'prop-business', appId: 'prop-app' });
  });

  it('falls back to session.paymentProviderConfiguration.godaddy', () => {
    expect(
      resolveGodaddyPaymentsConfig(undefined, {
        paymentProviderConfiguration: {
          godaddy: {
            businessId: 'session-business',
            applicationId: 'session-app',
          },
        },
      } as CheckoutSession)
    ).toEqual({ businessId: 'session-business', appId: 'session-app' });
  });

  it('returns undefined when neither prop nor session config is present', () => {
    expect(resolveGodaddyPaymentsConfig(undefined, {} as CheckoutSession)).toBe(
      undefined
    );
  });
});
