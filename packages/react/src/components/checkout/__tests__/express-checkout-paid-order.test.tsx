import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DraftOrderExpressCheckout } from '@/components/checkout/express-checkout/express-checkout';
import { PaymentProvider } from '@/components/checkout/payment/utils/use-confirm-checkout';
import { useConfirmExpressCheckout } from '@/components/checkout/payment/utils/use-confirm-express-checkout';
import { GoDaddyProvider } from '@/godaddy-provider';
import { confirmCheckout, getDraftOrder } from '@/lib/godaddy/godaddy';
import {
  buildCheckoutSession,
  buildDraftOrder,
  createTestQueryClient,
  mockGodaddyApi,
  mockWindowLocation,
} from './checkout-test-env';

vi.mock('@/components/checkout/payment/payment-method-renderer', () => ({
  PaymentMethodRenderer: () => {
    const confirmation = useConfirmExpressCheckout();
    return (
      <button
        onClick={() => {
          void confirmation
            .mutateAsync({
              paymentToken: 'wallet-token',
              paymentType: 'apple_pay',
              paymentProvider: PaymentProvider.POYNT,
            })
            .catch(() => undefined);
        }}
      >
        Express pay
      </button>
    );
  },
}));

function renderExpress(paymentStatus: string) {
  const draftOrder = buildDraftOrder({
    statuses: {
      status: paymentStatus === 'PAID' ? 'OPEN' : 'DRAFT',
      paymentStatus,
    },
  });
  const session = buildCheckoutSession({
    successUrl: 'https://merchant.example/success',
    paymentMethods: {
      card: null as never,
      applePay: { processor: 'godaddy', checkoutTypes: ['express'] },
    },
  });
  mockGodaddyApi({ session, draftOrder });
  render(
    <GoDaddyProvider queryClient={createTestQueryClient()}>
      <DraftOrderExpressCheckout session={session} />
    </GoDaddyProvider>
  );
  return session;
}

describe('Standalone express paid-order recovery', () => {
  beforeEach(() => mockWindowLocation());

  it.each(['load', 'confirmation failure'])(
    'redirects paid orders on %s',
    async scenario => {
      const session = renderExpress(scenario === 'load' ? 'PAID' : 'UNPAID');
      if (scenario === 'confirmation failure') {
        const button = await screen.findByRole('button', {
          name: 'Express pay',
        });
        vi.mocked(confirmCheckout).mockImplementationOnce(async () => {
          vi.mocked(getDraftOrder).mockResolvedValue({
            checkoutSession: {
              ...session,
              draftOrder: buildDraftOrder({
                statuses: { status: 'OPEN', paymentStatus: 'PAID' },
              }),
            },
          });
          throw new Error('Confirmation response lost');
        });
        fireEvent.click(button);
      }
      expect(await screen.findByRole('status')).toHaveTextContent(
        'Payment successful'
      );
      expect(
        screen.queryByRole('button', { name: 'Express pay' })
      ).not.toBeInTheDocument();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1100);
      });
      expect(window.location.href).toBe(session.successUrl);
      expect(confirmCheckout).toHaveBeenCalledTimes(
        scenario === 'load' ? 0 : 1
      );
    }
  );

  it('keeps express payment available for an unpaid order', async () => {
    renderExpress('UNPAID');
    expect(
      await screen.findByRole('button', { name: 'Express pay' })
    ).toBeInTheDocument();
    expect(window.location.href).not.toContain('/success');
  });
});
