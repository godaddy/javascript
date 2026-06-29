import { act, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { checkoutMutationKeys } from '@/components/checkout/utils/query-keys';
import {
  buildLineItem,
  renderCheckout,
  setFeeTotal,
  waitForCheckoutReady,
  waitForOperation,
} from './checkout-test-env';

function totals(overrides = {}) {
  return {
    subTotal: { value: 5000, currencyCode: 'USD' },
    discountTotal: { value: 500, currencyCode: 'USD' },
    shippingTotal: { value: 700, currencyCode: 'USD' },
    taxTotal: { value: 300, currencyCode: 'USD' },
    feeTotal: { value: 200, currencyCode: 'USD' },
    total: { value: 5700, currencyCode: 'USD' },
    ...overrides,
  };
}

describe('Checkout totals and order summary UI', () => {
  it('renders subtotal count, discount, shipping, taxes, fees, line item savings, and total due', async () => {
    renderCheckout({
      sessionOverrides: { enableTips: true },
      draftOrderOverrides: {
        totals: totals(),
        discounts: [
          {
            id: 'discount-save',
            name: 'SAVE',
            code: 'SAVE',
            ratePercentage: null,
            appliedBeforeTax: true,
            amount: { value: 500, currencyCode: 'USD' },
          },
        ],
        lineItems: [
          buildLineItem({
            quantity: 2,
            totals: {
              subTotal: { value: 5000, currencyCode: 'USD' },
              discountTotal: { value: 300, currencyCode: 'USD' },
              feeTotal: { value: 0, currencyCode: 'USD' },
              taxTotal: { value: 0, currencyCode: 'USD' },
            },
            discounts: [
              {
                code: 'LINE',
                name: 'Line discount',
                ratePercentage: null,
                amount: { value: 300, currencyCode: 'USD' },
              },
            ],
          }),
        ],
      },
    });
    await waitForCheckoutReady();

    expect(document.body).toHaveTextContent(/2 items/i);
    expect(document.body).toHaveTextContent(/discount/i);
    expect(document.body).toHaveTextContent(/shipping/i);
    expect(document.body).toHaveTextContent(/estimated taxes/i);
    expect(document.body).toHaveTextContent(/fees/i);
    expect(document.body).toHaveTextContent(/total due/i);
  });

  it('renders loading skeleton rows for in-flight discount, shipping, tax, and fee mutations', async () => {
    const { queryClient, session } = renderCheckout({
      sessionOverrides: {
        enableShipping: true,
        enableLocalPickup: false,
        enableTaxCollection: true,
      },
      draftOrderOverrides: {
        totals: totals({
          discountTotal: { value: 500, currencyCode: 'USD' },
          shippingTotal: { value: 700, currencyCode: 'USD' },
          taxTotal: { value: 300, currencyCode: 'USD' },
          feeTotal: { value: 200, currencyCode: 'USD' },
        }),
      },
    });
    await waitForCheckoutReady();

    const mutationKeys = [
      checkoutMutationKeys.applyDiscount(session.id),
      checkoutMutationKeys.applyShippingMethod(session.id),
      checkoutMutationKeys.updateDraftOrderTaxes(session.id),
      checkoutMutationKeys.updateDraftOrderFees(session.id),
    ];

    const resolvers: Array<() => void> = [];
    const executions = mutationKeys.map(mutationKey =>
      queryClient
        .getMutationCache()
        .build(queryClient, {
          mutationKey,
          mutationFn: () =>
            new Promise<void>(resolve => {
              resolvers.push(resolve);
            }),
        })
        .execute(undefined)
    );

    await waitFor(() => {
      const skeletons = document.body.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThanOrEqual(4);
    });
    expect(document.body).toHaveTextContent(/discount/i);
    expect(document.body).toHaveTextContent(/shipping/i);
    expect(document.body).toHaveTextContent(/estimated taxes/i);
    expect(document.body).toHaveTextContent(/fees/i);

    await act(async () => {
      for (const resolve of resolvers) resolve();
      await Promise.all(executions);
    });

    await waitFor(() => {
      expect(document.body.querySelectorAll('.animate-pulse')).toHaveLength(0);
    });
  });

  it('renders a fees row when feeTotal appears after a draft-order refetch', async () => {
    const { queryClient, session } = renderCheckout({
      draftOrderOverrides: {
        totals: totals({
          feeTotal: { value: 0, currencyCode: 'USD' },
          total: { value: 5500, currencyCode: 'USD' },
        }),
      },
    });
    await waitForCheckoutReady();

    expect(document.body).not.toHaveTextContent(/fees/i);

    setFeeTotal(375);
    await queryClient.invalidateQueries({
      queryKey: ['draft-order', { sessionId: session.id }],
    });
    await waitForOperation('DraftOrder', 2);

    await waitFor(() => {
      expect(document.body).toHaveTextContent(/fees/i);
      expect(screen.getAllByText('$3.75').length).toBeGreaterThan(0);
    });
  });

  it('uses the no-items subtotal description when itemCount is zero', async () => {
    renderCheckout({
      draftOrderOverrides: {
        lineItems: [],
        totals: totals({
          subTotal: { value: 0, currencyCode: 'USD' },
          discountTotal: { value: 0, currencyCode: 'USD' },
          shippingTotal: { value: 0, currencyCode: 'USD' },
          taxTotal: { value: 0, currencyCode: 'USD' },
          feeTotal: { value: 0, currencyCode: 'USD' },
          total: { value: 0, currencyCode: 'USD' },
        }),
      },
    });
    await waitForCheckoutReady();

    expect(document.body).toHaveTextContent(/no items/i);
    expect(document.body).not.toHaveTextContent(/0 items/i);
  });

  it('shows preset shipping and taxes even when collection is disabled', async () => {
    renderCheckout({
      sessionOverrides: {
        enableShipping: false,
        enableLocalPickup: false,
        enableTaxCollection: false,
      },
      draftOrderOverrides: {
        totals: totals({
          shippingTotal: { value: 400, currencyCode: 'USD' },
          taxTotal: { value: 250, currencyCode: 'USD' },
          feeTotal: { value: 0, currencyCode: 'USD' },
          total: { value: 5150, currencyCode: 'USD' },
        }),
      },
    });
    await waitForCheckoutReady();

    expect(document.body).toHaveTextContent(/shipping/i);
    expect(screen.getAllByText('$4.00').length).toBeGreaterThan(0);
    expect(document.body).toHaveTextContent(/estimated taxes/i);
    expect(screen.getAllByText('$2.50').length).toBeGreaterThan(0);
  });

  it('adds selected tip to total due without changing the draft-order total line', async () => {
    const { user } = renderCheckout({
      sessionOverrides: {
        enableTips: true,
        enableShipping: false,
        enableLocalPickup: false,
        enableTaxCollection: false,
      },
      draftOrderOverrides: {
        totals: totals({
          subTotal: { value: 2500, currencyCode: 'USD' },
          discountTotal: { value: 0, currencyCode: 'USD' },
          shippingTotal: { value: 0, currencyCode: 'USD' },
          taxTotal: { value: 0, currencyCode: 'USD' },
          feeTotal: { value: 0, currencyCode: 'USD' },
          total: { value: 2500, currencyCode: 'USD' },
        }),
      },
    });
    await waitForCheckoutReady();

    await user.click(await screen.findByRole('button', { name: /20%/ }));

    await waitFor(() => {
      expect(screen.getAllByText('$5.00').length).toBeGreaterThan(0);
      expect(screen.getAllByText('$30.00').length).toBeGreaterThan(0);
      expect(screen.getAllByText('$25.00').length).toBeGreaterThan(0);
    });
  });

  it('mobile order-summary accordion opens and shows line items and totals', async () => {
    const { user } = renderCheckout();
    await waitForCheckoutReady();

    const summaries = screen.getAllByRole('button', { name: /order summary/i });
    await user.click(summaries[0]);

    await waitFor(() => {
      expect(screen.getAllByText(/test product/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/subtotal/i).length).toBeGreaterThan(0);
    });
  });

  it('renders product image, quantity, options, add-ons, and SKU fallback data', async () => {
    renderCheckout({
      draftOrderOverrides: {
        lineItems: [
          buildLineItem({
            name: 'Fallback Product Name',
            quantity: 3,
            details: {
              sku: 'missing-sku',
              productAssetUrl: 'https://cdn.example.test/product.png',
              selectedOptions: [{ attribute: 'Size', values: ['Large'] }],
              selectedAddons: [
                {
                  attribute: 'Gift wrap',
                  sku: 'gift-wrap',
                  values: [{ name: 'Red paper' }],
                },
              ],
              unitOfMeasure: null,
            },
          }),
        ],
      },
    });
    await waitForCheckoutReady();

    expect(
      screen.getAllByText(/fallback product name/i).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/large/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/gift wrap/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/red paper/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/quantity: 3/i).length).toBeGreaterThan(0);
    expect(screen.getAllByAltText(/fallback product name/i)[0]).toHaveAttribute(
      'src',
      'https://cdn.example.test/product.png'
    );
  });

  it('falls back to order line item data when SKU fetch fails', async () => {
    renderCheckout({
      apiOverrides: {
        errors: { getProductsFromOrderSkus: 'sku fetch failed' },
      },
      draftOrderOverrides: {
        lineItems: [buildLineItem({ name: 'Order Fallback Item' })],
      },
    });
    await waitForCheckoutReady();

    await waitFor(() => {
      expect(
        screen.getAllByText(/order fallback item/i).length
      ).toBeGreaterThan(0);
    });
  });
});
