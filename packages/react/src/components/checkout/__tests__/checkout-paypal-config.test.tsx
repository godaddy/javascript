import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PaymentProvider } from '@/types';
import { renderCheckout, waitForCheckoutReady } from './checkout-test-env';

// ----------------------------------------------------------------------------
// PayPal public configuration: prop vs. session fallback
// ----------------------------------------------------------------------------
//
// checkout-api can now dynamically resolve PayPal's public SDK-bootstrap
// values (clientId/merchantId/partnerAttributionId) and persist them on the
// session as `paymentProviderConfiguration.paypal` (see checkout-api PR #183,
// "Hosted Checkout Consumption"). <Checkout> prefers an explicit `paypalConfig`
// prop (existing embedded-checkout integrations) and falls back to that
// session field otherwise (the hosted checkout URL flow, where no prop is
// ever supplied). A method must never be offered as usable when neither
// source has a usable clientId.
// ----------------------------------------------------------------------------

const paypalPaymentMethods = {
  card: {
    processor: PaymentProvider.GODADDY,
    checkoutTypes: ['standard'],
  },
  paypal: {
    processor: PaymentProvider.PAYPAL,
    checkoutTypes: ['standard'],
  },
};

describe('PayPal configuration: prop vs. session fallback', () => {
  it('does not offer PayPal as a payment method when no config is available anywhere', async () => {
    renderCheckout({
      sessionOverrides: { paymentMethods: paypalPaymentMethods },
    });
    await waitForCheckoutReady();

    expect(
      screen.queryByRole('button', { name: /paypal/i })
    ).not.toBeInTheDocument();
  });

  it('offers PayPal when an explicit paypalConfig prop is supplied (embedded checkout)', async () => {
    renderCheckout({
      sessionOverrides: { paymentMethods: paypalPaymentMethods },
      checkoutProps: {
        paypalConfig: { clientId: 'prop-client-id' },
      },
    });
    await waitForCheckoutReady();

    expect(screen.getByRole('button', { name: /paypal/i })).toBeInTheDocument();
  });

  it('offers PayPal using session.paymentProviderConfiguration.paypal when no prop is supplied (hosted checkout)', async () => {
    renderCheckout({
      sessionOverrides: {
        paymentMethods: paypalPaymentMethods,
        paymentProviderConfiguration: {
          paypal: { clientId: 'session-client-id', merchantId: 'merchant-1' },
        },
      },
    });
    await waitForCheckoutReady();

    expect(screen.getByRole('button', { name: /paypal/i })).toBeInTheDocument();
  });
});
