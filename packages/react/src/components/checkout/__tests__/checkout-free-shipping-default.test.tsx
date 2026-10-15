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
  clearOperations,
  flushPromises,
  getOperations,
  renderCheckout,
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

function appliedInputs(): unknown[] {
  return getOperations('ApplyCheckoutSessionShippingMethod').map(
    operation => operation.input
  );
}

describe('Checkout free shipping default selection', () => {
  it('selects and applies the free rate when the draft order already has a paid shipping line', async () => {
    renderCheckout({
      draftOrderOverrides: {
        shippingLines: [shippingLine('weight-based', 100)],
      },
    });
    await waitForCheckoutReady();
    await advanceCheckoutDebounce(2500);

    expect(checkedShippingRadios()).toEqual(['Free FREE']);
    expect(appliedInputs()).toEqual([
      [expect.objectContaining({ requestedService: 'free-shipping' })],
    ]);
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

  it('shows the paid rate still on the draft order when applying the free rate fails', async () => {
    renderCheckout({
      draftOrderOverrides: {
        shippingLines: [shippingLine('weight-based', 100)],
      },
      apiOverrides: {
        errors: { applyShippingMethod: new Error('apply failed') },
      },
    });
    await waitForCheckoutReady();
    await waitForOperation('ApplyCheckoutSessionShippingMethod');
    await advanceCheckoutDebounce(2500);

    await waitFor(() => {
      expect(checkedShippingRadios()).toEqual(['Weight Based $1.00']);
    });
    expect(appliedInputs()).toEqual([
      [expect.objectContaining({ requestedService: 'free-shipping' })],
    ]);
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
                rates: [freeRate, ...paidOnlyRates],
              },
            },
          },
        }
      );
    });
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

  it('re-applies the order discount code after switching an auto-applied paid rate to free', async () => {
    renderCheckout({
      draftOrderOverrides: {
        shippingLines: [shippingLine('weight-based', 100)],
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
    await waitForOperation('ApplyCheckoutSessionShippingMethod');
    await waitForOperation('ApplyCheckoutSessionDiscount');

    expect(appliedInputs()).toEqual([
      [expect.objectContaining({ requestedService: 'free-shipping' })],
    ]);
    expect(getOperations('ApplyCheckoutSessionDiscount')).toHaveLength(1);
    expect(
      getOperations('ApplyCheckoutSessionDiscount')[0].input
    ).toMatchObject({ discountCodes: ['SAVE'] });
  });
});
