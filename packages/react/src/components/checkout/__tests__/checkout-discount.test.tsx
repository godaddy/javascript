import { enUs } from '@godaddy/localizations';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';
import {
  buildBillingAddress,
  buildShippingRates,
  clearOperations,
  flushPromises,
  getOperations,
  renderCheckout,
  setApiError,
  setShippingMethods,
  waitForCheckoutReady,
  waitForOperation,
} from './checkout-test-env';

async function applyCoupon(
  user: ReturnType<typeof import('@testing-library/user-event').default.setup>,
  code: string
) {
  let input: HTMLInputElement | undefined;
  let button: HTMLButtonElement | undefined;

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
    button = buttons[index];
  });

  await user.clear(input as HTMLInputElement);
  await user.type(input as HTMLInputElement, code);
  await waitFor(() => {
    expect((button as HTMLButtonElement).disabled).toBe(false);
  });
  await user.click(button as HTMLButtonElement);
}

describe('Checkout discounts', () => {
  it('renders a line-item discount code as a removable tag', async () => {
    const { user } = renderCheckout({
      sessionOverrides: {
        enableShipping: false,
        enableLocalPickup: false,
        enableTaxCollection: false,
      },
      draftOrderOverrides: {
        lineItems: [
          {
            id: 'line-item-1',
            discounts: [{ code: 'lineitem10' }],
          },
        ],
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    const lineItemTags = await screen.findAllByRole('button', {
      name: /remove lineitem10/i,
    });
    expect(lineItemTags.length).toBeGreaterThan(0);

    await user.click(lineItemTags.at(-1) as HTMLButtonElement);
    await waitForOperation('ApplyCheckoutSessionDiscount');

    expect(getOperations('ApplyCheckoutSessionDiscount')[0].input).toEqual({
      discountCodes: [],
    });
  });

  it('renders a shipping-line discount code as a removable tag', async () => {
    const { user } = renderCheckout({
      sessionOverrides: {
        enableShipping: false,
        enableLocalPickup: false,
        enableTaxCollection: false,
      },
      draftOrderOverrides: {
        shippingLines: [
          {
            requestedService: 'free-shipping',
            requestedProvider: 'unknown',
            name: 'Free Shipping',
            amount: { value: 0, currencyCode: 'USD' },
            discounts: [{ code: 'shipfree' }],
          },
        ],
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    const shippingTags = await screen.findAllByRole('button', {
      name: /remove shipfree/i,
    });
    expect(shippingTags.length).toBeGreaterThan(0);

    await user.click(shippingTags.at(-1) as HTMLButtonElement);
    await waitForOperation('ApplyCheckoutSessionDiscount');

    expect(getOperations('ApplyCheckoutSessionDiscount')[0].input).toEqual({
      discountCodes: [],
    });
  });

  it('applies and removes a coupon, recalculating taxes when enabled', async () => {
    const { user } = renderCheckout();
    await waitForCheckoutReady();
    clearOperations();

    await applyCoupon(user, 'onedollar');
    await waitForOperation('ApplyCheckoutSessionDiscount');
    await waitForOperation('CalculateCheckoutSessionTaxes');

    expect(getOperations('ApplyCheckoutSessionDiscount')[0].input).toEqual({
      discountCodes: ['onedollar'],
    });
    expect(screen.getAllByText('onedollar')).toHaveLength(2);

    clearOperations();
    await user.click(
      screen
        .getAllByRole('button', { name: /remove onedollar/i })
        .at(-1) as HTMLButtonElement
    );
    await waitForOperation('ApplyCheckoutSessionDiscount');
    expect(getOperations('ApplyCheckoutSessionDiscount')[0].input).toEqual({
      discountCodes: [],
    });
  });

  it('does not recalculate taxes on coupon apply when tax is disabled', async () => {
    const { user } = renderCheckout({
      sessionOverrides: { enableTaxCollection: false },
    });
    await waitForCheckoutReady();
    clearOperations();

    await applyCoupon(user, 'onedollar');
    await waitForOperation('ApplyCheckoutSessionDiscount');

    expect(getOperations('CalculateCheckoutSessionTaxes')).toHaveLength(0);
  });

  it('refetches shipping methods when a coupon is applied', async () => {
    const { user } = renderCheckout({
      sessionOverrides: { enableTaxCollection: false },
    });
    await waitForCheckoutReady();
    clearOperations();

    await applyCoupon(user, 'onedollar');
    await waitForOperation('DraftOrderShippingRates');

    expect(getOperations('DraftOrderShippingRates')).toHaveLength(1);
  });

  it('calculates taxes once after a discount changes the selected shipping cost', async () => {
    const paidShipping = buildShippingRates([
      {
        serviceCode: 'standard',
        carrierCode: 'carrier',
        displayName: 'Standard',
        cost: { value: 1000, currencyCode: 'USD' },
      },
    ]);
    const { user } = renderCheckout({
      apiOverrides: { shippingMethods: paidShipping },
      draftOrderOverrides: {
        shippingLines: [
          {
            requestedService: 'standard',
            requestedProvider: 'carrier',
            name: 'Standard',
            amount: { value: 1000, currencyCode: 'USD' },
          },
        ],
        totals: {
          shippingTotal: { value: 1000, currencyCode: 'USD' },
          total: { value: 3500, currencyCode: 'USD' },
        },
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    setShippingMethods(
      buildShippingRates([
        {
          serviceCode: 'standard',
          carrierCode: 'carrier',
          displayName: 'Standard',
          cost: { value: 0, currencyCode: 'USD' },
        },
      ])
    );

    await applyCoupon(user, 'onedollar');

    await waitFor(() => {
      expect(getOperations('ApplyCheckoutSessionShippingMethod')).toHaveLength(
        1
      );
      expect(getOperations('CalculateCheckoutSessionTaxes')).toHaveLength(1);
    });

    await flushPromises();

    const operations = getOperations();
    const shippingIndex = operations.findIndex(
      operation => operation.op === 'ApplyCheckoutSessionShippingMethod'
    );
    const taxIndex = operations.findIndex(
      operation => operation.op === 'CalculateCheckoutSessionTaxes'
    );
    const lastDiscountIndex = operations
      .map(operation => operation.op)
      .lastIndexOf('ApplyCheckoutSessionDiscount');

    expect(getOperations('DraftOrderShippingRates')).toHaveLength(1);
    expect(getOperations('ApplyCheckoutSessionDiscount')).toHaveLength(2);
    expect(getOperations('CalculateCheckoutSessionTaxes')).toHaveLength(1);
    expect(taxIndex).toBeGreaterThan(shippingIndex);
    expect(taxIndex).toBeGreaterThan(lastDiscountIndex);
  });

  it('clears applied shipping once when the discount rate refresh returns no methods', async () => {
    const paidShipping = buildShippingRates([
      {
        serviceCode: 'standard',
        carrierCode: 'carrier',
        displayName: 'Standard',
        cost: { value: 1000, currencyCode: 'USD' },
      },
    ]);
    const { user } = renderCheckout({
      apiOverrides: { shippingMethods: paidShipping },
      draftOrderOverrides: {
        shippingLines: [
          {
            requestedService: 'standard',
            requestedProvider: 'carrier',
            name: 'Standard',
            amount: { value: 1000, currencyCode: 'USD' },
          },
        ],
      },
    });
    await waitForCheckoutReady();
    clearOperations();
    setShippingMethods([]);

    await applyCoupon(user, 'onedollar');
    await waitFor(() => {
      expect(getOperations('CalculateCheckoutSessionTaxes')).toHaveLength(1);
    });
    await flushPromises();
    await flushPromises();

    expect(getOperations('DraftOrderShippingRates')).toHaveLength(1);
    expect(getOperations('ApplyCheckoutSessionShippingMethod')).toHaveLength(1);
    expect(
      getOperations('ApplyCheckoutSessionShippingMethod')[0].input
    ).toEqual([]);
    expect(getOperations('ApplyCheckoutSessionDiscount')).toHaveLength(2);
    expect(getOperations('CalculateCheckoutSessionTaxes')).toHaveLength(1);
    expect(screen.queryByText('Standard')).not.toBeInTheDocument();
    expect(document.body).toHaveTextContent(/no shipping methods found/i);
  });

  it('applies a newly available free method before calculating taxes', async () => {
    const paidShipping = buildShippingRates([
      {
        serviceCode: 'standard',
        carrierCode: 'carrier',
        displayName: 'Standard',
        cost: { value: 1000, currencyCode: 'USD' },
      },
    ]);
    const { user } = renderCheckout({
      apiOverrides: { shippingMethods: paidShipping },
      draftOrderOverrides: {
        shippingLines: [
          {
            requestedService: 'standard',
            requestedProvider: 'carrier',
            name: 'Standard',
            amount: { value: 1000, currencyCode: 'USD' },
          },
        ],
        totals: {
          shippingTotal: { value: 1000, currencyCode: 'USD' },
          total: { value: 3500, currencyCode: 'USD' },
        },
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    setShippingMethods([
      ...paidShipping,
      ...buildShippingRates([
        {
          serviceCode: 'free',
          carrierCode: 'carrier',
          displayName: 'Free',
          cost: { value: 0, currencyCode: 'USD' },
        },
      ]),
    ]);

    await applyCoupon(user, 'onedollar');

    await waitFor(() => {
      expect(getOperations('ApplyCheckoutSessionShippingMethod')).toHaveLength(
        1
      );
      expect(getOperations('CalculateCheckoutSessionTaxes')).toHaveLength(1);
    });

    expect(
      getOperations('ApplyCheckoutSessionShippingMethod')[0].input
    ).toContainEqual(
      expect.objectContaining({
        requestedService: 'free',
        subTotal: { value: 0, currencyCode: 'USD' },
      })
    );
    expect(getOperations('CalculateCheckoutSessionTaxes')).toHaveLength(1);
  });

  it('calculates taxes once without applying shipping when refreshed shipping is unchanged', async () => {
    const paidShipping = buildShippingRates([
      {
        serviceCode: 'standard',
        carrierCode: 'carrier',
        displayName: 'Standard',
        cost: { value: 1000, currencyCode: 'USD' },
      },
    ]);
    const { user } = renderCheckout({
      apiOverrides: { shippingMethods: paidShipping },
      draftOrderOverrides: {
        shippingLines: [
          {
            requestedService: 'standard',
            requestedProvider: 'carrier',
            name: 'Standard',
            amount: { value: 1000, currencyCode: 'USD' },
          },
        ],
        totals: {
          shippingTotal: { value: 1000, currencyCode: 'USD' },
          total: { value: 3500, currencyCode: 'USD' },
        },
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    await applyCoupon(user, 'onedollar');

    await waitFor(() => {
      expect(getOperations('DraftOrderShippingRates')).toHaveLength(1);
      expect(getOperations('CalculateCheckoutSessionTaxes')).toHaveLength(1);
    });

    await flushPromises();

    expect(getOperations('ApplyCheckoutSessionShippingMethod')).toHaveLength(0);
    expect(getOperations('ApplyCheckoutSessionDiscount')).toHaveLength(1);
    expect(getOperations('CalculateCheckoutSessionTaxes')).toHaveLength(1);
  });

  it('reapplies a shipping discount before taxes when the shipping method changes', async () => {
    const shippingMethods = buildShippingRates([
      {
        serviceCode: 'flat-rate',
        carrierCode: 'carrier',
        displayName: 'Flat Rate',
        cost: { value: 10, currencyCode: 'USD' },
      },
      {
        serviceCode: 'premium-rate',
        carrierCode: 'carrier',
        displayName: 'Premium Rate',
        cost: { value: 100, currencyCode: 'USD' },
      },
    ]);
    const { user } = renderCheckout({
      apiOverrides: { shippingMethods },
      draftOrderOverrides: {
        shippingLines: [
          {
            requestedService: 'flat-rate',
            requestedProvider: 'carrier',
            name: 'Flat Rate',
            amount: { value: 10, currencyCode: 'USD' },
          },
        ],
        totals: {
          shippingTotal: { value: 10, currencyCode: 'USD' },
          total: { value: 2510, currencyCode: 'USD' },
        },
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    await applyCoupon(user, 'freeship');

    await waitFor(() => {
      expect(getOperations('DraftOrderShippingRates')).toHaveLength(1);
      expect(getOperations('CalculateCheckoutSessionTaxes')).toHaveLength(1);
    });
    expect(getOperations('ApplyCheckoutSessionShippingMethod')).toHaveLength(0);
    expect(
      screen.getAllByRole('button', { name: /remove freeship/i }).length
    ).toBeGreaterThan(0);

    await flushPromises();
    clearOperations();
    await user.click(screen.getByRole('radio', { name: /premium rate/i }));

    await waitFor(() => {
      expect(getOperations('ApplyCheckoutSessionShippingMethod')).toHaveLength(
        1
      );
      expect(getOperations('ApplyCheckoutSessionDiscount')).toHaveLength(1);
      expect(getOperations('CalculateCheckoutSessionTaxes')).toHaveLength(1);
    });

    const operationNames = getOperations().map(operation => operation.op);
    expect(
      operationNames.indexOf('ApplyCheckoutSessionDiscount')
    ).toBeGreaterThan(
      operationNames.indexOf('ApplyCheckoutSessionShippingMethod')
    );
    expect(
      operationNames.indexOf('CalculateCheckoutSessionTaxes')
    ).toBeGreaterThan(operationNames.indexOf('ApplyCheckoutSessionDiscount'));
    expect(getOperations('ApplyCheckoutSessionDiscount')[0].input).toEqual({
      discountCodes: ['freeship'],
    });

    await flushPromises();
    clearOperations();
    await user.click(
      screen
        .getAllByRole('button', { name: /remove freeship/i })
        .at(-1) as HTMLButtonElement
    );

    await waitFor(() => {
      expect(getOperations('DraftOrderShippingRates')).toHaveLength(1);
      expect(getOperations('CalculateCheckoutSessionTaxes')).toHaveLength(1);
    });
    expect(getOperations('ApplyCheckoutSessionShippingMethod')).toHaveLength(0);
    expect(getOperations('ApplyCheckoutSessionDiscount')[0].input).toEqual({
      discountCodes: [],
    });
  });

  it('does not fetch shipping or taxes when a coupon is applied without a shipping address', async () => {
    const { user } = renderCheckout({
      draftOrderOverrides: {
        shipping: null,
        billing: null,
        shippingLines: null,
        lineItems: [{ fulfillmentMode: 'PURCHASE' }],
      },
      sessionOverrides: {
        enableShipping: true,
        enableLocalPickup: false,
        enableTaxCollection: true,
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    await applyCoupon(user, 'freeship');
    await waitForOperation('ApplyCheckoutSessionDiscount');
    await waitForOperation('DraftOrder');

    expect(getOperations('DraftOrderShippingRates')).toHaveLength(0);
    expect(getOperations('ApplyCheckoutSessionShippingMethod')).toHaveLength(0);
    expect(getOperations('CalculateCheckoutSessionTaxes')).toHaveLength(0);
  });

  it('refetches the draft order when taxes cannot be recalculated without a billing address', async () => {
    const { user } = renderCheckout({
      draftOrderOverrides: {
        billing: { address: null },
        lineItems: [{ fulfillmentMode: 'PURCHASE' }],
      },
      sessionOverrides: {
        enableShipping: false,
        enableLocalPickup: false,
        enableTaxCollection: true,
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    await applyCoupon(user, 'onedollar');
    await waitForOperation('ApplyCheckoutSessionDiscount');
    await waitForOperation('DraftOrder');

    expect(getOperations('CalculateCheckoutSessionTaxes')).toHaveLength(0);
    expect(getOperations('DraftOrder')).toHaveLength(1);
  });

  it.each(['PURCHASE', 'DIGITAL'] as const)(
    'recalculates taxes using the billing address when a coupon is applied to a %s order',
    async fulfillmentMode => {
      const billingAddress = buildBillingAddress({
        addressLine1: '123 Billing St',
        adminArea2: 'Tempe',
        adminArea1: 'AZ',
        postalCode: '85281',
        countryCode: 'US',
      });
      const { user } = renderCheckout({
        draftOrderOverrides: {
          billing: {
            firstName: 'Bill',
            lastName: 'Buyer',
            address: billingAddress,
          },
          lineItems: [{ fulfillmentMode }],
        },
        sessionOverrides: {
          enableShipping: false,
          enableLocalPickup: false,
          enableTaxCollection: true,
        },
      });
      await waitForCheckoutReady();
      clearOperations();

      await applyCoupon(user, 'onedollar');
      await waitForOperation('CalculateCheckoutSessionTaxes');

      expect(getOperations('CalculateCheckoutSessionTaxes')).toContainEqual(
        expect.objectContaining({
          input: { destination: billingAddress },
        })
      );
    }
  );

  it('shows duplicate coupon validation without issuing a duplicate mutation', async () => {
    const { user } = renderCheckout({
      draftOrderOverrides: { discounts: [{ code: 'onedollar' }] },
    });
    await waitForCheckoutReady();
    clearOperations();

    await applyCoupon(user, 'onedollar');

    await waitFor(() => {
      expect(document.body).toHaveTextContent(/already been applied/i);
    });
    expect(getOperations('ApplyCheckoutSessionDiscount')).toHaveLength(0);
  });

  it('hides coupon UI when promotions are disabled', async () => {
    renderCheckout({ sessionOverrides: { enablePromotionCodes: false } });
    await waitForCheckoutReady();
    expect(
      screen.queryByPlaceholderText(/coupon code/i)
    ).not.toBeInTheDocument();
  });

  it('renders the API error code inline when discount apply fails', async () => {
    const { user } = renderCheckout({
      sessionOverrides: {
        enableShipping: false,
        enableLocalPickup: false,
        enableTaxCollection: false,
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    setApiError(
      'applyDiscount',
      new GraphQLErrorWithCodes([
        { message: 'Bad code', code: 'DISCOUNT_NOT_FOUND' },
      ])
    );

    await applyCoupon(user, 'badcode');
    await waitForOperation('ApplyCheckoutSessionDiscount');

    await waitFor(() => {
      expect(document.body).toHaveTextContent(/DISCOUNT_NOT_FOUND/i);
    });
    await flushPromises();
  });

  it('renders the localized generic message when discount apply fails without GraphQL codes', async () => {
    const { user } = renderCheckout({
      sessionOverrides: {
        enableShipping: false,
        enableLocalPickup: false,
        enableTaxCollection: false,
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    setApiError('applyDiscount', new Error('network unavailable'));

    await applyCoupon(user, 'badcode');
    await waitForOperation('ApplyCheckoutSessionDiscount');

    await waitFor(() => {
      expect(document.body).toHaveTextContent(enUs.discounts.failedToApply);
    });
    await flushPromises();
  });

  it('keeps empty coupon apply disabled and does not call the API', async () => {
    // TODO(T-1401): Product copy requests click-to-validate empty input, but
    // current UI disables Apply while the trimmed discount code is empty.
    renderCheckout({
      sessionOverrides: {
        enableShipping: false,
        enableLocalPickup: false,
        enableTaxCollection: false,
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    const button = screen.getAllByRole('button', { name: /apply/i })[0];
    expect(button).toBeDisabled();
    fireEvent.click(button);

    expect(getOperations('ApplyCheckoutSessionDiscount')).toHaveLength(0);
    expect(document.body).not.toHaveTextContent(
      enUs.discounts.enterCodeValidation
    );
  });

  it('does not submit an empty coupon with the Enter key', async () => {
    const { user } = renderCheckout({
      sessionOverrides: {
        enableShipping: false,
        enableLocalPickup: false,
        enableTaxCollection: false,
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    const input = screen.getAllByPlaceholderText(/coupon code/i)[0];
    await user.click(input);
    await user.keyboard('{Enter}');
    await flushPromises();

    expect(getOperations('ApplyCheckoutSessionDiscount')).toHaveLength(0);
    expect(document.body).not.toHaveTextContent(
      enUs.discounts.enterCodeValidation
    );
  });

  it('recalculates taxes when a coupon is removed', async () => {
    const { user } = renderCheckout({
      draftOrderOverrides: { discounts: [{ code: 'onedollar' }] },
    });
    await waitForCheckoutReady();
    clearOperations();

    await user.click(
      screen
        .getAllByRole('button', { name: /remove onedollar/i })
        .at(-1) as HTMLButtonElement
    );
    await waitForOperation('ApplyCheckoutSessionDiscount');
    await waitForOperation('CalculateCheckoutSessionTaxes');

    expect(
      getOperations('CalculateCheckoutSessionTaxes').length
    ).toBeGreaterThan(0);
  });
});
