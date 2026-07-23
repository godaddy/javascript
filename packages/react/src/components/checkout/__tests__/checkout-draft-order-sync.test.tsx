import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DeliveryMethods } from '@/components/checkout/delivery/delivery-methods';
import { checkoutQueryKeys } from '@/components/checkout/utils/query-keys';
import {
  advanceCheckoutDebounce,
  buildDraftOrder,
  buildShippingAddress,
  clearOperations,
  fillShippingAddress,
  flushPromises,
  getCurrentDraftOrder,
  getNamedInput,
  getOperations,
  renderCheckout,
  setApiError,
  typeIntoNamedField,
  waitForCheckoutReady,
  waitForOperation,
} from './checkout-test-env';
import {
  getLastConfirmInput,
  getLastUpdateInput,
} from './checkout-test-fixtures';

function offlinePaymentMethods() {
  return {
    card: null as never,
    offline: {
      processor: 'offline',
      checkoutTypes: ['standard'],
    },
  };
}

async function waitForDeliveryMethodEnabled(name: RegExp) {
  await waitFor(() => {
    expect(screen.getByRole('radio', { name })).not.toBeDisabled();
  });
}

describe('Checkout draft-order field sync', () => {
  it('syncs contact email to both shipping and billing', async () => {
    const { user } = renderCheckout();
    await waitForCheckoutReady();
    clearOperations();

    const email = screen.getByLabelText(/email/i);
    await user.clear(email);
    await user.type(email, 'new@example.com');
    await advanceCheckoutDebounce();
    await waitForOperation('UpdateCheckoutSessionDraftOrder');

    expect(getLastUpdateInput()).toMatchObject({
      shipping: { email: 'new@example.com' },
      billing: { email: 'new@example.com' },
    });
  });

  it('batches fast shipping address entry into one merged update including optional field clearing', async () => {
    const { user } = renderCheckout({
      draftOrderOverrides: {
        shipping: {
          firstName: '',
          lastName: '',
          address: buildShippingAddress({
            addressLine1: '',
            addressLine2: 'Old Apt',
            adminArea1: 'GA',
            adminArea2: '',
            postalCode: '',
          }),
        },
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    await fillShippingAddress(user, { addressLine2: '' });
    await advanceCheckoutDebounce();
    await waitForOperation('UpdateCheckoutSessionDraftOrder');

    expect(getOperations('UpdateCheckoutSessionDraftOrder')).toHaveLength(1);
    expect(getLastUpdateInput()).toMatchObject({
      shipping: {
        firstName: 'Ship',
        lastName: 'Buyer',
        address: expect.objectContaining({
          addressLine1: '456 Shipping Ln',
          addressLine2: '',
          adminArea2: 'Jasper',
          postalCode: '30143',
          countryCode: 'US',
        }),
      },
    });
  });

  it('syncs shipping name-only edits without sending address or recalculating taxes', async () => {
    const { user } = renderCheckout();
    await waitForCheckoutReady();
    await waitForOperation('ApplyCheckoutSessionShippingMethod');
    clearOperations();

    await typeIntoNamedField(user, 'shippingFirstName', 'Janet');
    await advanceCheckoutDebounce();
    await waitForOperation('UpdateCheckoutSessionDraftOrder');

    expect(getLastUpdateInput()).toMatchObject({
      shipping: { firstName: 'Janet', lastName: 'Buyer' },
      billing: { firstName: 'Janet', lastName: 'Buyer' },
    });
    expect(getLastUpdateInput()?.shipping).not.toHaveProperty('address');
    expect(getLastUpdateInput()?.billing).not.toHaveProperty('address');
    expect(getOperations('CalculateCheckoutSessionTaxes')).toHaveLength(0);
    expect(getOperations('DraftOrderShippingRates')).toHaveLength(0);
  });

  it('keeps pickup selected when a draft-order refetch still looks like shipping', async () => {
    const { user, queryClient, session } = renderCheckout({
      draftOrderOverrides: {
        lineItems: [{ fulfillmentMode: DeliveryMethods.SHIP }],
      },
    });
    await waitForCheckoutReady();
    await waitForDeliveryMethodEnabled(/local pickup/i);

    await user.click(screen.getByRole('radio', { name: /local pickup/i }));
    await waitFor(() => {
      expect(
        screen.getByRole('radio', { name: /local pickup/i })
      ).toBeChecked();
    });

    queryClient.setQueryData(checkoutQueryKeys.draftOrder(session.id), {
      checkoutSession: {
        ...session,
        draftOrder: buildDraftOrder({
          lineItems: [{ fulfillmentMode: DeliveryMethods.SHIP }],
        }),
      },
    });
    await flushPromises();

    await waitFor(() => {
      expect(
        screen.getByRole('radio', { name: /local pickup/i })
      ).toBeChecked();
      expect(
        screen.getByRole('radio', { name: /shipping/i })
      ).not.toBeChecked();
    });
  });

  it('keeps shipping selected when a stale pickup refetch arrives during delivery-method switching', async () => {
    const stalePickupOrder = buildDraftOrder({
      lineItems: [{ fulfillmentMode: DeliveryMethods.PICKUP }],
      shippingLines: [],
    });
    const { user, queryClient, session } = renderCheckout({
      draftOrder: stalePickupOrder,
    });
    await waitForCheckoutReady();
    await waitForDeliveryMethodEnabled(/shipping/i);

    await user.click(screen.getByRole('radio', { name: /shipping/i }));
    queryClient.setQueryData(checkoutQueryKeys.draftOrder(session.id), {
      checkoutSession: {
        ...session,
        draftOrder: stalePickupOrder,
      },
    });
    await flushPromises();

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /shipping/i })).toBeChecked();
      expect(
        screen.getByRole('radio', { name: /local pickup/i })
      ).not.toBeChecked();
    });
  });

  it('defaults to pickup when shipping is disabled and the order-derived method is shipping', async () => {
    renderCheckout({
      draftOrderOverrides: {
        lineItems: [{ fulfillmentMode: DeliveryMethods.SHIP }],
      },
      sessionOverrides: {
        enableShipping: false,
        enableLocalPickup: true,
      },
    });
    await waitForCheckoutReady();

    expect(
      screen.queryByRole('radio', { name: /shipping/i })
    ).not.toBeInTheDocument();
    expect(document.body).toHaveTextContent(/local pickup/i);
  });

  it('defaults to shipping when pickup is disabled and the order-derived method is pickup', async () => {
    renderCheckout({
      draftOrderOverrides: {
        lineItems: [{ fulfillmentMode: DeliveryMethods.PICKUP }],
      },
      sessionOverrides: {
        enableShipping: true,
        enableLocalPickup: false,
      },
    });
    await waitForCheckoutReady();

    expect(
      screen.queryByRole('radio', { name: /local pickup/i })
    ).not.toBeInTheDocument();
    expect(document.body).toHaveTextContent(/shipping/i);
  });

  it('keeps an explicit delivery selection across mixed-fulfillment refetches', async () => {
    const mixedOrder = buildDraftOrder({
      lineItems: [
        { id: 'ship-item', fulfillmentMode: DeliveryMethods.SHIP },
        { id: 'pickup-item', fulfillmentMode: DeliveryMethods.PICKUP },
      ],
    });
    const { user, queryClient, session } = renderCheckout({
      draftOrder: mixedOrder,
    });
    await waitForCheckoutReady();
    await waitForDeliveryMethodEnabled(/local pickup/i);

    await user.click(screen.getByRole('radio', { name: /local pickup/i }));
    await waitFor(() => {
      expect(
        screen.getByRole('radio', { name: /local pickup/i })
      ).toBeChecked();
    });

    queryClient.setQueryData(checkoutQueryKeys.draftOrder(session.id), {
      checkoutSession: {
        ...session,
        draftOrder: mixedOrder,
      },
    });
    await flushPromises();

    await waitFor(() => {
      expect(
        screen.getByRole('radio', { name: /local pickup/i })
      ).toBeChecked();
      expect(
        screen.getByRole('radio', { name: /shipping/i })
      ).not.toBeChecked();
    });
  });

  it('keeps shipping selected when a shipping address sync refetches a prior pickup order', async () => {
    const { user } = renderCheckout({
      draftOrderOverrides: {
        lineItems: [{ fulfillmentMode: DeliveryMethods.PICKUP }],
        shippingLines: [],
        shipping: {
          address: buildShippingAddress({
            addressLine1: '',
            addressLine2: '',
            adminArea1: 'GA',
            adminArea2: '',
            postalCode: '',
            countryCode: 'US',
          }),
        },
      },
    });
    await waitForCheckoutReady();
    await waitForOperation('ApplyCheckoutSessionFulfillmentLocation');
    await waitForOperation('CalculateCheckoutSessionTaxes');
    await waitForOperation('DraftOrder');
    await flushPromises();
    clearOperations();

    expect(screen.getByRole('radio', { name: /local pickup/i })).toBeChecked();

    await waitFor(() => {
      expect(
        screen.getByRole('radio', { name: /shipping/i })
      ).not.toBeDisabled();
    });
    await user.click(screen.getByRole('radio', { name: /shipping/i }));
    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /shipping/i })).toBeChecked();
    });

    await typeIntoNamedField(user, 'shippingAddressLine1', '456 Shipping Ln');
    await typeIntoNamedField(user, 'shippingAdminArea2', 'Jasper');
    await typeIntoNamedField(user, 'shippingPostalCode', '30143');
    await advanceCheckoutDebounce();
    await waitForOperation('UpdateCheckoutSessionDraftOrder');
    await flushPromises();

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /shipping/i })).toBeChecked();
      expect(
        screen.getByRole('radio', { name: /local pickup/i })
      ).not.toBeChecked();
    });
  });

  it('confirms as shipping after pickup-to-shipping address sync refetches', async () => {
    const { user } = renderCheckout({
      draftOrderOverrides: {
        lineItems: [{ fulfillmentMode: DeliveryMethods.PICKUP }],
        shippingLines: [],
        shipping: {
          firstName: '',
          lastName: '',
          address: buildShippingAddress({
            addressLine1: '',
            addressLine2: '',
            adminArea1: 'GA',
            adminArea2: '',
            postalCode: '',
            countryCode: 'US',
          }),
        },
      },
      sessionOverrides: {
        paymentMethods: offlinePaymentMethods(),
      },
    });
    await waitForCheckoutReady();
    await waitForOperation('ApplyCheckoutSessionFulfillmentLocation');
    await waitForDeliveryMethodEnabled(/shipping/i);
    clearOperations();

    await user.click(screen.getByRole('radio', { name: /shipping/i }));
    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /shipping/i })).toBeChecked();
    });

    await typeIntoNamedField(user, 'shippingFirstName', 'Ship');
    await typeIntoNamedField(user, 'shippingLastName', 'Buyer');
    await typeIntoNamedField(user, 'shippingAddressLine1', '456 Shipping Ln');
    await typeIntoNamedField(user, 'shippingAdminArea2', 'Jasper');
    await typeIntoNamedField(user, 'shippingPostalCode', '30143');
    await advanceCheckoutDebounce();
    await waitForOperation('UpdateCheckoutSessionDraftOrder');
    await waitForOperation('ApplyCheckoutSessionShippingMethod');
    await flushPromises();

    await user.click(
      await screen.findByRole('button', { name: /complete your order/i })
    );
    await waitForOperation('ConfirmCheckoutSession');

    expect(getLastConfirmInput()).not.toHaveProperty('fulfillmentLocationId');
    expect(getLastConfirmInput()).not.toHaveProperty('fulfillmentStartAt');
    expect(getLastConfirmInput()).not.toHaveProperty('fulfillmentEndAt');
  });

  it('still sends address and recalculates taxes when only an address field changes', async () => {
    const { user } = renderCheckout();
    await waitForCheckoutReady();
    await waitForOperation('ApplyCheckoutSessionShippingMethod');
    clearOperations();

    setApiError('getDraftOrderShippingMethods', 'rates failed');

    await typeIntoNamedField(user, 'shippingPostalCode', '94016');
    await advanceCheckoutDebounce();
    await waitForOperation('UpdateCheckoutSessionDraftOrder');
    await waitForOperation('CalculateCheckoutSessionTaxes');
    await waitForOperation('DraftOrderShippingRates', 1, 6000);

    expect(getLastUpdateInput()).toMatchObject({
      shipping: {
        firstName: 'Jane',
        lastName: 'Buyer',
        address: expect.objectContaining({ postalCode: '94016' }),
      },
    });
    expect(
      getOperations('CalculateCheckoutSessionTaxes').length
    ).toBeGreaterThan(0);
    expect(
      getOperations('DraftOrderShippingRates').at(-1)?.input
    ).toMatchObject({
      destination: expect.objectContaining({ postalCode: '94016' }),
    });
  });

  it('syncs a complete shipping address without requiring first or last name', async () => {
    const { user } = renderCheckout({
      draftOrderOverrides: {
        shipping: {
          firstName: '',
          lastName: '',
          address: buildShippingAddress({
            addressLine1: '',
            addressLine2: '',
            adminArea1: 'GA',
            adminArea2: '',
            postalCode: '',
            countryCode: 'US',
          }),
        },
        billing: {
          firstName: '',
          lastName: '',
          address: null,
        },
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    await typeIntoNamedField(user, 'shippingAddressLine1', '456 Shipping Ln');
    await typeIntoNamedField(user, 'shippingAdminArea2', 'Jasper');
    await typeIntoNamedField(user, 'shippingPostalCode', '30143');
    await advanceCheckoutDebounce();
    await waitForOperation('UpdateCheckoutSessionDraftOrder');

    expect(getLastUpdateInput()).toMatchObject({
      shipping: {
        address: expect.objectContaining({
          addressLine1: '456 Shipping Ln',
          adminArea2: 'Jasper',
          postalCode: '30143',
          countryCode: 'US',
        }),
      },
      billing: {
        address: expect.objectContaining({
          addressLine1: '456 Shipping Ln',
          adminArea2: 'Jasper',
          postalCode: '30143',
          countryCode: 'US',
        }),
      },
    });
    expect(getLastUpdateInput()?.shipping).not.toHaveProperty('firstName');
    expect(getLastUpdateInput()?.shipping).not.toHaveProperty('lastName');
    expect(getLastUpdateInput()?.billing).not.toHaveProperty('firstName');
    expect(getLastUpdateInput()?.billing).not.toHaveProperty('lastName');
  });

  it('syncs a complete billing address without requiring first or last name', async () => {
    const { user } = renderCheckout({
      draftOrderOverrides: {
        billing: {
          firstName: '',
          lastName: '',
          address: buildShippingAddress({
            addressLine1: '',
            addressLine2: '',
            adminArea1: 'GA',
            adminArea2: '',
            postalCode: '',
            countryCode: 'US',
          }),
        },
        lineItems: [{ fulfillmentMode: DeliveryMethods.PURCHASE }],
      },
      sessionOverrides: {
        enableShipping: false,
        enableLocalPickup: false,
        enableBillingAddressCollection: true,
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    await typeIntoNamedField(user, 'billingAddressLine1', '789 Billing Rd');
    await typeIntoNamedField(user, 'billingAdminArea2', 'Atlanta');
    await typeIntoNamedField(user, 'billingPostalCode', '30301');
    await advanceCheckoutDebounce();
    await waitForOperation('UpdateCheckoutSessionDraftOrder');

    expect(getLastUpdateInput()).toMatchObject({
      billing: {
        address: expect.objectContaining({
          addressLine1: '789 Billing Rd',
          adminArea2: 'Atlanta',
          postalCode: '30301',
          countryCode: 'US',
        }),
      },
    });
    expect(getLastUpdateInput()?.billing).not.toHaveProperty('firstName');
    expect(getLastUpdateInput()?.billing).not.toHaveProperty('lastName');
  });

  it('serializes slow field-by-field edits without concurrent update mutations', async () => {
    const { user } = renderCheckout({
      apiOverrides: { updateDraftOrderDelayMs: 200 },
    });
    await waitForCheckoutReady();
    clearOperations();

    await typeIntoNamedField(user, 'shippingFirstName', 'Alpha');
    await advanceCheckoutDebounce();
    await typeIntoNamedField(user, 'shippingLastName', 'Beta');
    await advanceCheckoutDebounce();
    await waitForOperation('UpdateCheckoutSessionDraftOrder', 2);

    const updates = getOperations('UpdateCheckoutSessionDraftOrder');
    expect(updates).toHaveLength(2);
    expect(updates[1].timestamp).toBeGreaterThanOrEqual(updates[0].timestamp);
  });

  it('syncs whitespace-only notes as null', async () => {
    const { user } = renderCheckout({
      draftOrderOverrides: {
        notes: [{ authorType: 'CUSTOMER', content: 'Leave at door' }],
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    const notes = document.querySelector<HTMLTextAreaElement>(
      'textarea[name="notes"]'
    );
    expect(notes).toBeTruthy();
    await user.clear(notes as HTMLTextAreaElement);
    await user.type(notes as HTMLTextAreaElement, '   ');
    await advanceCheckoutDebounce();
    await waitForOperation('UpdateCheckoutSessionDraftOrder');

    expect(getLastUpdateInput()).toMatchObject({ notes: null });
  });

  it('syncs names-only billing without stale address fields', async () => {
    const { user } = renderCheckout({
      draftOrderOverrides: {
        billing: {
          firstName: '',
          lastName: '',
          phone: '',
          email: 'jane@example.com',
          address: null,
        },
        lineItems: [{ fulfillmentMode: DeliveryMethods.PICKUP }],
        totals: {
          subTotal: { value: 0, currencyCode: 'USD' },
          discountTotal: { value: 0, currencyCode: 'USD' },
          shippingTotal: { value: 0, currencyCode: 'USD' },
          taxTotal: { value: 0, currencyCode: 'USD' },
          feeTotal: { value: 0, currencyCode: 'USD' },
          total: { value: 0, currencyCode: 'USD' },
        },
      },
      sessionOverrides: {
        enableShipping: false,
        enableLocalPickup: true,
        enableTaxCollection: false,
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    await typeIntoNamedField(user, 'billingFirstName', 'Only');
    await typeIntoNamedField(user, 'billingLastName', 'Names');
    await advanceCheckoutDebounce();
    await waitForOperation('UpdateCheckoutSessionDraftOrder');

    expect(getLastUpdateInput()).toMatchObject({
      billing: { firstName: 'Only', lastName: 'Names', address: null },
    });
    expect(getLastUpdateInput()?.billing).not.toMatchObject({
      addressLine1: expect.anything(),
      postalCode: expect.anything(),
    });
  });

  it('copies phone-only shipping sync to billing when payment uses the shipping address', async () => {
    const { user } = renderCheckout({
      draftOrderOverrides: { shipping: { phone: '' }, billing: { phone: '' } },
    });
    await waitForCheckoutReady();
    clearOperations();

    const [phone] = await screen.findAllByPlaceholderText('(201) 555-1234');
    await user.clear(phone);
    await user.type(phone, '+12015550123');
    await advanceCheckoutDebounce();
    await waitForOperation('UpdateCheckoutSessionDraftOrder');

    expect(getLastUpdateInput()).toMatchObject({
      shipping: { phone: '+12015550123' },
      billing: { phone: '+12015550123' },
    });
  });

  it('gates invalid phone sync until the phone becomes valid', async () => {
    const { user } = renderCheckout({
      draftOrderOverrides: { shipping: { phone: '' } },
    });
    await waitForCheckoutReady();
    clearOperations();

    const [phone] = await screen.findAllByPlaceholderText('(201) 555-1234');
    await user.clear(phone);
    await user.type(phone, '12');
    await advanceCheckoutDebounce();
    expect(getOperations('UpdateCheckoutSessionDraftOrder')).toHaveLength(0);

    await user.clear(phone);
    await user.type(phone, '+12015550123');
    await advanceCheckoutDebounce();
    await waitForOperation('UpdateCheckoutSessionDraftOrder');

    expect(getOperations('UpdateCheckoutSessionDraftOrder')).toHaveLength(1);
    expect(getLastUpdateInput()).toMatchObject({
      shipping: { phone: '+12015550123' },
    });
  });

  it('resetField after a successful sync makes the typed value pristine for later refetches', async () => {
    const { user, queryClient, session } = renderCheckout({
      draftOrderOverrides: { shipping: { firstName: '' } },
    });
    await waitForCheckoutReady();
    clearOperations();

    await typeIntoNamedField(user, 'shippingFirstName', 'Pristine');
    await typeIntoNamedField(user, 'shippingLastName', 'Saved');
    await advanceCheckoutDebounce();
    await waitForOperation('UpdateCheckoutSessionDraftOrder');

    const savedOrder = getCurrentDraftOrder();
    expect(savedOrder?.shipping?.firstName).toBe('Pristine');

    queryClient.setQueryData(checkoutQueryKeys.draftOrder(session.id), {
      checkoutSession: {
        draftOrder: {
          ...savedOrder,
          shipping: {
            ...savedOrder?.shipping,
            firstName: 'Server Refetch',
          },
        },
      },
    });
    await flushPromises();

    await waitFor(() => {
      expect(getNamedInput('shippingFirstName')).toHaveValue('Server Refetch');
    });
  });
});
