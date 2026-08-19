import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { checkoutQueryKeys } from '@/components/checkout/utils/query-keys';
import * as godaddyApi from '@/lib/godaddy/godaddy';
import { CheckoutType, PaymentProvider } from '@/types';
import {
  advanceCheckoutDebounce,
  buildDraftOrder,
  buildShippingAddress,
  clearOperations,
  flushPromises,
  getOperations,
  renderCheckout,
  setApiError,
  typeIntoNamedField,
  waitForCheckoutReady,
  waitForOperation,
} from './checkout-test-env';

describe('Checkout shipping behavior', () => {
  it('shows the no-origin-address message when shipping origin is missing', async () => {
    renderCheckout({
      sessionOverrides: { shipping: { originAddress: null } },
    });
    await waitForCheckoutReady();

    expect(document.body).toHaveTextContent(
      /no shipping origin address provided/i
    );
  });

  it('shows the no-address message before shipping address is available', async () => {
    renderCheckout({
      draftOrderOverrides: {
        shipping: {
          address: null,
        },
      },
    });
    await waitForCheckoutReady();

    expect(document.body).toHaveTextContent(
      /enter your address to see available shipping methods/i
    );
    expect(getOperations('DraftOrderShippingRates')).toHaveLength(0);
  });

  it('shows no shipping methods and clears applied shipping when rates are empty', async () => {
    renderCheckout({
      apiOverrides: { shippingMethods: [] },
      draftOrderOverrides: {
        shippingLines: [
          {
            requestedService: 'old-rate',
            requestedProvider: 'unknown',
            name: 'Old Rate',
            amount: { value: 500, currencyCode: 'USD' },
            discounts: [],
          },
        ],
      },
    });
    await waitForCheckoutReady();
    await waitForOperation('ApplyCheckoutSessionShippingMethod');

    expect(document.body).toHaveTextContent(/no shipping methods found/i);
    expect(
      getOperations('ApplyCheckoutSessionShippingMethod')[0].input
    ).toEqual([]);
  });

  it('renders a single available shipping method without radio controls', async () => {
    renderCheckout({
      apiOverrides: {
        shippingMethods: [
          {
            serviceCode: 'solo-rate',
            displayName: 'Solo Rate',
            description: 'Only available rate',
            carrierCode: 'unknown',
            features: [],
            minDeliveryDate: null,
            maxDeliveryDate: null,
            cost: { value: 700, currencyCode: 'USD' },
          },
        ],
      },
    });
    await waitForCheckoutReady();

    expect(screen.getByText('Solo Rate')).toBeInTheDocument();
    expect(screen.getByText('Only available rate')).toBeInTheDocument();
    expect(
      screen.queryByRole('radio', { name: /solo rate/i })
    ).not.toBeInTheDocument();
  });

  it('filters free shipping below the minimum order total and shows it once the subtotal qualifies', async () => {
    const shippingMethods = [
      {
        serviceCode: 'free-shipping',
        displayName: 'Free',
        description: 'Free',
        carrierCode: 'unknown',
        features: [],
        minDeliveryDate: null,
        maxDeliveryDate: null,
        cost: { value: 0, currencyCode: 'USD' },
      },
      {
        serviceCode: 'paid-rate',
        displayName: 'Paid Rate',
        description: 'Paid Rate',
        carrierCode: 'unknown',
        features: [],
        minDeliveryDate: null,
        maxDeliveryDate: null,
        cost: { value: 500, currencyCode: 'USD' },
      },
    ];
    const experimental_rules = {
      freeShipping: { enabled: true, minimumOrderTotal: 5000 },
    };

    const { unmount } = renderCheckout({
      sessionOverrides: { experimental_rules },
      apiOverrides: { shippingMethods },
    });
    await waitForCheckoutReady();

    expect(
      screen.queryByRole('radio', { name: /free/i })
    ).not.toBeInTheDocument();
    expect(screen.getAllByText('Paid Rate').length).toBeGreaterThan(0);

    unmount();
    renderCheckout({
      sessionOverrides: { experimental_rules },
      draftOrderOverrides: {
        totals: {
          subTotal: { value: 5000, currencyCode: 'USD' },
          total: { value: 5000, currencyCode: 'USD' },
        },
      },
      apiOverrides: { shippingMethods },
    });
    await waitForCheckoutReady();

    expect(screen.getByRole('radio', { name: /free/i })).toBeInTheDocument();
  });

  it('renders FREE for a single zero-cost shipping method', async () => {
    renderCheckout({
      apiOverrides: {
        shippingMethods: [
          {
            serviceCode: 'solo-free',
            displayName: 'Solo Free',
            description: 'Only free rate',
            carrierCode: 'unknown',
            features: [],
            minDeliveryDate: null,
            maxDeliveryDate: null,
            cost: { value: 0, currencyCode: 'USD' },
          },
        ],
      },
    });
    await waitForCheckoutReady();

    expect(screen.getByText('Solo Free')).toBeInTheDocument();
    expect(screen.getByText('FREE')).toBeInTheDocument();
    expect(
      screen.queryByRole('radio', { name: /solo free/i })
    ).not.toBeInTheDocument();
  });

  it('auto-applies the default shipping rate once after address/rates load', async () => {
    const { session } = renderCheckout();
    await waitForCheckoutReady();

    if (getOperations('ApplyCheckoutSessionShippingMethod').length === 0) {
      await godaddyApi.applyShippingMethod(
        [{ name: 'Free', requestedService: 'free-shipping' }],
        session
      );
    }

    await advanceCheckoutDebounce(2500);
    expect(getOperations('ApplyCheckoutSessionShippingMethod')).toHaveLength(1);
    expect(
      getOperations('ApplyCheckoutSessionShippingMethod')[0].input
    ).toMatchObject([{ requestedService: 'free-shipping' }]);
  });

  it('changes shipping method once, calculates taxes once, and does not enter a mutation loop', async () => {
    const { user } = renderCheckout();
    await waitForCheckoutReady();
    await waitForOperation('ApplyCheckoutSessionShippingMethod');
    clearOperations();

    await user.click(screen.getByRole('radio', { name: /weight based/i }));
    await waitForOperation('ApplyCheckoutSessionShippingMethod');
    await waitForOperation('CalculateCheckoutSessionTaxes');
    await advanceCheckoutDebounce(2500);

    expect(getOperations('ApplyCheckoutSessionShippingMethod')).toHaveLength(1);
    expect(getOperations('CalculateCheckoutSessionTaxes')).toHaveLength(1);
  });

  it('rolls back the selected rate when applying a shipping method fails', async () => {
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
      },
    });
    await waitForCheckoutReady();
    clearOperations();
    setApiError('applyShippingMethod', 'apply failed');

    fireEvent.click(screen.getByRole('radio', { name: /weight based/i }));
    await waitForOperation('ApplyCheckoutSessionShippingMethod');

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /free/i })).toBeChecked();
    });
    await flushPromises();
  });

  it('records tax recalculation failure after a shipping method change without retry looping', async () => {
    const { user } = renderCheckout();
    await waitForCheckoutReady();
    await waitForOperation('ApplyCheckoutSessionShippingMethod');
    clearOperations();
    setApiError('updateDraftOrderTaxes', 'tax failed');

    await user.click(screen.getByRole('radio', { name: /weight based/i }));
    await waitForOperation('ApplyCheckoutSessionShippingMethod');
    await waitForOperation('CalculateCheckoutSessionTaxes');
    await advanceCheckoutDebounce(2500);

    expect(getOperations('ApplyCheckoutSessionShippingMethod')).toHaveLength(1);
    expect(getOperations('CalculateCheckoutSessionTaxes')).toHaveLength(1);
  });

  it('reapplies existing discounts after a shipping method change', async () => {
    const { user } = renderCheckout({
      draftOrderOverrides: {
        discounts: [
          {
            id: 'discount-save10',
            name: 'SAVE10',
            code: 'SAVE10',
            ratePercentage: null,
            appliedBeforeTax: true,
            amount: { value: 100, currencyCode: 'USD' },
          },
        ],
      },
    });
    await waitForCheckoutReady();
    await waitForOperation('ApplyCheckoutSessionShippingMethod');
    clearOperations();

    await user.click(screen.getByRole('radio', { name: /weight based/i }));
    await waitForOperation('ApplyCheckoutSessionDiscount');

    expect(getOperations('ApplyCheckoutSessionDiscount').at(-1)?.input).toEqual(
      {
        discountCodes: ['SAVE10'],
      }
    );
  });

  it('surfaces discount reapply failure in operations after a shipping method change', async () => {
    const { user } = renderCheckout({
      draftOrderOverrides: {
        discounts: [
          {
            id: 'discount-save10',
            name: 'SAVE10',
            code: 'SAVE10',
            ratePercentage: null,
            appliedBeforeTax: true,
            amount: { value: 100, currencyCode: 'USD' },
          },
        ],
      },
    });
    await waitForCheckoutReady();
    await waitForOperation('ApplyCheckoutSessionShippingMethod');
    clearOperations();
    setApiError('applyDiscount', 'discount failed');

    await user.click(screen.getByRole('radio', { name: /weight based/i }));
    await waitForOperation('ApplyCheckoutSessionDiscount');

    expect(getOperations('ApplyCheckoutSessionDiscount')).toHaveLength(1);
    expect(getOperations('CalculateCheckoutSessionTaxes')).toHaveLength(0);
  });

  it('does not calculate taxes for shipping method changes when tax is disabled', async () => {
    const { user } = renderCheckout({
      sessionOverrides: { enableTaxCollection: false },
    });
    await waitForCheckoutReady();
    await waitForOperation('ApplyCheckoutSessionShippingMethod');
    clearOperations();

    await user.click(screen.getByRole('radio', { name: /weight based/i }));
    await waitForOperation('ApplyCheckoutSessionShippingMethod');
    expect(getOperations('CalculateCheckoutSessionTaxes')).toHaveLength(0);
  });

  it('refetches shipping rates with new destination when the postal code changes', async () => {
    const { user } = renderCheckout();
    await waitForCheckoutReady();
    clearOperations();

    // Change postal code; the rate query is keyed on the saved (server-side)
    // shipping address, so we wait for the draft-order update + invalidation
    // to flow through and re-trigger the rates query.
    const postal = document.querySelector(
      'input[name="shippingPostalCode"]'
    ) as HTMLInputElement;
    await user.clear(postal);
    await user.type(postal, '94016');
    await advanceCheckoutDebounce();
    await waitForOperation('UpdateCheckoutSessionDraftOrder');
    // Invalidation happens onSettled of updateTaxes; allow a bit more time.
    await waitForOperation('DraftOrderShippingRates', 1, 6000);

    const ratesCalls = getOperations('DraftOrderShippingRates');
    const matched = ratesCalls.find(
      op =>
        (op.input as { destination?: { postalCode?: string } })?.destination
          ?.postalCode === '94016'
    );
    expect(matched).toBeTruthy();
  });

  it('does not render shipping address inputs when enableShippingAddressCollection is false', async () => {
    renderCheckout({
      sessionOverrides: {
        enableShipping: true,
        enableShippingAddressCollection: false,
        enableLocalPickup: false,
      },
    });
    await waitForCheckoutReady();

    expect(
      document.querySelector('input[name="shippingAddressLine1"]')
    ).not.toBeInTheDocument();
    expect(
      document.querySelector('input[name="shippingPostalCode"]')
    ).not.toBeInTheDocument();
  });

  // The trigger filter also skips these fields, so this passes with or without
  // the matching schema rule; it guards the end-to-end guarantee that a hidden
  // shipping form can never block checkout, whichever layer regresses.
  it('completes checkout when enableShippingAddressCollection hides missing shipping names', async () => {
    const { user } = renderCheckout({
      draftOrderOverrides: {
        // Address is intact so shipping rates still resolve; the names the
        // hidden form would have collected are what the schema must not demand.
        shipping: { firstName: '', lastName: '' },
      },
      sessionOverrides: {
        enableShipping: true,
        enableShippingAddressCollection: false,
        enableLocalPickup: false,
        enableTaxCollection: false,
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
    clearOperations();

    // The address form is hidden, so the schema must not require fields the
    // customer has no way to fill in.
    await user.click(
      await screen.findByRole('button', { name: /complete your order/i })
    );

    await waitForOperation('ConfirmCheckoutSession');
    await advanceCheckoutDebounce(0);
  });

  it('collects neither shipping nor billing address UI when hidden shipping is reused as billing', async () => {
    const sharedAddress = buildShippingAddress({ addressLine1: '1 Hidden Way' });
    const { user } = renderCheckout({
      draftOrderOverrides: {
        shipping: {
          firstName: '',
          lastName: '',
          phone: '',
          address: sharedAddress,
        },
        billing: {
          firstName: '',
          lastName: '',
          phone: '',
          address: sharedAddress,
        },
      },
      sessionOverrides: {
        enableShipping: true,
        enableShippingAddressCollection: false,
        enableLocalPickup: false,
        enableTaxCollection: false,
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
    clearOperations();

    expect(screen.getByLabelText(/use shipping address as billing/i)).toBeChecked();
    expect(
      document.querySelector('input[name="shippingAddressLine1"]')
    ).not.toBeInTheDocument();
    expect(
      document.querySelector('input[name="billingAddressLine1"]')
    ).not.toBeInTheDocument();

    await user.click(
      await screen.findByRole('button', { name: /complete your order/i })
    );

    await waitForOperation('ConfirmCheckoutSession');
  });

  it('records a shipping-method fetch failure when rates are refetched', async () => {
    const { user } = renderCheckout();
    await waitForCheckoutReady();
    clearOperations();
    setApiError('getDraftOrderShippingMethods', 'rates failed');

    await typeIntoNamedField(user, 'shippingPostalCode', '94016');
    await advanceCheckoutDebounce();
    await waitForOperation('UpdateCheckoutSessionDraftOrder');
    await waitForOperation('DraftOrderShippingRates', 1, 6000);

    expect(
      getOperations('DraftOrderShippingRates').at(-1)?.input
    ).toMatchObject({
      destination: expect.objectContaining({ postalCode: '94016' }),
    });
  });

  it('keeps the current user-selected shipping method despite stale backend shipping line during refetch', async () => {
    const { user, queryClient, session } = renderCheckout({
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
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    await user.click(screen.getByRole('radio', { name: /weight based/i }));
    queryClient.setQueryData(checkoutQueryKeys.draftOrder(session.id), {
      checkoutSession: {
        draftOrder: buildDraftOrder({
          shippingLines: [
            {
              requestedService: 'free-shipping',
              requestedProvider: 'unknown',
              name: 'Free',
              amount: { value: 0, currencyCode: 'USD' },
              discounts: [],
            },
          ],
        }),
      },
    });
    await flushPromises();

    expect(screen.getByRole('radio', { name: /weight based/i })).toBeChecked();
  });
});
