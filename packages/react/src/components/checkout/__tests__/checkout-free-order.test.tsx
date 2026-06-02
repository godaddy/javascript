import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  buildCheckoutSession,
  buildDraftOrder,
  buildShippingRates,
  clearOperations,
  getOperations,
  mockGodaddyApi,
  renderCheckout,
  setApiErrorOnce,
  waitForCheckoutReady,
  waitForOperation,
} from './checkout-test-env';
import { getLastConfirmInput } from './checkout-test-fixtures';

// FreePaymentForm only renders for orders whose total is <= 0. Build a
// zero-total draft order to trigger that code path.
function buildFreeDraftOrder(opts: { withShippingLine?: boolean } = {}) {
  return buildDraftOrder({
    totals: {
      subTotal: { value: 0, currencyCode: 'USD' },
      discountTotal: { value: 0, currencyCode: 'USD' },
      shippingTotal: { value: 0, currencyCode: 'USD' },
      taxTotal: { value: 0, currencyCode: 'USD' },
      feeTotal: { value: 0, currencyCode: 'USD' },
      total: { value: 0, currencyCode: 'USD' },
    },
    shippingLines: opts.withShippingLine
      ? [
          {
            id: 'shipping-line-free',
            requestedService: 'free-shipping',
            requestedProvider: 'unknown',
            name: 'Free',
            amount: { value: 0, currencyCode: 'USD' },
            discounts: [],
          },
        ]
      : [],
    lineItems: [
      {
        unitAmount: { value: 0, currencyCode: 'USD' },
        totals: {
          subTotal: { value: 0, currencyCode: 'USD' },
          discountTotal: { value: 0, currencyCode: 'USD' },
          feeTotal: { value: 0, currencyCode: 'USD' },
          taxTotal: { value: 0, currencyCode: 'USD' },
        },
      },
    ],
  });
}

async function applyCoupon(
  user: ReturnType<typeof import('@testing-library/user-event').default.setup>,
  code: string
) {
  let input: HTMLInputElement | undefined;
  let apply: HTMLButtonElement | undefined;

  await waitFor(() => {
    const inputs = screen.getAllByPlaceholderText(
      /coupon code/i
    ) as HTMLInputElement[];
    const buttons = screen.getAllByRole('button', {
      name: /apply/i,
    }) as HTMLButtonElement[];
    const index = inputs.findIndex(candidate => !candidate.disabled);
    expect(index).toBeGreaterThanOrEqual(0);
    input = inputs[index];
    apply = buttons[index];
  });

  await user.clear(input as HTMLInputElement);
  await user.type(input as HTMLInputElement, code);
  await waitFor(() => {
    expect(apply as HTMLButtonElement).not.toBeDisabled();
  });
  await user.click(apply as HTMLButtonElement);
}

function buildPaidPurchaseDraftOrder() {
  return buildDraftOrder({
    totals: {
      subTotal: { value: 100, currencyCode: 'USD' },
      discountTotal: { value: 0, currencyCode: 'USD' },
      shippingTotal: { value: 0, currencyCode: 'USD' },
      taxTotal: { value: 0, currencyCode: 'USD' },
      feeTotal: { value: 0, currencyCode: 'USD' },
      total: { value: 100, currencyCode: 'USD' },
    },
    lineItems: [
      {
        unitAmount: { value: 100, currencyCode: 'USD' },
        fulfillmentMode: 'PURCHASE',
        totals: {
          subTotal: { value: 100, currencyCode: 'USD' },
          discountTotal: { value: 0, currencyCode: 'USD' },
          feeTotal: { value: 0, currencyCode: 'USD' },
          taxTotal: { value: 0, currencyCode: 'USD' },
        },
      },
    ],
  });
}

describe('Checkout free / offline orders', () => {
  it('confirms a free pickup order with paymentType=offline and no tokenize call', async () => {
    const draftOrder = buildFreeDraftOrder();
    // Use pickup so useConfirmCheckout's MISSING_SHIPPING_INFO check is
    // skipped (only triggers for SHIP delivery).
    draftOrder.lineItems = (draftOrder.lineItems ?? []).map(li => ({
      ...li,
      fulfillmentMode: 'PICKUP',
    }));

    // Disable taxes; the test mock's calculateTaxes() adds $2 to every order
    // which would push a "free" cart over $0 and hide the FreePaymentForm.
    const session = buildCheckoutSession({
      draftOrder,
      enableShipping: false,
      enableLocalPickup: true,
      enableTaxCollection: false,
    });
    mockGodaddyApi({ session, draftOrder });

    const { user } = renderCheckout({ session, draftOrder });
    await waitForCheckoutReady();

    // Fill required pickup names (free pickup requires names-only billing).
    await user.type(
      document.querySelector(
        'input[name="billingFirstName"]'
      ) as HTMLInputElement,
      'Free'
    );
    await user.type(
      document.querySelector(
        'input[name="billingLastName"]'
      ) as HTMLInputElement,
      'Pickup'
    );
    clearOperations();

    // Free order shows the FreePaymentForm submit button (translation:
    // "Place order"). The text comes from t.payment.freePayment.
    const submit = await screen.findByRole('button', {
      name: /complete your free order/i,
    });
    await user.click(submit);

    await waitForOperation('ConfirmCheckoutSession');

    // Only tokenization for paid card should have happened — for offline,
    // there is no TokenizeJs.getNonce.
    expect(getOperations('TokenizeJs.getNonce')).toHaveLength(0);
    expect(getLastConfirmInput()).toMatchObject({
      paymentType: 'offline',
      paymentProvider: 'OFFLINE',
    });
  });

  it('does not require billing address for a free pickup order (names only)', async () => {
    const draftOrder = buildFreeDraftOrder();
    // Switch to pickup
    draftOrder.lineItems = (draftOrder.lineItems ?? []).map(li => ({
      ...li,
      fulfillmentMode: 'PICKUP',
    }));
    draftOrder.billing = {
      firstName: '',
      lastName: '',
      phone: '',
      email: 'jane@example.com',
      address: null,
    };

    const session = buildCheckoutSession({
      draftOrder,
      enableShipping: false,
      enableLocalPickup: true,
      enableTaxCollection: false,
    });
    mockGodaddyApi({ session, draftOrder });

    const { user } = renderCheckout({ session, draftOrder });
    await waitForCheckoutReady();

    // Billing input should be names-only, no address line input.
    const firstName = await screen.findByPlaceholderText(/first name/i);
    expect(firstName).toBeInTheDocument();
    expect(
      document.querySelector('input[name="billingAddressLine1"]')
    ).not.toBeInTheDocument();

    // Fill in just the names and submit.
    await user.type(
      document.querySelector(
        'input[name="billingFirstName"]'
      ) as HTMLInputElement,
      'Free'
    );
    await user.type(
      document.querySelector(
        'input[name="billingLastName"]'
      ) as HTMLInputElement,
      'Pickup'
    );

    clearOperations();
    const submit = await screen.findByRole('button', {
      name: /complete your free order/i,
    });
    await user.click(submit);

    await waitForOperation('ConfirmCheckoutSession');
    expect(getLastConfirmInput()).toMatchObject({
      paymentType: 'offline',
      paymentProvider: 'OFFLINE',
    });
  });

  it('blocks the free-pickup submit when name fields are empty', async () => {
    const draftOrder = buildFreeDraftOrder();
    draftOrder.lineItems = (draftOrder.lineItems ?? []).map(li => ({
      ...li,
      fulfillmentMode: 'PICKUP',
    }));
    draftOrder.billing = {
      firstName: '',
      lastName: '',
      phone: '',
      email: 'jane@example.com',
      address: null,
    };

    const session = buildCheckoutSession({
      draftOrder,
      enableShipping: false,
      enableLocalPickup: true,
      enableTaxCollection: false,
    });
    mockGodaddyApi({ session, draftOrder });

    const { user } = renderCheckout({ session, draftOrder });
    await waitForCheckoutReady();
    clearOperations();

    const submit = await screen.findByRole('button', {
      name: /complete your free order/i,
    });
    await user.click(submit);

    // Form validation prevents the mutation: no confirm op.
    await waitFor(() => {
      expect(getOperations('ConfirmCheckoutSession')).toHaveLength(0);
    });
  });

  it('confirms a free shipping order when a free shipping line satisfies the guard', async () => {
    const draftOrder = buildFreeDraftOrder({ withShippingLine: true });
    draftOrder.lineItems = (draftOrder.lineItems ?? []).map(li => ({
      ...li,
      fulfillmentMode: 'SHIP',
    }));

    const session = buildCheckoutSession({
      draftOrder,
      enableShipping: true,
      enableLocalPickup: false,
      enableTaxCollection: false,
    });
    mockGodaddyApi({ session, draftOrder });

    const { user } = renderCheckout({ session, draftOrder });
    await waitForCheckoutReady();
    clearOperations();

    await user.click(
      await screen.findByRole('button', { name: /complete your free order/i })
    );

    await waitForOperation('ConfirmCheckoutSession');
    expect(getLastConfirmInput()).toMatchObject({
      paymentType: 'offline',
      paymentProvider: 'OFFLINE',
    });
  });

  it('confirms a free purchase order without shipping or pickup fulfillment', async () => {
    const draftOrder = buildFreeDraftOrder();
    draftOrder.lineItems = (draftOrder.lineItems ?? []).map(li => ({
      ...li,
      fulfillmentMode: 'PURCHASE',
    }));

    const session = buildCheckoutSession({
      draftOrder,
      enableShipping: false,
      enableLocalPickup: false,
      enableTaxCollection: false,
    });
    mockGodaddyApi({ session, draftOrder });

    const { user } = renderCheckout({ session, draftOrder });
    await waitForCheckoutReady();
    clearOperations();

    await user.click(
      await screen.findByRole('button', { name: /complete your free order/i })
    );

    await waitForOperation('ConfirmCheckoutSession');
    expect(getLastConfirmInput()).toMatchObject({
      paymentType: 'offline',
      paymentProvider: 'OFFLINE',
    });
    expect(getLastConfirmInput()).not.toHaveProperty('fulfillmentLocationId');
  });

  it('switches from paid payment methods to FreePaymentForm after a 100% coupon', async () => {
    const draftOrder = buildPaidPurchaseDraftOrder();
    const session = buildCheckoutSession({
      draftOrder,
      enableShipping: false,
      enableLocalPickup: false,
      enableTaxCollection: false,
    });

    const { user } = renderCheckout({ session, draftOrder });
    await waitForCheckoutReady();
    expect(await screen.findByRole('button', { name: /pay now/i })).toBeInTheDocument();

    clearOperations();
    await applyCoupon(user, 'free100');
    await waitForOperation('ApplyCheckoutSessionDiscount');

    expect(
      await screen.findByRole('button', { name: /complete your free order/i })
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /pay now/i })).not.toBeInTheDocument();

    clearOperations();
    await user.click(screen.getByRole('button', { name: /complete your free order/i }));
    await waitForOperation('ConfirmCheckoutSession');
    expect(getLastConfirmInput()).toMatchObject({
      paymentType: 'offline',
      paymentProvider: 'OFFLINE',
    });
  });

  it('returns to the paid payment form when the free coupon is removed', async () => {
    const draftOrder = buildPaidPurchaseDraftOrder();
    const session = buildCheckoutSession({
      draftOrder,
      enableShipping: false,
      enableLocalPickup: false,
      enableTaxCollection: false,
    });

    const { user } = renderCheckout({ session, draftOrder });
    await waitForCheckoutReady();

    await applyCoupon(user, 'free100');
    await waitForOperation('ApplyCheckoutSessionDiscount');
    expect(
      await screen.findByRole('button', { name: /complete your free order/i })
    ).toBeInTheDocument();

    clearOperations();
    await user.click(screen.getByRole('button', { name: /remove free100/i }));
    await waitForOperation('ApplyCheckoutSessionDiscount');
    await waitForOperation('DraftOrder');

    expect(await screen.findByRole('button', { name: /pay now/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /complete your free order/i })
    ).not.toBeInTheDocument();
  });

  it('switches to FreePaymentForm when selecting a free shipping rate makes the total zero', async () => {
    const draftOrder = buildDraftOrder({
      totals: {
        subTotal: { value: 0, currencyCode: 'USD' },
        discountTotal: { value: 0, currencyCode: 'USD' },
        shippingTotal: { value: 100, currencyCode: 'USD' },
        taxTotal: { value: 0, currencyCode: 'USD' },
        feeTotal: { value: 0, currencyCode: 'USD' },
        total: { value: 100, currencyCode: 'USD' },
      },
      shippingLines: [
        {
          requestedService: 'weight-based',
          requestedProvider: 'unknown',
          name: 'Weight Based',
          amount: { value: 100, currencyCode: 'USD' },
          discounts: [],
        },
      ],
      lineItems: [
        {
          unitAmount: { value: 0, currencyCode: 'USD' },
          fulfillmentMode: 'SHIP',
          totals: {
            subTotal: { value: 0, currencyCode: 'USD' },
            discountTotal: { value: 0, currencyCode: 'USD' },
            feeTotal: { value: 0, currencyCode: 'USD' },
            taxTotal: { value: 0, currencyCode: 'USD' },
          },
        },
      ],
    });
    const session = buildCheckoutSession({
      draftOrder,
      enableShipping: true,
      enableLocalPickup: false,
      enableTaxCollection: false,
      experimental_rules: {
        freeShipping: { enabled: true, minimumOrderTotal: 0 },
      },
    });

    const { user } = renderCheckout({
      session,
      draftOrder,
      apiOverrides: { shippingMethods: buildShippingRates() },
    });
    await waitForCheckoutReady();
    expect(await screen.findByRole('button', { name: /pay now/i })).toBeInTheDocument();

    clearOperations();
    await user.click(screen.getByRole('radio', { name: /free/i }));
    await waitForOperation('ApplyCheckoutSessionShippingMethod');

    expect(
      await screen.findByRole('button', { name: /complete your free order/i })
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /pay now/i })).not.toBeInTheDocument();
  });

  it('keeps the paid form visible when coupon application fails', async () => {
    const draftOrder = buildPaidPurchaseDraftOrder();
    const session = buildCheckoutSession({
      draftOrder,
      enableShipping: false,
      enableLocalPickup: false,
      enableTaxCollection: false,
    });

    const { user } = renderCheckout({ session, draftOrder });
    await waitForCheckoutReady();
    setApiErrorOnce('applyDiscount', 'discount failed');

    clearOperations();
    await applyCoupon(user, 'badcode');
    await waitForOperation('ApplyCheckoutSessionDiscount');

    expect(await screen.findByRole('button', { name: /pay now/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /complete your free order/i })
    ).not.toBeInTheDocument();
    expect(document.body).toHaveTextContent(/failed to apply coupon code/i);
  });

});
