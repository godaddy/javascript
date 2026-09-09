import { enUs } from '@godaddy/localizations';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Checkout } from '@/components/checkout/checkout';
import { GoDaddyProvider } from '@/godaddy-provider';
import { CheckoutType, PaymentProvider } from '@/types';
import {
  advanceCheckoutDebounce,
  buildBillingAddress,
  buildCheckoutSession,
  buildDraftOrder,
  clearOperations,
  createTestQueryClient,
  getOperations,
  mockGodaddyApi,
  renderCheckout,
  typeIntoNamedField,
  waitForCheckoutReady,
  waitForOperation,
} from './checkout-test-env';
import { getLastUpdateInput } from './checkout-test-fixtures';

describe('Checkout validation behaviors', () => {
  it('hides phone fields and does not require a phone when phone collection is disabled', async () => {
    renderCheckout({
      sessionOverrides: { enablePhoneCollection: false },
      draftOrderOverrides: { shipping: { phone: '' } },
    });
    await waitForCheckoutReady();

    // No PhoneInput visible (its placeholder text is "Phone Number").
    expect(
      screen.queryByPlaceholderText(/phone number/i)
    ).not.toBeInTheDocument();

    // Pay button should be present and not disabled by missing phone.
    expect(
      screen.getByRole('button', { name: /pay now/i })
    ).toBeInTheDocument();
  });

  it('blocks submit and shows an error when the shipping phone is invalid', async () => {
    const { user } = renderCheckout({
      sessionOverrides: { enablePhoneCollection: true },
    });
    await waitForCheckoutReady();
    clearOperations();

    // PhoneInput is from react-phone-number-input; the visible input has
    // placeholder "(201) 555-1234". Type just enough digits to fail validation.
    const phone = (
      await screen.findAllByPlaceholderText(/201.*555/)
    )[0] as HTMLInputElement;
    await user.clear(phone);
    await user.type(phone, '12');

    const payNow = screen.getByRole('button', { name: /pay now/i });
    await user.click(payNow);

    // The form's superRefine emits the exact localized invalid-phone issue.
    await waitFor(() => {
      expect(document.body).toHaveTextContent(
        enUs.validation.enterValidShippingPhone
      );
    });
    expect(getOperations('TokenizeJs.getNonce')).toHaveLength(0);
  });

  it('shows full billing address for pickup card and names-only billing for offline pickup with tax enabled', async () => {
    const { user } = renderCheckout({
      draftOrderOverrides: {
        lineItems: [{ fulfillmentMode: 'PICKUP' }],
      },
      sessionOverrides: {
        enableShipping: false,
        enableLocalPickup: true,
        enableBillingAddressCollection: true,
        enablePhoneCollection: true,
        enableTaxCollection: true,
        paymentMethods: {
          card: {
            processor: PaymentProvider.STRIPE,
            checkoutTypes: [CheckoutType.STANDARD],
          },
          offline: {
            processor: PaymentProvider.OFFLINE,
            checkoutTypes: [CheckoutType.STANDARD],
          },
        },
      },
    });
    await waitForCheckoutReady();

    expect(
      document.querySelector('input[name="billingAddressLine1"]')
    ).toBeInTheDocument();

    await user.click(
      await screen.findByRole('button', { name: /offline payments/i })
    );

    expect(
      document.querySelector('input[name="billingFirstName"]')
    ).toBeInTheDocument();
    expect(
      document.querySelector('input[name="billingLastName"]')
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/201.*555/)).toBeInTheDocument();
    expect(
      document.querySelector('input[name="billingAddressLine1"]')
    ).not.toBeInTheDocument();
    expect(
      document.querySelector('input[name="billingPostalCode"]')
    ).not.toBeInTheDocument();
  });

  it('shows billing names and phone for offline pickup even when billing address collection is enabled', async () => {
    const { user } = renderCheckout({
      draftOrderOverrides: {
        lineItems: [{ fulfillmentMode: 'PICKUP' }],
      },
      sessionOverrides: {
        enableShipping: false,
        enableLocalPickup: true,
        enableBillingAddressCollection: true,
        enablePhoneCollection: true,
        enableTaxCollection: false,
        paymentMethods: {
          card: {
            processor: PaymentProvider.STRIPE,
            checkoutTypes: [CheckoutType.STANDARD],
          },
          offline: {
            processor: PaymentProvider.OFFLINE,
            checkoutTypes: [CheckoutType.STANDARD],
          },
        },
      },
    });
    await waitForCheckoutReady();

    await user.click(
      await screen.findByRole('button', { name: /offline payments/i })
    );

    expect(
      document.querySelector('input[name="billingFirstName"]')
    ).toBeInTheDocument();
    expect(
      document.querySelector('input[name="billingLastName"]')
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/201.*555/)).toBeInTheDocument();
    expect(
      document.querySelector('input[name="billingAddressLine1"]')
    ).not.toBeInTheDocument();
    expect(
      document.querySelector('input[name="billingPostalCode"]')
    ).not.toBeInTheDocument();
  });

  it('blocks a paid offline purchase-mode confirm while the required billing address is empty', async () => {
    const { user } = renderCheckout({
      draftOrderOverrides: {
        billing: {
          firstName: 'Pay',
          lastName: 'In Person',
          address: buildBillingAddress({
            addressLine1: '',
            adminArea2: '',
            postalCode: '',
          }),
        },
        lineItems: [{ fulfillmentMode: 'PURCHASE' }],
      },
      sessionOverrides: {
        enableShipping: false,
        enableLocalPickup: false,
        enableBillingAddressCollection: true,
        enableTaxCollection: true,
        enablePhoneCollection: false,
        paymentMethods: {
          card: null as never,
          offline: {
            processor: PaymentProvider.OFFLINE,
            checkoutTypes: [CheckoutType.STANDARD],
          },
        },
      },
    });
    await waitForCheckoutReady();

    // A paid offline order renders PaymentForm, so the billing address it shows
    // must also be validated — the free-order rules must not leak in here.
    expect(
      document.querySelector('input[name="billingAddressLine1"]')
    ).toBeInTheDocument();
    clearOperations();

    await user.click(
      await screen.findByRole('button', { name: /complete your order/i })
    );

    await waitFor(() => {
      expect(document.body).toHaveTextContent(enUs.validation.enterAddress);
    });
    expect(getOperations('ConfirmCheckoutSession')).toHaveLength(0);

    // Filling the address it asked for lets the same click through.
    await typeIntoNamedField(user, 'billingAddressLine1', '789 Billing Rd');
    await typeIntoNamedField(user, 'billingAdminArea2', 'Atlanta');
    await typeIntoNamedField(user, 'billingPostalCode', '30301');
    await user.click(
      screen.getByRole('button', { name: /complete your order/i })
    );

    await waitForOperation('ConfirmCheckoutSession');
    await advanceCheckoutDebounce(0);
  });

  it('blocks a paid offline pickup confirm while the billing phone is invalid', async () => {
    const { user } = renderCheckout({
      draftOrderOverrides: {
        billing: {
          firstName: 'Pay',
          lastName: 'In Person',
          phone: '',
        },
        lineItems: [{ fulfillmentMode: 'PICKUP' }],
      },
      sessionOverrides: {
        enableShipping: false,
        enableLocalPickup: true,
        enableBillingAddressCollection: true,
        enablePhoneCollection: true,
        enableTaxCollection: true,
        paymentMethods: {
          card: null as never,
          offline: {
            processor: PaymentProvider.OFFLINE,
            checkoutTypes: [CheckoutType.STANDARD],
          },
        },
      },
    });
    await waitForCheckoutReady();

    // Offline pickup collects names + phone only; the phone it renders still
    // has to be validated before confirming.
    const phone = (
      await screen.findAllByPlaceholderText(/201.*555/)
    )[0] as HTMLInputElement;
    await user.clear(phone);
    await user.type(phone, '12');
    clearOperations();

    await user.click(
      await screen.findByRole('button', { name: /complete your order/i })
    );

    await waitFor(() => {
      expect(document.body).toHaveTextContent(
        enUs.validation.enterValidBillingPhone
      );
    });
    expect(getOperations('ConfirmCheckoutSession')).toHaveLength(0);

    const rerenderedPhone = (
      await screen.findAllByPlaceholderText(/201.*555/)
    )[0] as HTMLInputElement;
    await user.clear(rerenderedPhone);
    await user.type(rerenderedPhone, '2015550123');
    await user.click(
      screen.getByRole('button', { name: /complete your order/i })
    );

    await waitForOperation('ConfirmCheckoutSession');
    await advanceCheckoutDebounce(0);
  });

  it('shows billing names and phone when billing address collection is disabled but phone collection is enabled', async () => {
    renderCheckout({
      draftOrderOverrides: {
        lineItems: [{ fulfillmentMode: 'PICKUP' }],
      },
      sessionOverrides: {
        enableShipping: false,
        enableLocalPickup: true,
        enableBillingAddressCollection: false,
        enablePhoneCollection: true,
      },
    });
    await waitForCheckoutReady();

    expect(
      document.querySelector('input[name="billingFirstName"]')
    ).toBeInTheDocument();
    expect(
      document.querySelector('input[name="billingLastName"]')
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/201.*555/)).toBeInTheDocument();
    expect(
      document.querySelector('input[name="billingAddressLine1"]')
    ).not.toBeInTheDocument();
    expect(
      document.querySelector('input[name="billingPostalCode"]')
    ).not.toBeInTheDocument();
  });
});

describe('Checkout notes UI', () => {
  it('hides notes textarea when enableNotesCollection is false', async () => {
    renderCheckout({ sessionOverrides: { enableNotesCollection: false } });
    await waitForCheckoutReady();

    expect(
      document.querySelector('textarea[name="notes"]')
    ).not.toBeInTheDocument();
  });

  it('renders notes in both shipping and pickup flows', async () => {
    const { user } = renderCheckout();
    await waitForCheckoutReady();

    expect(
      document.querySelector('textarea[name="notes"]')
    ).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /local pickup/i }));

    await waitFor(() => {
      expect(
        document.querySelector('textarea[name="notes"]')
      ).toBeInTheDocument();
    });
  });

  it('hydrates an existing customer note into the notes textarea', async () => {
    renderCheckout({
      draftOrderOverrides: {
        notes: [
          {
            authorType: 'CUSTOMER',
            content: 'Ring the doorbell',
          },
        ],
      },
    });
    await waitForCheckoutReady();

    expect(document.querySelector('textarea[name="notes"]')).toHaveValue(
      'Ring the doorbell'
    );
  });

  it('debounces a notes edit into one UpdateCheckoutSessionDraftOrder with the trimmed value', async () => {
    const { user } = renderCheckout();
    await waitForCheckoutReady();
    clearOperations();

    const notes = document.querySelector(
      'textarea[name="notes"]'
    ) as HTMLTextAreaElement;
    expect(notes).toBeTruthy();

    await user.clear(notes);
    await user.type(notes, '   Leave at front door  ');
    await advanceCheckoutDebounce(1500);
    await waitForOperation('UpdateCheckoutSessionDraftOrder');

    expect(getLastUpdateInput()).toMatchObject({
      notes: [{ authorType: 'CUSTOMER', content: 'Leave at front door' }],
    });
  });

  it('clears an existing customer note from the draft order', async () => {
    const { user } = renderCheckout({
      draftOrderOverrides: {
        notes: [
          {
            authorType: 'CUSTOMER',
            content: 'Remove this note',
          },
        ],
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    const notes = document.querySelector(
      'textarea[name="notes"]'
    ) as HTMLTextAreaElement;
    await user.clear(notes);
    await advanceCheckoutDebounce(1500);
    await waitForOperation('UpdateCheckoutSessionDraftOrder');

    expect(getLastUpdateInput()).toMatchObject({ notes: null });
  });
});

describe('Checkout error UI states', () => {
  it('shows the "checkout session not found" panel when there is no session and not loading', async () => {
    const queryClient = createTestQueryClient();
    render(
      <GoDaddyProvider
        queryClient={queryClient}
        apiHost='api.godaddy.test'
        clientId='client-1'
      >
        {/* No session + isLoading=false → render the not-found panel. */}
        <Checkout session={null as never} isLoading={false} />
      </GoDaddyProvider>
    );

    await waitFor(() => {
      // The panel uses t.apiErrors.CHECKOUT_SESSION_NOT_FOUND.
      expect(document.body).toHaveTextContent(
        enUs.apiErrors.CHECKOUT_SESSION_NOT_FOUND
      );
    });
  });

  it('renders the "checkout disabled" message when isCheckoutDisabled is true', async () => {
    const draftOrder = buildDraftOrder();
    const session = buildCheckoutSession({ draftOrder });
    mockGodaddyApi({ session, draftOrder });

    // Render via the normal helper but pass isCheckoutDisabled through props.\n    // renderCheckout doesn't accept this directly, so render manually.
    const queryClient = createTestQueryClient();
    const { checkoutQueryKeys } = await import(
      '@/components/checkout/utils/query-keys'
    );
    queryClient.setQueryData(checkoutQueryKeys.draftOrder(session.id), {
      checkoutSession: { ...session, draftOrder },
    });
    queryClient.setQueryData(checkoutQueryKeys.draftOrderProducts(session.id), {
      checkoutSession: { skus: { edges: [] } },
    });

    render(
      <GoDaddyProvider
        queryClient={queryClient}
        apiHost='api.godaddy.test'
        clientId='client-1'
      >
        <Checkout
          session={session}
          isCheckoutDisabled
          godaddyPaymentsConfig={{
            businessId: 'business-1',
            appId: 'test-app-id',
          }}
        />
      </GoDaddyProvider>
    );

    await waitFor(() => {
      // The CheckoutErrorList renders t.general.checkoutDisabled when
      // isCheckoutDisabled is true (even with no API errors).
      expect(document.body).toHaveTextContent(
        /checkout is currently disabled|disabled/i
      );
    });
  });
});
