import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import * as godaddyApi from '@/lib/godaddy/godaddy';
import {
  advanceCheckoutDebounce,
  buildBillingAddress,
  buildCheckoutSession,
  buildDraftOrder,
  buildDraftOrderUpdate,
  buildShippingAddress,
  clearOperations,
  getOperations,
  mockGodaddyApi,
  renderCheckout,
  typeIntoNamedField,
  waitForCheckoutReady,
  waitForOperation,
} from './checkout-test-env';
import { getLastUpdateInput } from './checkout-test-fixtures';

describe('Checkout billing behavior', () => {
  it('sends a full billing address when billing is collected separately from shipping', async () => {
    const { user } = renderCheckout({
      draftOrderOverrides: {
        billing: { address: buildBillingAddress({ adminArea1: 'GA' }) },
        lineItems: [{ fulfillmentMode: 'PICKUP' }],
      },
      sessionOverrides: {
        enableShipping: false,
        enableLocalPickup: true,
      },
    });
    await waitForCheckoutReady();

    await typeIntoNamedField(user, 'billingFirstName', 'Bill');
    await typeIntoNamedField(user, 'billingLastName', 'Buyer');
    await typeIntoNamedField(user, 'billingAddressLine1', '789 Billing Rd');
    await typeIntoNamedField(user, 'billingAdminArea2', 'Atlanta');
    await typeIntoNamedField(user, 'billingPostalCode', '30301');
    await advanceCheckoutDebounce();
    await waitForOperation('UpdateCheckoutSessionDraftOrder');

    expect(getLastUpdateInput()).toMatchObject({
      billing: {
        firstName: 'Bill',
        lastName: 'Buyer',
        address: expect.objectContaining({
          addressLine1: '789 Billing Rd',
          adminArea2: 'Atlanta',
          postalCode: '30301',
          countryCode: 'US',
        }),
      },
    });
  });

  it('calculates purchase-mode taxes from the collected billing address', async () => {
    const { user } = renderCheckout({
      draftOrderOverrides: {
        billing: { address: buildBillingAddress({ addressLine1: '' }) },
        lineItems: [{ fulfillmentMode: 'PURCHASE' }],
      },
      sessionOverrides: {
        enableShipping: false,
        enableLocalPickup: false,
        enableBillingAddressCollection: true,
        enableTaxCollection: true,
      },
    });
    await waitForCheckoutReady();

    await typeIntoNamedField(user, 'billingFirstName', 'Bill');
    await typeIntoNamedField(user, 'billingLastName', 'Buyer');
    await typeIntoNamedField(user, 'billingAddressLine1', '789 Billing Rd');
    await typeIntoNamedField(user, 'billingAdminArea2', 'Atlanta');
    await typeIntoNamedField(user, 'billingPostalCode', '30301');
    await advanceCheckoutDebounce();
    await waitForOperation('CalculateCheckoutSessionTaxes');

    expect(
      getOperations('CalculateCheckoutSessionTaxes').at(-1)?.input
    ).toMatchObject({
      destination: expect.objectContaining({
        addressLine1: '789 Billing Rd',
        adminArea2: 'Atlanta',
        postalCode: '30301',
        countryCode: 'US',
      }),
    });
  });

  it('collects names only for paid offline purchase mode when tax collection is disabled', async () => {
    renderCheckout({
      draftOrderOverrides: {
        billing: {
          firstName: 'Pay',
          lastName: 'In Person',
          address: buildBillingAddress({ addressLine1: '' }),
        },
        lineItems: [{ fulfillmentMode: 'PURCHASE' }],
      },
      sessionOverrides: {
        enableShipping: false,
        enableLocalPickup: false,
        enableBillingAddressCollection: true,
        enableTaxCollection: false,
        paymentMethods: {
          card: null as never,
          offline: {
            processor: 'offline',
            checkoutTypes: ['standard'],
          },
        },
      },
    });
    await waitForCheckoutReady();

    await waitFor(() => {
      expect(
        document.querySelector('input[name="billingFirstName"]')
      ).toBeInTheDocument();
      expect(
        document.querySelector('input[name="billingLastName"]')
      ).toBeInTheDocument();
      expect(
        document.querySelector('input[name="billingAddressLine1"]')
      ).not.toBeInTheDocument();
      expect(
        document.querySelector('input[name="billingPostalCode"]')
      ).not.toBeInTheDocument();
    });
  });

  it('respects disabled billing address collection in purchase mode even when tax collection is enabled', async () => {
    renderCheckout({
      draftOrderOverrides: {
        billing: {
          firstName: 'Names',
          lastName: 'Only',
          address: buildBillingAddress({ addressLine1: '' }),
        },
        lineItems: [{ fulfillmentMode: 'PURCHASE' }],
      },
      sessionOverrides: {
        enableShipping: false,
        enableLocalPickup: false,
        enableBillingAddressCollection: false,
        enableTaxCollection: true,
      },
    });
    await waitForCheckoutReady();

    await waitFor(() => {
      expect(
        document.querySelector('input[name="billingFirstName"]')
      ).toBeInTheDocument();
      expect(
        document.querySelector('input[name="billingLastName"]')
      ).toBeInTheDocument();
      expect(
        document.querySelector('input[name="billingAddressLine1"]')
      ).not.toBeInTheDocument();
      expect(
        document.querySelector('input[name="billingPostalCode"]')
      ).not.toBeInTheDocument();
    });
  });

  it('collects billing address for paid offline purchase mode when tax collection is enabled and uses it for taxes', async () => {
    const { user } = renderCheckout({
      draftOrderOverrides: {
        billing: { address: buildBillingAddress({ addressLine1: '' }) },
        lineItems: [{ fulfillmentMode: 'PURCHASE' }],
      },
      sessionOverrides: {
        enableShipping: false,
        enableLocalPickup: false,
        enableBillingAddressCollection: true,
        enableTaxCollection: true,
        paymentMethods: {
          card: null as never,
          offline: {
            processor: 'offline',
            checkoutTypes: ['standard'],
          },
        },
      },
    });
    await waitForCheckoutReady();

    expect(
      document.querySelector('input[name="billingAddressLine1"]')
    ).toBeInTheDocument();

    await typeIntoNamedField(user, 'billingFirstName', 'Offline');
    await typeIntoNamedField(user, 'billingLastName', 'Buyer');
    await typeIntoNamedField(user, 'billingAddressLine1', '456 Tax Lane');
    await typeIntoNamedField(user, 'billingAdminArea2', 'Austin');
    await typeIntoNamedField(user, 'billingPostalCode', '78701');
    await advanceCheckoutDebounce();
    await waitForOperation('CalculateCheckoutSessionTaxes');

    expect(
      getOperations('CalculateCheckoutSessionTaxes').at(-1)?.input
    ).toMatchObject({
      destination: expect.objectContaining({
        addressLine1: '456 Tax Lane',
        adminArea2: 'Austin',
        postalCode: '78701',
        countryCode: 'US',
      }),
    });
  });

  it('copies explicit shipping patches to billing while same-as-shipping is checked, then stops after unchecked', async () => {
    const draftOrder = buildDraftOrder();
    const session = buildCheckoutSession({ draftOrder });
    mockGodaddyApi({ session, draftOrder });
    clearOperations();

    await godaddyApi.updateDraftOrder(
      buildDraftOrderUpdate(
        {
          shipping: {
            address: buildShippingAddress({ addressLine1: '999 Copy Way' }),
          },
          billing: {
            address: buildBillingAddress({ addressLine1: '999 Copy Way' }),
          },
        },
        session
      ),
      session
    );
    expect(getLastUpdateInput()).toMatchObject({
      shipping: expect.objectContaining({ address: expect.any(Object) }),
      billing: expect.objectContaining({ address: expect.any(Object) }),
    });

    clearOperations();
    await godaddyApi.updateDraftOrder(
      buildDraftOrderUpdate(
        {
          shipping: {
            address: buildShippingAddress({ addressLine1: '1000 No Copy Way' }),
          },
        },
        session
      ),
      session
    );
    expect(getOperations('UpdateCheckoutSessionDraftOrder')).toHaveLength(1);
    expect(getLastUpdateInput()).toMatchObject({
      shipping: expect.objectContaining({ address: expect.any(Object) }),
    });
    expect(getLastUpdateInput()).not.toHaveProperty('billing');
  });

  it('derives same-as-shipping checked state using normalized name, phone, address, and optional fields', async () => {
    const sameAddress = buildShippingAddress({ addressLine2: '' });
    renderCheckout({
      draftOrder: buildDraftOrder({
        shipping: {
          firstName: 'Jane',
          lastName: 'Buyer',
          phone: '+12015550123',
          address: sameAddress,
        },
        billing: {
          firstName: 'Jane',
          lastName: 'Buyer',
          phone: '(201) 555-0123',
          address: buildBillingAddress({
            ...sameAddress,
            addressLine2: undefined,
          }),
        },
      }),
    });
    await waitForCheckoutReady();
    expect(
      screen.getByLabelText(/use shipping address as billing/i)
    ).toBeChecked();
  });

  it('derives same-as-shipping unchecked when names differ', async () => {
    const sameAddress = buildShippingAddress({ addressLine2: '' });
    const draftOrder = buildDraftOrder({
      shipping: {
        firstName: 'Jane',
        lastName: 'Buyer',
        phone: '+12015550123',
        address: sameAddress,
      },
      billing: {
        firstName: 'Janet',
        lastName: 'Buyer',
        phone: '+12015550123',
        address: sameAddress,
      },
    });
    renderCheckout({
      session: buildCheckoutSession({ draftOrder }),
      draftOrder,
    });
    await waitForCheckoutReady();
    expect(
      screen.getByLabelText(/use shipping address as billing/i)
    ).not.toBeChecked();
  });
});
