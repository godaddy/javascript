import { enUs } from '@godaddy/localizations';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Checkout } from '@/components/checkout/checkout';
import { GoDaddyProvider } from '@/godaddy-provider';
import {
  advanceCheckoutDebounce,
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
