import { act } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import {
  restoreWindowLocation,
  setupCheckoutTestGlobals,
} from './checkout-test-utils';

vi.mock(
  '@/components/checkout/payment/payment-methods/credit-card/stripe',
  async () => {
    const React = await import('react');
    return {
      StripeCreditCardForm: () =>
        React.createElement('div', { 'data-testid': 'mock-card-form' }),
    };
  }
);

// ----------------------------------------------------------------------------
// Wallet / express button mocks
// ----------------------------------------------------------------------------
//
// The real wallet buttons (Apple Pay, Google Pay, Paze, the GoDaddy / Stripe
// "express" buttons) all rely on Poynt Collect or Stripe Elements to render a
// wallet sheet inside the page. That sheet is browser-/SDK-owned UI: the user
// approves payment in a native popover, the SDK fires a `payment_authorized`
// event with a tokenized nonce + (for express) shipping/tax/coupon values
// chosen inside the sheet, and the button code then calls `confirmCheckout`.
//
// None of that flow can be exercised in jsdom:
//   * Poynt's `gdpay-express-pay-element` mounts a remote iframe.
//   * Apple Pay / Google Pay sheets are native browser UI.
//   * Stripe's <ExpressCheckoutElement /> requires the live Stripe SDK.
//
// Tests in this suite therefore mock these buttons as inert presentational
// stubs. They render a recognizable element so we can assert *visibility* and
// *config gating* (which method appears in which section), but they do NOT
// fake a payment authorization. End-to-end tokenization + confirmation belongs
// in real-browser tests (Cypress / Playwright / staging).
function inertButtonMock(opts: {
  exportName: string;
  testId: string;
  label?: string;
}) {
  return async () => {
    const React = await import('react');
    return {
      [opts.exportName]: () =>
        React.createElement(
          'button',
          { type: 'button', 'data-testid': opts.testId },
          opts.label ?? opts.exportName
        ),
    };
  };
}

vi.mock(
  '@/components/checkout/payment/checkout-buttons/applePay/godaddy',
  inertButtonMock({
    exportName: 'GoDaddyApplePayCheckoutButton',
    testId: 'mock-apple-pay-button',
    label: 'Apple Pay',
  })
);

vi.mock(
  '@/components/checkout/payment/checkout-buttons/googlePay/godaddy',
  inertButtonMock({
    exportName: 'GoDaddyGooglePayCheckoutButton',
    testId: 'mock-google-pay-button',
    label: 'Google Pay',
  })
);

vi.mock(
  '@/components/checkout/payment/checkout-buttons/paze/godaddy',
  inertButtonMock({
    exportName: 'PazeCheckoutButton',
    testId: 'mock-paze-button',
    label: 'Paze',
  })
);

vi.mock(
  '@/components/checkout/payment/checkout-buttons/paypal/paypal',
  inertButtonMock({
    exportName: 'PayPalCheckoutButton',
    testId: 'mock-paypal-button',
    label: 'PayPal',
  })
);

// The dedicated express buttons (paymentMethods.express.processor=godaddy /
// stripe). Their real implementations open a wallet sheet, run their own
// shipping/tax/coupon flow, and then call confirmCheckout with isExpress=true
// + calculatedTaxes / calculatedAdjustments / shippingTotal directly. That
// modal flow is SDK-driven and untestable in jsdom — see comment above.
vi.mock(
  '@/components/checkout/payment/checkout-buttons/express/godaddy',
  inertButtonMock({
    exportName: 'ExpressCheckoutButton',
    testId: 'mock-godaddy-express-button',
    label: 'GoDaddy Express',
  })
);

vi.mock(
  '@/components/checkout/payment/checkout-buttons/express/stripe',
  inertButtonMock({
    exportName: 'StripeExpressCheckoutButton',
    testId: 'mock-stripe-express-button',
    label: 'Stripe Express',
  })
);

vi.mock(
  '@/components/checkout/payment/checkout-buttons/credit-card/stripe',
  async () => {
    const React = await import('react');
    const { useFormContext } = await import('react-hook-form');
    const { useCheckoutContext } = await import(
      '@/components/checkout/checkout'
    );
    const { useFlushCheckoutSync } = await import(
      '@/components/checkout/payment/utils/use-flush-checkout-sync'
    );
    const godaddyApi = await import('@/lib/godaddy/godaddy');

    return {
      StripeCreditCardCheckoutButton: () => {
        const form = useFormContext();
        const { session } = useCheckoutContext();
        const flushCheckoutSync = useFlushCheckoutSync();
        const [isLoading, setIsLoading] = React.useState(false);
        const [error, setError] = React.useState('');

        const onClick = async () => {
          const deliveryMethod = form.getValues('deliveryMethod');
          if (!deliveryMethod) {
            act(() => {
              form.setValue('deliveryMethod', 'SHIP');
            });
          }
          const valid = await form.trigger();
          if (!valid) return;
          await flushCheckoutSync({ includeFetches: false });
          act(() => {
            setIsLoading(true);
          });
          const collect = new window.TokenizeJs({
            businessId: session?.businessId ?? 'business-1',
            applicationId: 'test-app-id',
          });
          collect.on('nonce', async event => {
            await godaddyApi.confirmCheckout(
              {
                paymentToken: event?.data?.nonce ?? 'test-nonce',
                paymentType: 'card',
                paymentProvider: 'POYNT',
                fulfillmentLocationId:
                  form.getValues('pickupLocationId') ?? undefined,
                fulfillmentStartAt: form.getValues('pickupDate') || undefined,
                fulfillmentEndAt: form.getValues('pickupTime') || undefined,
              },
              session
            );
            act(() => {
              setIsLoading(false);
            });
          });
          collect.on('error', event => {
            act(() => {
              setError(event?.data?.error?.message || 'Payment failed');
              setIsLoading(false);
            });
          });
          collect.getNonce({});
        };

        return React.createElement(
          React.Fragment,
          null,
          error ? React.createElement('p', null, error) : null,
          React.createElement(
            'button',
            { type: 'button', onClick, disabled: isLoading },
            isLoading ? 'Processing payment' : 'Pay now'
          )
        );
      },
    };
  }
);

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  setupCheckoutTestGlobals();
});

afterEach(() => {
  act(() => {
    vi.runOnlyPendingTimers();
  });
  vi.useRealTimers();
  vi.restoreAllMocks();
  restoreWindowLocation();
});

export * from './checkout-test-utils';
