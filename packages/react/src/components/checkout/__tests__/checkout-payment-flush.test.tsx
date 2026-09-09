import { fireEvent, screen, waitFor } from '@testing-library/react';
import { useFormContext } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { type CheckoutFormData } from '@/components/checkout/checkout';
import { useBuildPaymentRequest } from '@/components/checkout/payment/utils/use-build-payment-request';
import {
  PaymentProvider,
  useConfirmCheckout,
} from '@/components/checkout/payment/utils/use-confirm-checkout';
import { useFlushCheckoutSync } from '@/components/checkout/payment/utils/use-flush-checkout-sync';
import * as godaddyApi from '@/lib/godaddy/godaddy';
import { PaymentMethodType } from '@/types';
import {
  buildBillingAddress,
  buildCheckoutSession,
  buildDraftOrder,
  buildDraftOrderUpdate,
  clearOperations,
  getOperationOrder,
  getOperations,
  MockTokenizeJs,
  mockGodaddyApi,
  renderCheckout,
  waitForCheckoutReady,
} from './checkout-test-env';
import {
  getLastConfirmInput,
  getLastUpdateInput,
} from './checkout-test-fixtures';

const tokenizeLatestOrder = vi.fn(
  async (_request: unknown) => 'resolved-payment-token'
);
let operationsAtTokenization: string[] = [];

function PaymentRequestResolutionProbe() {
  const form = useFormContext<CheckoutFormData>();
  const flushCheckoutSync = useFlushCheckoutSync();
  const { buildPaymentRequestsFromOrder } = useBuildPaymentRequest();
  const confirmCheckout = useConfirmCheckout();

  return (
    <button
      type='button'
      onClick={async () => {
        if (!(await form.trigger())) return;

        const { latestOrder } = await flushCheckoutSync({
          includeCurrentFormDiff: true,
        });
        if (!latestOrder) return;

        const request =
          buildPaymentRequestsFromOrder(latestOrder).poyntCardRequest;
        operationsAtTokenization = getOperations().map(
          operation => operation.op
        );
        const paymentToken = await tokenizeLatestOrder(request);

        await confirmCheckout.mutateAsync({
          paymentToken,
          paymentType: PaymentMethodType.CREDIT_CARD,
          paymentProvider: PaymentProvider.POYNT,
        });
      }}
    >
      Resolve and tokenize payment
    </button>
  );
}

async function simulateCardPayment(
  options: { notes?: string; pickup?: boolean; tokenError?: string } = {}
) {
  const baseDraftOrder = buildDraftOrder();
  const draftOrder = options.pickup
    ? {
        ...baseDraftOrder,
        lineItems:
          baseDraftOrder.lineItems?.map(lineItem => ({
            ...lineItem,
            fulfillmentMode: 'PICKUP',
          })) ?? [],
      }
    : baseDraftOrder;
  const session = buildCheckoutSession({
    draftOrder,
    ...(options.pickup
      ? { enableShipping: false, enableLocalPickup: true }
      : {}),
  });
  mockGodaddyApi({ session, draftOrder, tokenError: options.tokenError });
  clearOperations();

  if (options.notes) {
    await godaddyApi.updateDraftOrder(
      buildDraftOrderUpdate(
        {
          notes: [{ authorType: 'CUSTOMER', content: options.notes }],
        },
        session
      ),
      session
    );
  }

  const collect = new MockTokenizeJs();
  collect.getNonce({});
  await godaddyApi.confirmCheckout(
    {
      paymentToken: 'test-nonce',
      paymentType: 'card',
      paymentProvider: 'POYNT',
      ...(options.pickup
        ? {
            fulfillmentLocationId: 'location-1',
            fulfillmentStartAt: '2026-01-05T15:30:00.000Z',
            fulfillmentEndAt: '2026-01-05T16:00:00.000Z',
          }
        : {}),
    },
    session
  );
  await Promise.resolve();
  await Promise.resolve();
}

describe('Checkout payment flushing and Poynt card flow', () => {
  it('builds the SDK request from the order returned after flushing current form edits', async () => {
    tokenizeLatestOrder.mockClear();
    operationsAtTokenization = [];
    const { user } = renderCheckout({
      draftOrderOverrides: {
        billing: {
          firstName: 'Stale',
          lastName: 'Buyer',
          address: buildBillingAddress(),
        },
        lineItems: [{ fulfillmentMode: 'PURCHASE' }],
      },
      sessionOverrides: {
        enableShipping: false,
        enableLocalPickup: false,
        enableTaxCollection: false,
      },
      checkoutProps: {
        targets: {
          'checkout.form.submit.after': PaymentRequestResolutionProbe,
        },
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    const billingFirstName = document.querySelector(
      'input[name="billingFirstName"]'
    );
    expect(billingFirstName).toBeInstanceOf(HTMLInputElement);
    fireEvent.change(billingFirstName as HTMLInputElement, {
      target: { value: 'Latest' },
    });
    await user.click(
      screen.getByRole('button', { name: /resolve and tokenize payment/i })
    );

    await waitFor(() => {
      expect(getOperations('ConfirmCheckoutSession')).toHaveLength(1);
    });
    expect(getLastUpdateInput()).toMatchObject({
      billing: { firstName: 'Latest', lastName: 'Buyer' },
    });
    expect(tokenizeLatestOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Latest',
        lastName: 'Buyer',
      })
    );
    const updateIndex = operationsAtTokenization.indexOf(
      'UpdateCheckoutSessionDraftOrder'
    );
    const refetchIndex = operationsAtTokenization.indexOf('DraftOrder');
    expect(updateIndex).toBeGreaterThanOrEqual(0);
    expect(refetchIndex).toBeGreaterThan(updateIndex);
    expect(operationsAtTokenization).not.toContain('ConfirmCheckoutSession');
    expect(getLastConfirmInput()).toMatchObject({
      paymentToken: 'resolved-payment-token',
      paymentType: 'card',
      paymentProvider: 'POYNT',
    });
  });

  it('flushes pending notes sync before tokenization and confirms with the correct payload', async () => {
    await simulateCardPayment({ notes: 'Leave at door' });

    const [updateIdx, nonceIdx, confirmIdx] = getOperationOrder([
      'UpdateCheckoutSessionDraftOrder',
      'TokenizeJs.getNonce',
      'ConfirmCheckoutSession',
    ]);
    expect(updateIdx).toBeGreaterThanOrEqual(0);
    expect(nonceIdx).toBeGreaterThan(updateIdx);
    expect(confirmIdx).toBeGreaterThan(nonceIdx);
    expect(getLastUpdateInput()).toMatchObject({
      notes: [{ authorType: 'CUSTOMER', content: 'Leave at door' }],
    });
    expect(getLastConfirmInput()).toMatchObject({
      paymentToken: 'test-nonce',
      paymentType: 'card',
      paymentProvider: 'POYNT',
    });
  });

  it('includes pickup fulfillment fields when confirming a pickup card checkout', async () => {
    await simulateCardPayment({ pickup: true });

    expect(getLastConfirmInput()).toMatchObject({
      fulfillmentLocationId: 'location-1',
      fulfillmentStartAt: expect.any(String),
      fulfillmentEndAt: expect.any(String),
    });
  });

  it('blocks payment when a required field is missing', async () => {
    const draftOrder = buildDraftOrder({ shipping: { phone: '' } });
    const session = buildCheckoutSession({
      draftOrder,
      enablePhoneCollection: true,
    });
    mockGodaddyApi({ session, draftOrder });
    clearOperations();

    expect(getOperations('TokenizeJs.getNonce')).toHaveLength(0);
    expect(getOperations('ConfirmCheckoutSession')).toHaveLength(0);
  });

  it('shows tokenization errors inline and clears loading', async () => {
    const draftOrder = buildDraftOrder();
    const session = buildCheckoutSession({ draftOrder });
    mockGodaddyApi({ session, draftOrder, tokenError: 'Card declined' });
    clearOperations();

    let errorMessage = '';
    const collect = new MockTokenizeJs();
    collect.on('error', event => {
      errorMessage =
        (event as { data?: { error?: { message?: string } } })?.data?.error
          ?.message ?? '';
    });
    collect.getNonce({});

    expect(errorMessage).toBe('Card declined');
    expect(getOperations('ConfirmCheckoutSession')).toHaveLength(0);
  });
});
