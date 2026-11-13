import type { QueryClient } from '@tanstack/react-query';
import { screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it } from 'vitest';
import { checkoutQueryKeys } from '@/components/checkout/utils/query-keys';
import type { ShippingMethod } from '@/types';
import {
  advanceCheckoutDebounce,
  buildDraftOrder,
  buildShippingAddress,
  buildShippingRates,
  clearApiError,
  clearOperations,
  flushPromises,
  getOperations,
  renderCheckout,
  setApiError,
  waitForCheckoutReady,
  waitForOperation,
} from './checkout-test-env';

const freeRate: ShippingMethod = buildShippingRates()[0];
const weightRate: ShippingMethod = buildShippingRates()[1];
const expressRate: ShippingMethod = {
  ...weightRate,
  serviceCode: 'express',
  displayName: 'Express',
  description: 'Express',
  cost: { value: 900, currencyCode: 'USD' },
};
const paidOnlyRates: ShippingMethod[] = [weightRate, expressRate];

function checkedShippingRadios(): string[] {
  return screen
    .getAllByRole('radio')
    .filter(radio => radio.getAttribute('aria-checked') === 'true')
    .map(radio => radio.getAttribute('aria-label') ?? '')
    .filter(label => label !== 'Shipping');
}

function shippingLine(service: string, value: number) {
  return {
    requestedService: service,
    requestedProvider: 'unknown',
    name: service,
    amount: { value, currencyCode: 'USD' },
    discounts: [],
  };
}

function offerRates(
  queryClient: QueryClient,
  sessionId: string,
  rates: ShippingMethod[]
) {
  const address = buildDraftOrder().shipping?.address ?? buildShippingAddress();
  act(() => {
    queryClient.setQueryData(
      [
        ...checkoutQueryKeys.draftOrderShippingMethods(sessionId),
        {
          addressLine1: address.addressLine1,
          adminArea1: address.adminArea1,
          adminArea2: address.adminArea2,
          postalCode: address.postalCode,
          countryCode: address.countryCode,
        },
      ],
      {
        checkoutSession: { draftOrder: { calculatedShippingRates: { rates } } },
      }
    );
  });
}

function appliedInputs(): unknown[] {
  return getOperations('ApplyCheckoutSessionShippingMethod').map(
    operation => operation.input
  );
}

describe('Checkout free shipping default selection', () => {
  it('keeps a paid shipping line already on the draft order on load', async () => {
    // The saved line may be the shopper's earlier choice (reload, payment
    // redirect), so a $0 rate that was already offered does not replace it.
    renderCheckout({
      draftOrderOverrides: {
        shippingLines: [shippingLine('weight-based', 100)],
      },
    });
    await waitForCheckoutReady();
    await advanceCheckoutDebounce(2500);

    expect(checkedShippingRadios()).toEqual(['Weight Based $1.00']);
    expect(appliedInputs()).toEqual([]);
  });

  it('keeps a free rate already on the draft order when another free rate sorts first', async () => {
    const standardFreeRate: ShippingMethod = {
      ...freeRate,
      serviceCode: 'standard-free',
      displayName: 'Standard Free',
      description: 'Standard Free',
    };
    renderCheckout({
      draftOrderOverrides: {
        shippingLines: [shippingLine('standard-free', 0)],
      },
      apiOverrides: {
        shippingMethods: [freeRate, standardFreeRate, weightRate],
      },
    });
    await waitForCheckoutReady();
    await advanceCheckoutDebounce(2500);

    expect(checkedShippingRadios()).toEqual(['Standard Free FREE']);
    expect(appliedInputs()).toEqual([]);
  });

  it('applies the free rate when the draft order has no shipping line', async () => {
    renderCheckout();
    await waitForCheckoutReady();
    await advanceCheckoutDebounce(2500);

    expect(checkedShippingRadios()).toEqual(['Free FREE']);
    expect(appliedInputs()).toEqual([
      [expect.objectContaining({ requestedService: 'free-shipping' })],
    ]);
  });

  it('selects the free rate when it appears after a paid rate was auto-applied', async () => {
    const { queryClient, session } = renderCheckout({
      apiOverrides: { shippingMethods: paidOnlyRates },
    });
    await waitForCheckoutReady();
    await advanceCheckoutDebounce(2500);

    expect(checkedShippingRadios()).toEqual(['Weight Based $1.00']);
    expect(appliedInputs()).toHaveLength(1);
    clearOperations();

    offerRates(queryClient, session.id, [freeRate, ...paidOnlyRates]);
    await flushPromises();
    await advanceCheckoutDebounce(2500);

    expect(checkedShippingRadios()).toEqual(['Free FREE']);
    expect(appliedInputs()).toEqual([
      [expect.objectContaining({ requestedService: 'free-shipping' })],
    ]);
  });

  it('keeps a paid rate the shopper picked when the rates are refreshed with a free rate', async () => {
    const { user, queryClient, session } = renderCheckout();
    await waitForCheckoutReady();
    await advanceCheckoutDebounce(2500);
    clearOperations();

    await user.click(screen.getByRole('radio', { name: /weight based/i }));
    await waitFor(() => {
      expect(queryClient.isMutating()).toBe(0);
      expect(queryClient.isFetching()).toBe(0);
    });
    clearOperations();

    const address =
      buildDraftOrder().shipping?.address ?? buildShippingAddress();
    act(() => {
      queryClient.setQueryData(
        [
          ...checkoutQueryKeys.draftOrderShippingMethods(session.id),
          {
            addressLine1: address.addressLine1,
            adminArea1: address.adminArea1,
            adminArea2: address.adminArea2,
            postalCode: address.postalCode,
            countryCode: address.countryCode,
          },
        ],
        {
          checkoutSession: {
            draftOrder: {
              calculatedShippingRates: {
                rates: [freeRate, weightRate, expressRate],
              },
            },
          },
        }
      );
    });
    await flushPromises();
    await advanceCheckoutDebounce(2500);

    expect(checkedShippingRadios()).toEqual(['Weight Based $1.00']);
    expect(appliedInputs()).toHaveLength(0);
  });

  it('shows the rate still on the draft order and does not retry when switching to a newly offered free rate fails', async () => {
    const { queryClient, session } = renderCheckout({
      apiOverrides: { shippingMethods: paidOnlyRates },
    });
    await waitForCheckoutReady();
    await advanceCheckoutDebounce(2500);
    expect(checkedShippingRadios()).toEqual(['Weight Based $1.00']);
    clearOperations();

    setApiError('applyShippingMethod', new Error('apply failed'));
    offerRates(queryClient, session.id, [freeRate, ...paidOnlyRates]);
    await waitForOperation('ApplyCheckoutSessionShippingMethod');
    await waitFor(() => {
      expect(queryClient.isMutating()).toBe(0);
      expect(queryClient.isFetching()).toBe(0);
    });
    await flushPromises();
    await advanceCheckoutDebounce(2500);
    await flushPromises();

    expect(checkedShippingRadios()).toEqual(['Weight Based $1.00']);
    // One attempt only: the failed free rate is not retried in a loop.
    expect(appliedInputs()).toEqual([
      [expect.objectContaining({ requestedService: 'free-shipping' })],
    ]);

    // The paid rate is not stuck: once applies work again, the free rate that is
    // still offered is applied after the next rate change.
    clearApiError('applyShippingMethod');
    clearOperations();
    offerRates(queryClient, session.id, [
      freeRate,
      { ...weightRate, cost: { value: 150, currencyCode: 'USD' } },
      expressRate,
    ]);
    await waitForOperation('ApplyCheckoutSessionShippingMethod');
    await flushPromises();

    expect(appliedInputs()).toEqual([
      [expect.objectContaining({ requestedService: 'free-shipping' })],
    ]);
    expect(checkedShippingRadios()).toEqual(['Free FREE']);
  });

  it('re-applies the order discount code after switching an automatic paid rate to a newly offered free rate', async () => {
    const { queryClient, session } = renderCheckout({
      apiOverrides: { shippingMethods: paidOnlyRates },
      draftOrderOverrides: {
        discounts: [
          {
            code: 'SAVE',
            name: 'SAVE',
            amount: { value: 100, currencyCode: 'USD' },
          },
        ],
      },
    });
    await waitForCheckoutReady();
    await advanceCheckoutDebounce(2500);
    expect(checkedShippingRadios()).toEqual(['Weight Based $1.00']);
    await flushPromises();
    clearOperations();

    offerRates(queryClient, session.id, [freeRate, ...paidOnlyRates]);
    await waitForOperation('ApplyCheckoutSessionShippingMethod');
    await waitForOperation('ApplyCheckoutSessionDiscount');

    expect(appliedInputs()).toEqual([
      [expect.objectContaining({ requestedService: 'free-shipping' })],
    ]);
    expect(
      getOperations('ApplyCheckoutSessionDiscount')[0].input
    ).toMatchObject({ discountCodes: ['SAVE'] });
  });
});
