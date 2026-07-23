import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  advanceCheckoutDebounce,
  buildCheckoutSession,
  buildDraftOrder,
  buildShippingRates,
  clearOperations,
  getOperationOrder,
  getOperations,
  renderCheckout,
  typeIntoNamedField,
  waitForCheckoutReady,
  waitForOperation,
} from './checkout-test-env';
import {
  getLastConfirmInput,
  getLastUpdateInput,
} from './checkout-test-fixtures';

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
  it('renders pickup customer names in the pickup section for a free pickup order', async () => {
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
      document.querySelectorAll('input[name="billingFirstName"]')
    ).toHaveLength(1);
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

  it('renders a free purchase order without collecting address fields', async () => {
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
    // Current FreePaymentForm renders the submit button only for PURCHASE
    // orders. PRD T-107/T-401 notes document that new billing collection
    // fields are not rendered for this case.
    expect(
      document.querySelector('input[name="billingAddressLine1"]')
    ).not.toBeInTheDocument();
    expect(
      document.querySelector('input[name="shippingAddressLine1"]')
    ).not.toBeInTheDocument();
  });

  it('persists pickup billing names before free-order confirmation without waiting for debounce', async () => {
    const draftOrder = buildFreeDraftOrder({
      lineItems: [{ fulfillmentMode: 'PICKUP' }],
      billing: {
        firstName: '',
        lastName: '',
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

    const { user } = renderCheckout({ session, draftOrder });
    await waitForCheckoutReady();

    await typeIntoNamedField(user, 'billingFirstName', 'Immediate');
    await typeIntoNamedField(user, 'billingLastName', 'Pickup');

    clearOperations();
    await user.click(
      await screen.findByRole('button', { name: /complete your free order/i })
    );
    await waitForOperation('ConfirmCheckoutSession');

    const [updateIdx, confirmIdx] = getOperationOrder([
      'UpdateCheckoutSessionDraftOrder',
      'ConfirmCheckoutSession',
    ]);
    expect(updateIdx).toBeGreaterThanOrEqual(0);
    expect(confirmIdx).toBeGreaterThan(updateIdx);
    expect(getLastUpdateInput()).toMatchObject({
      billing: {
        firstName: 'Immediate',
        lastName: 'Pickup',
      },
    });
    expect(getLastUpdateInput()?.billing).not.toHaveProperty('address');
  });
});
