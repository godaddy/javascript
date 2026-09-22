import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PaymentProvider } from '@/types';
import {
  getTokenizeInstances,
  MockTokenizeJs,
  renderCheckout,
  waitForCheckoutReady,
} from './checkout-test-env';

// ----------------------------------------------------------------------------
// Standard wallet payment methods (Apple Pay / Google Pay / Paze)
// ----------------------------------------------------------------------------
//
// These methods are configured with `checkoutTypes: ['standard']` and appear
// inside the regular PaymentForm accordion alongside the credit-card method.
// At runtime, when the user selects (e.g.) Apple Pay, the corresponding
// button is rendered in place of the "Pay now" button. Clicking it opens the
// wallet sheet, which produces a tokenized credit-card nonce; the button
// then sends `paymentType: card` (NOT `apple_pay`/`google_pay`/`paze`) to
// confirmCheckout, using the draftOrder's existing totals.
//
// What we CAN cover in jsdom:
//   * PaymentForm filters wallet methods on a `supportWalletPayments` check
//     from the Poynt SDK. Visibility is therefore gated on BOTH the session
//     config AND the SDK's support response.
//   * PaymentForm filters GoDaddy card/ACH on a resolvable business id.
//   * The accordion lists configured regular methods with labels/copy.
//
// What we CANNOT cover:
//   * The actual wallet-sheet flow (Poynt's TokenizeJs `mount` → wallet sheet
//     → `nonce` event). Those interactions are SDK-driven.
//   * The follow-up confirmCheckout with the wallet's nonce — gated by SDK
//     callbacks we cannot fire from jsdom.
// ----------------------------------------------------------------------------

describe('Payment method gating', () => {
  it.each([
    { businessId: 'business-1' },
    { businessId: 'business-1', appId: '' },
    undefined,
  ])(
    'loads GoDaddy card and ACH without an app ID: %j',
    async godaddyPaymentsConfig => {
      const mount = vi.spyOn(MockTokenizeJs.prototype, 'mount');
      const tokenizeConfigs: unknown[] = [];
      class RecordingTokenizeJs extends MockTokenizeJs {
        constructor(config: unknown) {
          super();
          tokenizeConfigs.push(config);
        }
      }
      vi.stubGlobal('TokenizeJs', RecordingTokenizeJs);

      const { user } = renderCheckout({
        sessionOverrides: {
          paymentMethods: {
            card: {
              processor: PaymentProvider.GODADDY,
              checkoutTypes: ['standard'],
            },
            ach: {
              processor: PaymentProvider.GODADDY,
              checkoutTypes: ['standard'],
            },
          },
          experimental_rules: {
            gopay_override: {
              enabled: false,
              goPayAppId: '',
            },
          },
        },
        checkoutProps: {
          godaddyPaymentsConfig,
        },
      });
      await waitForCheckoutReady();

      expect(
        await screen.findByRole('button', { name: /credit or debit card/i })
      ).toBeInTheDocument();
      await waitFor(() => expect(mount).toHaveBeenCalled());
      expect(tokenizeConfigs[0]).toMatchObject({
        businessId: 'business-1',
        applicationId: godaddyPaymentsConfig?.appId,
      });

      mount.mockClear();
      await user.click(screen.getByRole('button', { name: /bank account/i }));
      await waitFor(() => expect(mount).toHaveBeenCalled());
      expect(tokenizeConfigs.at(-1)).toMatchObject({
        businessId: 'business-1',
        applicationId: godaddyPaymentsConfig?.appId,
      });
      expect(
        screen.queryByText('No payment methods available')
      ).not.toBeInTheDocument();
    }
  );

  it('filters GoDaddy card and ACH when no business ID can be resolved', async () => {
    renderCheckout({
      sessionOverrides: {
        businessId: '',
        paymentMethods: {
          card: {
            processor: PaymentProvider.GODADDY,
            checkoutTypes: ['standard'],
          },
          ach: {
            processor: PaymentProvider.GODADDY,
            checkoutTypes: ['standard'],
          },
        },
      },
      checkoutProps: { godaddyPaymentsConfig: { appId: 'app-1' } },
    });
    await waitForCheckoutReady();
    expect(
      screen.getByText('No payment methods available')
    ).toBeInTheDocument();
    expect(getTokenizeInstances()).toHaveLength(0);
  });

  it('passes the gopay_override application ID to Collect', async () => {
    const tokenizeArgs: unknown[][] = [];
    class RecordingTokenizeJs extends MockTokenizeJs {
      constructor(...args: unknown[]) {
        super();
        tokenizeArgs.push(args);
      }
    }
    vi.stubGlobal('TokenizeJs', RecordingTokenizeJs);

    renderCheckout({
      sessionOverrides: {
        paymentMethods: {
          card: {
            processor: PaymentProvider.GODADDY,
            checkoutTypes: ['standard'],
          },
          ach: {
            processor: PaymentProvider.GODADDY,
            checkoutTypes: ['standard'],
          },
        },
        experimental_rules: {
          gopay_override: {
            enabled: true,
            goPayAppId: 'override-app-id',
          },
        },
      },
      checkoutProps: {
        godaddyPaymentsConfig: { businessId: 'business-1', appId: '' },
      },
    });
    await waitForCheckoutReady();

    expect(
      await screen.findByRole('button', { name: /credit or debit card/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /bank account/i })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(getTokenizeInstances().length).toBeGreaterThan(0);
    });
    expect(
      tokenizeArgs.some(([config]) =>
        Boolean(
          config &&
            typeof config === 'object' &&
            'applicationId' in config &&
            (config as { applicationId?: unknown }).applicationId ===
              'override-app-id'
        )
      )
    ).toBe(true);
  });

  it('renders offline as a regular non-free payment method', async () => {
    renderCheckout({
      sessionOverrides: {
        paymentMethods: {
          card: {
            processor: PaymentProvider.STRIPE,
            checkoutTypes: ['standard'],
          },
          offline: {
            processor: PaymentProvider.OFFLINE,
            checkoutTypes: ['standard'],
          },
        },
      },
    });
    await waitForCheckoutReady();

    expect(
      await screen.findByRole('button', { name: /offline payments/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /credit or debit card/i })
    ).toBeInTheDocument();
  });

  it('auto-selects a single method with no accordion content and hides the accordion', async () => {
    renderCheckout({
      sessionOverrides: {
        paymentMethods: {
          card: null,
          offline: {
            processor: PaymentProvider.OFFLINE,
            checkoutTypes: ['standard'],
          },
        },
      },
    });
    await waitForCheckoutReady();

    expect(
      screen.queryByRole('button', { name: /offline payments/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /complete your order/i })
    ).toBeInTheDocument();
  });

  it('renders description-only method content without mounting an inline form', async () => {
    const { user } = renderCheckout({
      sessionOverrides: {
        paymentMethods: {
          card: {
            processor: PaymentProvider.STRIPE,
            checkoutTypes: ['standard'],
          },
          mercadopago: {
            processor: PaymentProvider.MERCADOPAGO,
            checkoutTypes: ['standard'],
          },
        },
      },
      checkoutProps: {
        mercadoPagoConfig: { publicKey: 'mp-public-key', country: 'MX' },
      },
    });
    await waitForCheckoutReady();

    await user.click(
      await screen.findByRole('button', { name: /mercado pago/i })
    );
    expect(
      await screen.findByText(
        'Use the MercadoPago form below to complete your purchase securely.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByTestId('mock-card-form')).not.toBeInTheDocument();
  });
});

describe('Standard wallet payment methods', () => {
  it('does not show Apple Pay in the accordion when the SDK does not report support', async () => {
    renderCheckout({
      sessionOverrides: {
        paymentMethods: {
          card: {
            processor: PaymentProvider.STRIPE,
            checkoutTypes: ['standard'],
          },
          applePay: {
            processor: PaymentProvider.GODADDY,
            checkoutTypes: ['standard'],
          },
        },
      },
      // Default walletSupport is { applePay: false, ... }
    });
    await waitForCheckoutReady();

    expect(
      screen.queryByRole('button', { name: /^apple pay/i })
    ).not.toBeInTheDocument();
  });

  it('shows Apple Pay without an app ID when the SDK reports support', async () => {
    renderCheckout({
      sessionOverrides: {
        paymentMethods: {
          card: {
            processor: PaymentProvider.STRIPE,
            checkoutTypes: ['standard'],
          },
          applePay: {
            processor: PaymentProvider.GODADDY,
            checkoutTypes: ['standard'],
          },
        },
      },
      checkoutProps: { godaddyPaymentsConfig: undefined },
      apiOverrides: {
        walletSupport: { applePay: true },
      },
    });
    await waitForCheckoutReady();

    // The accordion item is implemented as an AccordionTrigger button. The
    // accessible name includes the method label.
    expect(
      await screen.findByRole('button', { name: /apple pay/i })
    ).toBeInTheDocument();
  });

  it('shows Paze and Google Pay in the accordion when both are supported', async () => {
    renderCheckout({
      sessionOverrides: {
        paymentMethods: {
          card: {
            processor: PaymentProvider.STRIPE,
            checkoutTypes: ['standard'],
          },
          paze: {
            processor: PaymentProvider.GODADDY,
            checkoutTypes: ['standard'],
          },
          googlePay: {
            processor: PaymentProvider.GODADDY,
            checkoutTypes: ['standard'],
          },
        },
      },
      apiOverrides: {
        walletSupport: { paze: true, googlePay: true },
      },
    });
    await waitForCheckoutReady();

    expect(
      await screen.findByRole('button', { name: /paze/i })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: /google pay/i })
    ).toBeInTheDocument();
  });

  it('keeps credit-card as the first/default accordion option even with wallet methods configured', async () => {
    renderCheckout({
      sessionOverrides: {
        paymentMethods: {
          card: {
            processor: PaymentProvider.STRIPE,
            checkoutTypes: ['standard'],
          },
          applePay: {
            processor: PaymentProvider.GODADDY,
            checkoutTypes: ['standard'],
          },
          googlePay: {
            processor: PaymentProvider.GODADDY,
            checkoutTypes: ['standard'],
          },
          paze: {
            processor: PaymentProvider.GODADDY,
            checkoutTypes: ['standard'],
          },
        },
      },
      apiOverrides: {
        walletSupport: { applePay: true, googlePay: true, paze: true },
      },
    });
    await waitForCheckoutReady();

    // The "Pay now" button (credit-card) should be present immediately —
    // i.e., the credit-card method is the initially-selected accordion item.
    expect(
      screen.getByRole('button', { name: /pay now/i })
    ).toBeInTheDocument();

    // The credit-card accordion item should be present and listed before
    // the wallet items in DOM order (PaymentForm sorts credit-card first).
    const cardTrigger = await screen.findByRole('button', {
      name: /credit or debit card/i,
    });
    const applePayTrigger = screen.getByRole('button', {
      name: /apple pay/i,
    });
    const cardComesBeforeApplePay =
      // biome-ignore lint/suspicious/noBitwiseOperators: bitmask comparison required by the DOM API.
      (cardTrigger.compareDocumentPosition(applePayTrigger) &
        Node.DOCUMENT_POSITION_FOLLOWING) !==
      0;
    expect(cardComesBeforeApplePay).toBe(true);
  });
});
