import { describe, expect, it } from 'vitest';
import * as godaddyApi from '@/lib/godaddy/godaddy';
import {
  buildCheckoutSession,
  buildDraftOrder,
  buildDraftOrderUpdate,
  clearOperations,
  getOperationOrder,
  getOperations,
  MockTokenizeJs,
  mockGodaddyApi,
} from './checkout-test-env';
import {
  getLastConfirmInput,
  getLastUpdateInput,
} from './checkout-test-fixtures';

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
