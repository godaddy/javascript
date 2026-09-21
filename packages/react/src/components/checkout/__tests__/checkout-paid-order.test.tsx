import { act, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { checkoutQueryKeys } from '@/components/checkout/utils/query-keys';
import {
  buildDraftOrder,
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

  it.each(['UNPAID', 'PENDING'])(
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

  it('uses the loaded order status when the session snapshot is still unpaid', async () => {
    const successUrl = 'https://merchant.example/success';
    const { queryClient, session } = renderCheckout({
      sessionOverrides: { successUrl },
      draftOrderOverrides: { statuses: { paymentStatus: 'UNPAID' } },
    });
    await waitForCheckoutReady();
    act(() => {
      queryClient.setQueryData(checkoutQueryKeys.draftOrder(session.id), {
        checkoutSession: {
          ...session,
          draftOrder: buildDraftOrder({
            statuses: { status: 'OPEN', paymentStatus: 'PAID' },
          }),
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
