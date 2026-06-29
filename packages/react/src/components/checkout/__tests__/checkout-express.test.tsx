import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderCheckout, waitForCheckoutReady } from './checkout-test-env';

// ----------------------------------------------------------------------------
// Express checkout section
// ----------------------------------------------------------------------------
//
// In production the express section is driven exclusively by the dedicated
// `paymentMethods.express` entry, configured as either:
//   { processor: 'godaddy', checkoutTypes: ['express'] }   → ExpressCheckoutButton
//   { processor: 'stripe',  checkoutTypes: ['express'] }   → StripeExpressCheckoutButton
//
// Those buttons open a wallet sheet (Apple Pay / Google Pay) that handles its
// OWN shipping/tax/coupon flow with the SUBTOTAL only, then calls
// `confirmCheckout` with `isExpress: true` plus `calculatedTaxes`,
// `calculatedAdjustments`, and `shippingTotal` sourced directly from the
// wallet sheet — bypassing the draftOrder entirely.
//
// The other wallet-style methods (`paymentMethods.applePay`, `googlePay`,
// `paze`) are always STANDARD methods (`checkoutTypes: ['standard']`). They
// appear in the regular PaymentForm accordion alongside credit-card and use
// the draftOrder as their data source. Those are covered by
// `checkout-wallet-methods.test.tsx`, not here.
//
// What we CAN cover in jsdom:
//   * Section visibility — it shows iff `paymentMethods.express` is configured.
//   * Which provider's button (godaddy vs stripe) is rendered.
//
// What we CANNOT cover here (intentionally not asserted):
//   * The actual wallet-sheet interaction (Apple Pay / Google Pay UI).
//   * Tokenization via Poynt's `gdpay-express-pay-element` iframe.
//   * The express `payment_authorized` payload that combines the wallet's
//     calculated totals with the nonce. That flow is SDK-driven and only
//     reachable in real-browser e2e tests.
// ----------------------------------------------------------------------------

describe('Express checkout section visibility', () => {
  it('does not render the express section when paymentMethods.express is not configured', async () => {
    renderCheckout();
    await waitForCheckoutReady();

    expect(
      screen.queryByTestId('mock-godaddy-express-button')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('mock-stripe-express-button')
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/^OR$/)).not.toBeInTheDocument();
  });

  it('renders the dedicated GoDaddy ExpressCheckoutButton when paymentMethods.express is configured for godaddy', async () => {
    renderCheckout({
      sessionOverrides: {
        paymentMethods: {
          card: { processor: 'stripe', checkoutTypes: ['standard'] },
          // The dedicated `express` entry routes to ExpressCheckoutButton in
          // lazy-payment-loader's registry. The "OR" divider appears
          // alongside it via ExpressCheckoutButtons.
          express: { processor: 'godaddy', checkoutTypes: ['express'] },
        },
      },
    });
    await waitForCheckoutReady();

    expect(
      await screen.findByTestId('mock-godaddy-express-button')
    ).toBeVisible();
    expect(await screen.findByText(/^OR$/)).toBeVisible();
    // The standard credit-card form/button still appears below the express
    // section.
    expect(screen.getByRole('button', { name: /pay now/i })).toBeVisible();
  });

  it('renders the Stripe express button when paymentMethods.express is configured for stripe', async () => {
    renderCheckout({
      sessionOverrides: {
        paymentMethods: {
          card: { processor: 'stripe', checkoutTypes: ['standard'] },
          express: { processor: 'stripe', checkoutTypes: ['express'] },
        },
      },
    });
    await waitForCheckoutReady();

    expect(
      await screen.findByTestId('mock-stripe-express-button')
    ).toBeVisible();
    expect(
      screen.queryByTestId('mock-godaddy-express-button')
    ).not.toBeInTheDocument();
  });

  it('does NOT render the express section when only standard wallet methods are configured', async () => {
    // Standard wallet payment methods (paymentMethods.applePay/googlePay/paze
    // with checkoutTypes: ['standard']) belong in the PaymentForm accordion,
    // NOT the express section. Without `paymentMethods.express`, the express
    // section stays hidden — even when the SDK reports wallet support.
    renderCheckout({
      sessionOverrides: {
        paymentMethods: {
          card: { processor: 'stripe', checkoutTypes: ['standard'] },
          applePay: { processor: 'godaddy', checkoutTypes: ['standard'] },
          googlePay: { processor: 'godaddy', checkoutTypes: ['standard'] },
          paze: { processor: 'godaddy', checkoutTypes: ['standard'] },
        },
      },
      apiOverrides: {
        walletSupport: { applePay: true, googlePay: true, paze: true },
      },
    });
    await waitForCheckoutReady();

    expect(screen.queryByText(/^OR$/)).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('mock-godaddy-express-button')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('mock-stripe-express-button')
    ).not.toBeInTheDocument();
  });
});
