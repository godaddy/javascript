import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderCheckout, waitForCheckoutReady } from './checkout-test-env';

const razorpayPaymentMethods = {
  card: { processor: 'godaddy', checkoutTypes: ['standard'] },
  razorpay: {
    type: 'razorpay',
    processor: 'razorpay',
    checkoutTypes: ['standard'],
  },
};

describe('Razorpay configuration gating', () => {
  it('hides Razorpay when paymentProviderConfiguration.razorpay is missing', async () => {
    renderCheckout({
      sessionOverrides: { paymentMethods: razorpayPaymentMethods } as never,
    });
    await waitForCheckoutReady();

    expect(
      screen.queryByRole('button', { name: /razorpay/i })
    ).not.toBeInTheDocument();
  });

  it('hides Razorpay when configured is false', async () => {
    renderCheckout({
      sessionOverrides: {
        paymentMethods: razorpayPaymentMethods,
        paymentProviderConfiguration: { razorpay: { configured: false } },
      } as never,
    });
    await waitForCheckoutReady();

    expect(
      screen.queryByRole('button', { name: /razorpay/i })
    ).not.toBeInTheDocument();
  });

  it('shows Razorpay when configured is true', async () => {
    renderCheckout({
      sessionOverrides: {
        paymentMethods: razorpayPaymentMethods,
        paymentProviderConfiguration: { razorpay: { configured: true } },
      } as never,
    });
    await waitForCheckoutReady();

    expect(
      screen.getByRole('button', { name: /razorpay/i })
    ).toBeInTheDocument();
  });
});
