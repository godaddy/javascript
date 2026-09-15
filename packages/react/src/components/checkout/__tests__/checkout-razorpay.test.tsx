import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  buildCheckoutSession,
  renderCheckout,
  waitForCheckoutReady,
} from './checkout-test-env';

function buildRazorpaySession() {
  const session = buildCheckoutSession();
  session.paymentMethods = {
    razorpay: {
      type: 'razorpay',
      processor: 'razorpay',
      checkoutTypes: ['standard'],
    },
  } as never;
  return session;
}

describe('Razorpay payment method', () => {
  it('renders the Razorpay checkout button when enabled for the session', async () => {
    renderCheckout({ session: buildRazorpaySession() });
    await waitForCheckoutReady();

    expect(await screen.findByTestId('mock-razorpay-button')).toBeVisible();
  });

  it('hides Razorpay when it is not enabled for the session', async () => {
    const session = buildCheckoutSession();
    session.paymentMethods = {} as never;
    renderCheckout({ session });
    await waitForCheckoutReady();

    expect(screen.getByText('No payment methods available')).toBeVisible();
    expect(
      screen.queryByTestId('mock-razorpay-button')
    ).not.toBeInTheDocument();
  });
});
