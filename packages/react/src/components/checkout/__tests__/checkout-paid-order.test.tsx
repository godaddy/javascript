import { act, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { checkoutQueryKeys } from '@/components/checkout/utils/query-keys';
import {
  getOperations,
  mockWindowLocation,
  renderCheckout,
  waitForCheckoutReady,
} from './checkout-test-env';

describe('Checkout paid-order recovery', () => {
  beforeEach(() => {
    mockWindowLocation();
  });

  it('redirects a paid order to the session success URL without showing payment controls', async () => {
    const successUrl = 'https://merchant.example/success';
    renderCheckout({
      sessionOverrides: { successUrl },
      draftOrderOverrides: {
        statuses: { status: 'OPEN', paymentStatus: 'PAID' },
      },
    });

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Payment successful'
    );
    expect(
      screen.queryByRole('button', { name: /pay now/i })
    ).not.toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });
    expect(window.location.href).toBe(successUrl);
    expect(getOperations('ConfirmCheckoutSession')).toHaveLength(0);
  });

  it('keeps payment controls hidden when a paid order has no success URL', async () => {
    const initialUrl = window.location.href;
    renderCheckout({
      draftOrderOverrides: {
        statuses: { status: 'OPEN', paymentStatus: 'PAID' },
      },
    });

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Payment successful'
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });
    expect(window.location.href).toBe(initialUrl);
    expect(
      screen.queryByRole('button', { name: /pay now/i })
    ).not.toBeInTheDocument();
  });

  it('only looks up order status when the draft order is unavailable', async () => {
    renderCheckout({
      draftOrderOverrides: { statuses: { paymentStatus: 'UNPAID' } },
    });
    await waitForCheckoutReady();
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });
    expect(getOperations('CheckoutOrderStatus')).toHaveLength(0);
  });

  it('looks up order status once for a paid order', async () => {
    renderCheckout({
      draftOrderOverrides: {
        statuses: { status: 'OPEN', paymentStatus: 'PAID' },
      },
    });
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Payment successful'
    );
    expect(getOperations('CheckoutOrderStatus')).toHaveLength(1);
  });

  it('sends a paid order to the success URL rather than the return URL', async () => {
    const successUrl = 'https://merchant.example/success';
    renderCheckout({
      sessionOverrides: {
        successUrl,
        returnUrl: 'https://merchant.example/cart',
      },
      draftOrderOverrides: {
        statuses: { status: 'OPEN', paymentStatus: 'PAID' },
      },
    });

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Payment successful'
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });
    expect(window.location.href).toBe(successUrl);
  });

  it.each([
    {
      name: 'the API cannot report order status',
      statuses: { status: 'OPEN', paymentStatus: 'PAID' },
      errors: { getCheckoutOrderStatus: new Error('Cannot query field') },
    },
    {
      name: 'the order was canceled',
      statuses: { status: 'CANCELED', paymentStatus: 'PAID' },
      errors: {},
    },
  ])(
    'falls back to the return URL without a draft order when $name',
    async ({ statuses, errors }) => {
      const returnUrl = 'https://merchant.example/cart';
      renderCheckout({
        sessionOverrides: {
          successUrl: 'https://merchant.example/success',
          returnUrl,
        },
        draftOrderOverrides: { statuses },
        apiOverrides: { errors },
      });

      await waitFor(() => expect(window.location.href).toBe(returnUrl));
      expect(screen.queryByText('Payment successful')).not.toBeInTheDocument();
    }
  );

  it('redirects an offline order whose payment is PENDING', async () => {
    const successUrl = 'https://merchant.example/success';
    renderCheckout({
      sessionOverrides: { successUrl },
      draftOrderOverrides: {
        statuses: { status: 'OPEN', paymentStatus: 'PENDING' },
      },
    });

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Payment successful'
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });
    expect(window.location.href).toBe(successUrl);
    expect(getOperations('ConfirmCheckoutSession')).toHaveLength(0);
  });

  it.each(['UNPAID', 'PARTIALLY_PAID'])(
    'does not redirect an order whose payment status is %s',
    async paymentStatus => {
      const initialUrl = window.location.href;
      renderCheckout({
        sessionOverrides: { successUrl: 'https://merchant.example/success' },
        draftOrderOverrides: { statuses: { paymentStatus } },
      });
      await waitForCheckoutReady();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1100);
      });
      expect(window.location.href).toBe(initialUrl);
      expect(screen.queryByText('Payment successful')).not.toBeInTheDocument();
    }
  );

  it('redirects when a refreshed order status becomes paid', async () => {
    const successUrl = 'https://merchant.example/success';
    const { queryClient, session } = renderCheckout({
      sessionOverrides: { successUrl },
      draftOrderOverrides: { statuses: { paymentStatus: 'UNPAID' } },
    });
    await waitForCheckoutReady();
    act(() => {
      queryClient.setQueryData(checkoutQueryKeys.orderStatus(session.id), {
        checkoutSession: {
          id: session.id,
          orderStatus: { status: 'OPEN', paymentStatus: 'PAID' },
        },
      });
    });
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Payment successful'
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });
    expect(window.location.href).toBe(successUrl);
  });
});
