import { enUs } from '@godaddy/localizations';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  advanceCheckoutDebounce,
  buildBillingAddress,
  buildCheckoutSession,
  buildDraftOrder,
  buildShippingRates,
  clearOperations,
  getOperations,
  renderCheckout,
  waitForCheckoutReady,
  waitForOperation,
} from './checkout-test-env';
import { getLastConfirmInput } from './checkout-test-fixtures';

function buildFreeDraftOrder(
  overrides: Parameters<typeof buildDraftOrder>[0] = {}
) {
  return buildDraftOrder({
    totals: {
      subTotal: { value: 0, currencyCode: 'USD' },
      discountTotal: { value: 0, currencyCode: 'USD' },
      shippingTotal: { value: 0, currencyCode: 'USD' },
      taxTotal: { value: 0, currencyCode: 'USD' },
      feeTotal: { value: 0, currencyCode: 'USD' },
      total: { value: 0, currencyCode: 'USD' },
    },
    lineItems: [
      {
        unitAmount: { value: 0, currencyCode: 'USD' },
        fulfillmentMode: 'PURCHASE',
        totals: {
          subTotal: { value: 0, currencyCode: 'USD' },
          discountTotal: { value: 0, currencyCode: 'USD' },
          feeTotal: { value: 0, currencyCode: 'USD' },
          taxTotal: { value: 0, currencyCode: 'USD' },
        },
      },
    ],
    ...overrides,
  });
}

function buildFreeShippingDraftOrder(
  overrides: Parameters<typeof buildDraftOrder>[0] = {}
) {
  return buildFreeDraftOrder({
    lineItems: [{ fulfillmentMode: 'SHIP' }],
    shippingLines: [
      {
        id: 'shipping-line-free',
        requestedService: 'free-shipping',
        requestedProvider: 'unknown',
        name: 'Free',
        amount: { value: 0, currencyCode: 'USD' },
        discounts: [],
      },
    ],
    ...overrides,
  });
}

function freeShippingRates() {
  return buildShippingRates([
    {
      serviceCode: 'free-shipping',
      displayName: 'Free',
      description: 'Free',
      cost: { value: 0, currencyCode: 'USD' },
    },
  ]);
}

async function submitFreeOrder(
  user: ReturnType<typeof import('@testing-library/user-event').default.setup>
) {
  clearOperations();
  await user.click(
    await screen.findByRole('button', { name: /complete your free order/i })
  );
  await waitForOperation('ConfirmCheckoutSession');
  await advanceCheckoutDebounce(0);
}

describe('Checkout FreePaymentForm integration', () => {
  it('renders names-only billing for a free pickup order without a billing address', async () => {
    const draftOrder = buildFreeDraftOrder({
      lineItems: [{ fulfillmentMode: 'PICKUP' }],
      billing: {
        firstName: 'Free',
        lastName: 'Pickup',
        phone: '',
        email: 'jane@example.com',
        address: null,
      },
    });
    const session = buildCheckoutSession({
      draftOrder,
      enableShipping: false,
      enableLocalPickup: true,
      enableTaxCollection: false,
    });

    renderCheckout({ session, draftOrder });
    await waitForCheckoutReady();

    expect(
      screen.getByRole('button', { name: /complete your free order/i })
    ).toBeInTheDocument();
    expect(
      document.querySelector('input[name="billingFirstName"]')
    ).toHaveValue('Free');
    expect(document.querySelector('input[name="billingLastName"]')).toHaveValue(
      'Pickup'
    );
    expect(
      document.querySelector('input[name="billingAddressLine1"]')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /pay now/i })
    ).not.toBeInTheDocument();
    expect(getOperations('TokenizeJs.getNonce')).toHaveLength(0);
  });

  it('confirms a free shipping order without rendering billing address fields', async () => {
    const draftOrder = buildFreeDraftOrder({
      lineItems: [{ fulfillmentMode: 'SHIP' }],
      shippingLines: [
        {
          id: 'shipping-line-free',
          requestedService: 'free-shipping',
          requestedProvider: 'unknown',
          name: 'Free',
          amount: { value: 0, currencyCode: 'USD' },
          discounts: [],
        },
      ],
    });
    const session = buildCheckoutSession({
      draftOrder,
      enableShipping: true,
      enableLocalPickup: false,
      enableTaxCollection: false,
    });

    const { user } = renderCheckout({
      session,
      draftOrder,
      apiOverrides: {
        shippingMethods: buildShippingRates([
          {
            serviceCode: 'free-shipping',
            displayName: 'Free',
            description: 'Free',
            cost: { value: 0, currencyCode: 'USD' },
          },
        ]),
      },
    });
    await waitForCheckoutReady();

    expect(
      screen.getByRole('button', { name: /complete your free order/i })
    ).toBeInTheDocument();
    expect(
      document.querySelector('input[name="shippingAddressLine1"]')
    ).toBeInTheDocument();
    expect(
      document.querySelector('input[name="billingAddressLine1"]')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /pay now/i })
    ).not.toBeInTheDocument();

    await submitFreeOrder(user);

    expect(getLastConfirmInput()).toMatchObject({
      paymentToken: '',
      paymentType: 'offline',
      paymentProvider: 'OFFLINE',
    });
    expect(getLastConfirmInput()).not.toHaveProperty('fulfillmentLocationId');
  });

  it('collects billing names only for a free purchase order when tax collection is disabled', async () => {
    const draftOrder = buildFreeDraftOrder({
      lineItems: [{ fulfillmentMode: 'PURCHASE' }],
    });
    const session = buildCheckoutSession({
      draftOrder,
      enableShipping: false,
      enableLocalPickup: false,
      enableTaxCollection: false,
    });

    renderCheckout({ session, draftOrder });
    await waitForCheckoutReady();

    expect(
      screen.getByRole('button', { name: /complete your free order/i })
    ).toBeInTheDocument();
    // A free purchase order follows the same rules as a paid offline one: names
    // are collected, and the address is skipped because no tax destination is
    // needed.
    expect(
      document.querySelector('input[name="billingFirstName"]')
    ).toBeInTheDocument();
    expect(
      document.querySelector('input[name="billingAddressLine1"]')
    ).not.toBeInTheDocument();
    expect(
      document.querySelector('input[name="shippingAddressLine1"]')
    ).not.toBeInTheDocument();
  });

  it('collects a billing address for a free purchase order when tax collection is enabled', async () => {
    const draftOrder = buildFreeDraftOrder({
      lineItems: [{ fulfillmentMode: 'PURCHASE' }],
      billing: { address: buildBillingAddress({ addressLine1: '' }) },
    });
    const session = buildCheckoutSession({
      draftOrder,
      enableShipping: false,
      enableLocalPickup: false,
      enableBillingAddressCollection: true,
      enableTaxCollection: true,
    });

    renderCheckout({ session, draftOrder });
    await waitForCheckoutReady();

    expect(
      document.querySelector('input[name="billingAddressLine1"]')
    ).toBeInTheDocument();
    expect(
      document.querySelector('input[name="billingPostalCode"]')
    ).toBeInTheDocument();
  });

  it('blocks a free purchase order confirm while a required billing field is empty', async () => {
    const draftOrder = buildFreeDraftOrder({
      lineItems: [{ fulfillmentMode: 'PURCHASE' }],
      billing: { firstName: '', lastName: '' },
    });
    const session = buildCheckoutSession({
      draftOrder,
      enableShipping: false,
      enableLocalPickup: false,
      enableTaxCollection: false,
    });

    const { user } = renderCheckout({ session, draftOrder });
    await waitForCheckoutReady();
    clearOperations();

    // The schema requires billing names here, so the fields must be rendered
    // and validated instead of leaving the button silently inert.
    await user.click(
      await screen.findByRole('button', { name: /complete your free order/i })
    );

    await waitFor(() => {
      expect(document.body).toHaveTextContent(enUs.validation.enterFirstName);
    });
    expect(getOperations('ConfirmCheckoutSession')).toHaveLength(0);
  });

  it('collects a billing address for a free shipping order whose billing differs from shipping', async () => {
    const draftOrder = buildFreeDraftOrder({
      lineItems: [{ fulfillmentMode: 'SHIP' }],
      billing: {
        address: buildBillingAddress({ addressLine1: '99 Billing Blvd' }),
      },
    });
    const session = buildCheckoutSession({
      draftOrder,
      enableShipping: true,
      enableLocalPickup: false,
      enableBillingAddressCollection: true,
      enableTaxCollection: false,
    });

    renderCheckout({ session, draftOrder });
    await waitForCheckoutReady();

    // Billing is not a copy of shipping, so the free form has to keep showing
    // the billing address the schema still requires.
    expect(
      document.querySelector('input[name="billingAddressLine1"]')
    ).toHaveValue('99 Billing Blvd');
  });

  it('lets a free shipping order reuse the shipping address for billing', async () => {
    const draftOrder = buildFreeShippingDraftOrder({
      billing: { firstName: '', lastName: '', phone: '', address: null },
    });
    const session = buildCheckoutSession({
      draftOrder,
      enableShipping: true,
      enableLocalPickup: false,
      enableTaxCollection: false,
    });

    const { user } = renderCheckout({
      session,
      draftOrder,
      apiOverrides: { shippingMethods: freeShippingRates() },
    });
    await waitForCheckoutReady();

    // An order that arrives with only a shipping address starts out asking for
    // a separate billing address, so the customer needs the same opt-out the
    // paid form offers instead of being forced to retype the address.
    const toggle = screen.getByLabelText(/use shipping address as billing/i);
    expect(toggle).not.toBeChecked();
    expect(
      document.querySelector('input[name="billingAddressLine1"]')
    ).toBeInTheDocument();

    await user.click(toggle);

    expect(toggle).toBeChecked();
    expect(
      document.querySelector('input[name="billingAddressLine1"]')
    ).not.toBeInTheDocument();
    await submitFreeOrder(user);
    expect(getLastConfirmInput()).toMatchObject({ paymentType: 'offline' });
  });

  it('lets a free shipping order opt into a separate billing address', async () => {
    const draftOrder = buildFreeShippingDraftOrder();
    const session = buildCheckoutSession({
      draftOrder,
      enableShipping: true,
      enableLocalPickup: false,
      enableTaxCollection: false,
    });

    const { user } = renderCheckout({
      session,
      draftOrder,
      apiOverrides: { shippingMethods: freeShippingRates() },
    });
    await waitForCheckoutReady();

    const toggle = screen.getByLabelText(/use shipping address as billing/i);
    expect(toggle).toBeChecked();
    expect(
      document.querySelector('input[name="billingAddressLine1"]')
    ).not.toBeInTheDocument();

    await user.click(toggle);

    // Opting out reveals the billing address form and, because unchecking
    // clears the copied address, the order cannot confirm until it is filled.
    expect(
      document.querySelector('input[name="billingAddressLine1"]')
    ).toBeInTheDocument();
    clearOperations();
    await user.click(
      await screen.findByRole('button', { name: /complete your free order/i })
    );
    await waitFor(() => {
      expect(document.body).toHaveTextContent(enUs.validation.enterAddress);
    });
    expect(getOperations('ConfirmCheckoutSession')).toHaveLength(0);
  });

  it('treats a missing order total as free in both the rendered form and validation', async () => {
    const draftOrder = buildFreeDraftOrder({
      lineItems: [{ fulfillmentMode: 'PURCHASE' }],
      totals: { total: null },
    });
    const session = buildCheckoutSession({
      draftOrder,
      enableShipping: false,
      enableLocalPickup: false,
      enableTaxCollection: false,
    });

    const { user } = renderCheckout({ session, draftOrder });
    await waitForCheckoutReady();

    expect(
      screen.getByRole('button', { name: /complete your free order/i })
    ).toBeInTheDocument();

    // Rendering and validation must agree on "free", otherwise the button
    // validates fields that were never rendered and silently does nothing.
    await submitFreeOrder(user);

    expect(getLastConfirmInput()).toMatchObject({
      paymentToken: '',
      paymentType: 'offline',
      paymentProvider: 'OFFLINE',
    });
  });
});
