import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  buildShippingAddress,
  clearOperations,
  getOperations,
  renderCheckout,
  waitForCheckoutReady,
  waitForOperation,
} from './checkout-test-env';

describe('Checkout pickup behavior', () => {
  it('switches from shipping to pickup and calculates taxes with pickup location', async () => {
    const { user } = renderCheckout();
    await waitForCheckoutReady();
    clearOperations();

    await user.click(screen.getByRole('radio', { name: /local pickup/i }));
    await waitForOperation('ApplyCheckoutSessionFulfillmentLocation');
    await waitForOperation('CalculateCheckoutSessionTaxes');

    expect(screen.queryByText(/shipping address/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/pickup/i).length).toBeGreaterThan(0);
    expect(
      getOperations('CalculateCheckoutSessionTaxes').at(-1)?.input
    ).toMatchObject({
      destination: expect.objectContaining({ postalCode: '30143' }),
    });
  });

  it('switches from pickup back to shipping, fetches rates, and applies a default shipping method', async () => {
    const { user } = renderCheckout({
      draftOrderOverrides: {
        shipping: {
          address: buildShippingAddress({ adminArea1: 'GA' }),
        },
      },
    });
    await waitForCheckoutReady();
    await user.click(screen.getByRole('radio', { name: /local pickup/i }));
    await waitForOperation('ApplyCheckoutSessionFulfillmentLocation');
    clearOperations();

    await user.click(screen.getByRole('radio', { name: /^shipping/i }));
    expect(screen.getAllByText(/shipping address/i).length).toBeGreaterThan(0);
  });
});
