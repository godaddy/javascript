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
  it('renders the Razorpay checkout button when session and public token are configured', async () => {
    renderCheckout({
      session: buildRazorpaySession(),
      checkoutProps: {
        razorpayConfig: { publicToken: 'rzp_test_public' },
      },
    });
    await waitForCheckoutReady();

    expect(await screen.findByTestId('mock-razorpay-button')).toBeVisible();
  });

  it('hides Razorpay when the public token is unavailable', async () => {
    renderCheckout({ session: buildRazorpaySession() });
    await waitForCheckoutReady();

    expect(screen.getByText('No payment methods available')).toBeVisible();
    expect(screen.queryByTestId('mock-razorpay-button')).not.toBeInTheDocument();
  });
});
