import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DeliveryMethods } from '@/components/checkout/delivery/delivery-methods';
import {
  buildLineItem,
  clearOperations,
  getOperations,
  renderCheckout,
  typeIntoNamedField,
  waitForCheckoutReady,
  waitForOperation,
} from './checkout-test-env';
import { getLastConfirmInput } from './checkout-test-fixtures';

const expressPaymentMethods = {
  card: { processor: 'stripe', checkoutTypes: ['standard'] },
  express: { processor: 'godaddy', checkoutTypes: ['express'] },
};

function buildDigitalLineItem(overrides = {}) {
  return buildLineItem({
    id: 'digital-line-item',
    type: DeliveryMethods.DIGITAL,
    fulfillmentMode: DeliveryMethods.NONE,
    ...overrides,
  });
}

function getInput(name: string) {
  return document.querySelector(`input[name="${name}"]`);
}

function expectBillingNamesOnlyWithPhone() {
  expect(getInput('billingFirstName')).toBeInTheDocument();
  expect(getInput('billingLastName')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('(201) 555-1234')).toBeInTheDocument();
  expect(getInput('billingAddressLine1')).not.toBeInTheDocument();
  expect(getInput('billingPostalCode')).not.toBeInTheDocument();
}

function expectFullBillingAddress() {
  expect(getInput('billingFirstName')).toBeInTheDocument();
  expect(getInput('billingLastName')).toBeInTheDocument();
  expect(getInput('billingAddressLine1')).toBeInTheDocument();
  expect(getInput('billingAdminArea2')).toBeInTheDocument();
  expect(getInput('billingPostalCode')).toBeInTheDocument();
}

describe('Digital fulfillment checkout', () => {
  it('hides delivery, shipping, pickup, and express for digital-only orders', async () => {
    renderCheckout({
      draftOrderOverrides: {
        shippingLines: [],
        lineItems: [buildDigitalLineItem()],
      },
      sessionOverrides: {
        enableTaxCollection: true,
        paymentMethods: expressPaymentMethods,
      },
    });
    await waitForCheckoutReady();

    expect(screen.queryByText(/^Delivery$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Shipping$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Pickup$/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/^Billing Address$/).length).toBeGreaterThan(0);
    expect(
      screen.queryByTestId('mock-godaddy-express-button')
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/^OR$/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pay now/i })).toBeVisible();
  });

  it('prevents a custom layout from forcing digital-only delivery or express sections', async () => {
    renderCheckout({
      checkoutProps: {
        layout: [
          'express-checkout',
          'delivery',
          'shipping',
          'pickup',
          'payment',
        ],
      },
      draftOrderOverrides: {
        shippingLines: [],
        lineItems: [buildDigitalLineItem()],
      },
      sessionOverrides: {
        paymentMethods: expressPaymentMethods,
      },
    });
    await waitForCheckoutReady();

    expect(screen.queryByText(/^Delivery$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Shipping$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Pickup$/)).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('mock-godaddy-express-button')
    ).not.toBeInTheDocument();
  });

  it('confirms a paid digital-only taxable order with billing tax address and without shipping or pickup fields', async () => {
    const { user } = renderCheckout({
      draftOrderOverrides: {
        shipping: { address: null },
        lineItems: [buildDigitalLineItem()],
      },
      sessionOverrides: {
        enableTaxCollection: true,
        enableShipping: true,
        enableLocalPickup: true,
      },
    });
    await waitForCheckoutReady();
    expectFullBillingAddress();
    clearOperations();

    await user.click(screen.getByRole('button', { name: /pay now/i }));

    await waitForOperation('ConfirmCheckoutSession');
    expect(getLastConfirmInput()).toMatchObject({
      paymentToken: 'test-nonce',
      paymentType: 'card',
    });
    expect(getLastConfirmInput()).not.toHaveProperty('fulfillmentLocationId');
    expect(getLastConfirmInput()).not.toHaveProperty('fulfillmentStartAt');
    expect(getLastConfirmInput()).not.toHaveProperty('fulfillmentEndAt');
  });

  it('confirms a free digital-only taxable order with billing tax address and without shipping or pickup fields', async () => {
    const { user } = renderCheckout({
      draftOrderOverrides: {
        shipping: { address: null },
        totals: {
          subTotal: { value: 0, currencyCode: 'USD' },
          discountTotal: { value: 0, currencyCode: 'USD' },
          shippingTotal: { value: 0, currencyCode: 'USD' },
          taxTotal: { value: 0, currencyCode: 'USD' },
          feeTotal: { value: 0, currencyCode: 'USD' },
          total: { value: 0, currencyCode: 'USD' },
        },
        lineItems: [
          buildDigitalLineItem({
            unitAmount: { value: 0, currencyCode: 'USD' },
            totals: {
              subTotal: { value: 0, currencyCode: 'USD' },
              discountTotal: { value: 0, currencyCode: 'USD' },
              feeTotal: { value: 0, currencyCode: 'USD' },
              taxTotal: { value: 0, currencyCode: 'USD' },
            },
          }),
        ],
      },
      sessionOverrides: {
        enableTaxCollection: true,
        enableShipping: true,
        enableLocalPickup: true,
      },
    });
    await waitForCheckoutReady();
    expectFullBillingAddress();
    clearOperations();

    await user.click(
      screen.getByRole('button', { name: /complete your free order/i })
    );

    await waitForOperation('ConfirmCheckoutSession');
    expect(getLastConfirmInput()).toMatchObject({
      paymentType: 'offline',
      paymentProvider: 'OFFLINE',
    });
    expect(getLastConfirmInput()).not.toHaveProperty('fulfillmentLocationId');
  });

  it('shows full billing address for paid card digital-only orders when tax is disabled', async () => {
    renderCheckout({
      draftOrderOverrides: {
        shipping: { address: null },
        lineItems: [buildDigitalLineItem()],
      },
      sessionOverrides: {
        enableTaxCollection: false,
        enableShipping: true,
        enableLocalPickup: true,
      },
    });
    await waitForCheckoutReady();

    expectFullBillingAddress();
  });

  it('shows billing names and phone for paid offline digital-only orders when tax is disabled', async () => {
    const { user } = renderCheckout({
      draftOrderOverrides: {
        shipping: { address: null },
        lineItems: [buildDigitalLineItem()],
      },
      sessionOverrides: {
        enableTaxCollection: false,
        enableShipping: true,
        enableLocalPickup: true,
        paymentMethods: {
          card: {
            processor: 'stripe',
            checkoutTypes: ['standard'],
          },
          offline: {
            processor: 'offline',
            checkoutTypes: ['standard'],
          },
        },
      },
    });
    await waitForCheckoutReady();

    await user.click(await screen.findByRole('button', { name: /offline/i }));

    expectBillingNamesOnlyWithPhone();
  });

  it('shows billing names and phone for free digital-only orders when tax is disabled', async () => {
    renderCheckout({
      draftOrderOverrides: {
        shipping: { address: null },
        totals: {
          subTotal: { value: 0, currencyCode: 'USD' },
          discountTotal: { value: 0, currencyCode: 'USD' },
          shippingTotal: { value: 0, currencyCode: 'USD' },
          taxTotal: { value: 0, currencyCode: 'USD' },
          feeTotal: { value: 0, currencyCode: 'USD' },
          total: { value: 0, currencyCode: 'USD' },
        },
        lineItems: [
          buildDigitalLineItem({
            unitAmount: { value: 0, currencyCode: 'USD' },
            totals: {
              subTotal: { value: 0, currencyCode: 'USD' },
              discountTotal: { value: 0, currencyCode: 'USD' },
              feeTotal: { value: 0, currencyCode: 'USD' },
              taxTotal: { value: 0, currencyCode: 'USD' },
            },
          }),
        ],
      },
      sessionOverrides: {
        enableTaxCollection: false,
        enableShipping: true,
        enableLocalPickup: true,
      },
    });
    await waitForCheckoutReady();

    expectBillingNamesOnlyWithPhone();
  });

  it('uses the billing address for digital-only tax recalculation', async () => {
    const { user } = renderCheckout({
      draftOrderOverrides: {
        shippingLines: [],
        lineItems: [buildDigitalLineItem()],
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    await typeIntoNamedField(user, 'billingPostalCode', '78701');
    await waitForOperation('UpdateCheckoutSessionDraftOrder');
    await waitForOperation('CalculateCheckoutSessionTaxes');

    expect(
      getOperations('CalculateCheckoutSessionTaxes').at(-1)?.input
    ).toMatchObject({
      destination: expect.objectContaining({ postalCode: '78701' }),
    });
  });

  it('shows express for physical shipping items initially in NONE fulfillment when shipping is enabled', async () => {
    renderCheckout({
      draftOrderOverrides: {
        lineItems: [
          buildLineItem({
            id: 'physical-line-item',
            fulfillmentMode: DeliveryMethods.NONE,
          }),
        ],
      },
      sessionOverrides: {
        enableShipping: true,
        enableLocalPickup: false,
        paymentMethods: expressPaymentMethods,
      },
    });
    await waitForCheckoutReady();

    expect(
      await screen.findByTestId('mock-godaddy-express-button')
    ).toBeVisible();
  });

  it('shows express for mixed digital and physical shipping items initially in NONE fulfillment', async () => {
    renderCheckout({
      draftOrderOverrides: {
        lineItems: [
          buildDigitalLineItem(),
          buildLineItem({
            id: 'physical-line-item',
            fulfillmentMode: DeliveryMethods.NONE,
          }),
        ],
      },
      sessionOverrides: {
        enableShipping: true,
        enableLocalPickup: false,
        paymentMethods: expressPaymentMethods,
      },
    });
    await waitForCheckoutReady();

    expect(
      await screen.findByTestId('mock-godaddy-express-button')
    ).toBeVisible();
  });

  it('hides express for mixed digital and pickup orders', async () => {
    renderCheckout({
      draftOrderOverrides: {
        lineItems: [
          buildDigitalLineItem(),
          buildLineItem({
            id: 'pickup-line-item',
            fulfillmentMode: DeliveryMethods.PICKUP,
          }),
        ],
      },
      sessionOverrides: {
        enableShipping: true,
        enableLocalPickup: true,
        paymentMethods: expressPaymentMethods,
      },
    });
    await waitForCheckoutReady();

    expect(
      screen.queryByTestId('mock-godaddy-express-button')
    ).not.toBeInTheDocument();
  });

  it('does not let digital NONE lines trigger shipping fulfillment sync', async () => {
    renderCheckout({
      draftOrderOverrides: {
        shippingLines: [
          {
            requestedService: 'free-shipping',
            requestedProvider: 'unknown',
            name: 'Free',
            amount: { value: 0, currencyCode: 'USD' },
            discounts: [],
          },
        ],
        lineItems: [
          buildDigitalLineItem(),
          buildLineItem({ id: 'physical-line-item', fulfillmentMode: 'SHIP' }),
        ],
      },
      sessionOverrides: {
        enableShipping: true,
        enableLocalPickup: false,
      },
    });
    await waitForCheckoutReady();

    await waitFor(() => {
      expect(getOperations('ApplyCheckoutSessionShippingMethod')).toHaveLength(
        0
      );
    });
  });

  it('does not let digital NONE lines trigger pickup fulfillment sync', async () => {
    renderCheckout({
      draftOrderOverrides: {
        lineItems: [
          buildDigitalLineItem(),
          buildLineItem({ id: 'pickup-line-item', fulfillmentMode: 'PICKUP' }),
        ],
      },
      sessionOverrides: {
        enableShipping: false,
        enableLocalPickup: true,
        locations: [],
      },
    });
    await waitForCheckoutReady();

    await waitFor(() => {
      expect(
        getOperations('ApplyCheckoutSessionFulfillmentLocation')
      ).toHaveLength(0);
    });
  });
});
