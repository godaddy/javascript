import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FlushDraftOrderSyncResult } from '@/components/checkout/order/draft-order-sync-provider';
import { CheckoutType, PaymentMethodType, PaymentProvider } from '@/types';
import {
  clearOperations,
  getOperations,
  renderCheckout,
  waitForOperation,
} from './checkout-test-env';
import { getLastConfirmInput } from './checkout-test-fixtures';

vi.mock('@/components/checkout/payment/utils/use-load-mercadopago', () => ({
  useLoadMercadoPago: () => ({ isMercadoPagoLoaded: true }),
}));

// The real flush waits for in-flight draft-order work to settle. Stubbing it
// makes that wait controllable, which is the only way to hold a pay click open
// long enough for the total to move underneath it.
let flushGate: Promise<void> | null = null;

vi.mock('@/components/checkout/payment/utils/use-flush-checkout-sync', () => ({
  useFlushCheckoutSync: () => async () => {
    const gate = flushGate;
    if (gate) {
      flushGate = null;
      await gate;
    }
    // The stub still has to answer with the real hook's result shape:
    // `useConfirmCheckout` destructures `latestOrder` off it and would throw on
    // `undefined`. No patch is sent here, and `latestOrder` left absent makes
    // the caller fall back to the draft order already in the query cache.
    return { patchSent: false } satisfies FlushDraftOrderSyncResult;
  },
}));

function gateNextFlush() {
  let release = () => undefined as void;
  flushGate = new Promise<void>(resolve => {
    release = () => resolve();
  });
  return release;
}

interface BrickCall {
  amount: number;
  preferenceId: string;
}

const brickCalls: BrickCall[] = [];
let createGate: { promise: Promise<void>; release: () => void } | null = null;

// Gate the next brick creation so the pending-rebuild window is observable.
function gateNextCreate() {
  let release = () => undefined as void;
  const promise = new Promise<void>(resolve => {
    release = () => resolve();
  });
  createGate = { promise, release };
  return createGate;
}

class MercadoPagoStub {
  bricks() {
    return {
      create: async (_brick: string, elementId: string, settings: any) => {
        const gate = createGate;
        if (gate) {
          createGate = null;
          await gate.promise;
        }

        brickCalls.push({
          amount: settings?.initialization?.amount,
          preferenceId: settings?.initialization?.preferenceId,
        });
        settings?.callbacks?.onReady?.();

        return {
          unmount: () => undefined,
          getFormData: async () => ({ formData: { token: 'mp-token-1' } }),
        };
      },
    };
  }
}

(window as any).MercadoPago = MercadoPagoStub;

const MERCADOPAGO_SESSION = {
  enableTips: true,
  enableShipping: false,
  enableLocalPickup: false,
  enableTaxCollection: false,
  paymentMethods: {
    card: null,
    mercadopago: {
      type: PaymentMethodType.MERCADOPAGO,
      processor: PaymentProvider.MERCADOPAGO,
      checkoutTypes: [CheckoutType.STANDARD],
    },
  },
};

const MERCADOPAGO_PROPS = {
  mercadoPagoConfig: { publicKey: 'public-key-1', country: 'BR' as const },
};

function renderMercadoPagoCheckout(
  overrides: Parameters<typeof renderCheckout>[0] = {}
) {
  return renderCheckout({
    checkoutProps: MERCADOPAGO_PROPS,
    sessionOverrides: MERCADOPAGO_SESSION,
    ...overrides,
  });
}

function getAuthorizeInputs() {
  return getOperations('AuthorizeCheckoutSession').map(
    operation => operation.input as Record<string, unknown>
  );
}

async function waitForBrickCalls(count: number) {
  await waitFor(() => {
    expect(brickCalls.length).toBeGreaterThanOrEqual(count);
  });
}

describe('Checkout MercadoPago tips', () => {
  beforeEach(() => {
    brickCalls.length = 0;
    createGate = null;
    flushGate = null;
  });

  it('builds the brick and preference for the tip-inclusive total', async () => {
    const { user } = renderMercadoPagoCheckout();
    await waitForBrickCalls(1);

    expect(brickCalls[0]).toMatchObject({
      amount: 25,
      preferenceId: 'transaction-ref-1',
    });
    expect(getAuthorizeInputs().at(-1)).toMatchObject({ tipAmount: 0 });

    await user.click(await screen.findByRole('radio', { name: /20%/ }));

    await waitForBrickCalls(2);
    expect(brickCalls.at(-1)).toMatchObject({ amount: 30 });
    expect(getAuthorizeInputs().at(-1)).toMatchObject({ tipAmount: 500 });
  });

  it('rebuilds the brick each time the tip changes', async () => {
    const { user } = renderMercadoPagoCheckout();
    await waitForBrickCalls(1);

    await user.click(await screen.findByRole('radio', { name: /20%/ }));
    await waitForBrickCalls(2);

    await user.click(await screen.findByRole('radio', { name: /15%/ }));
    await waitForBrickCalls(3);

    expect(brickCalls.map(call => call.amount)).toEqual([25, 30, 28.75]);
    expect(getAuthorizeInputs().map(input => input.tipAmount)).toEqual([
      0, 500, 375,
    ]);
  });

  it('coalesces a burst of tip changes into a single rebuild and authorization', async () => {
    const { user } = renderMercadoPagoCheckout();
    await waitForBrickCalls(1);
    clearOperations();

    // Back-to-back taps inside the debounce window: only the last one should
    // reach the provider, since every rebuild authorizes the session again.
    await user.click(await screen.findByRole('radio', { name: /20%/ }));
    await user.click(await screen.findByRole('radio', { name: /15%/ }));

    await waitForBrickCalls(2);
    await waitFor(() => {
      expect(getOperations('AuthorizeCheckoutSession')).toHaveLength(1);
    });

    expect(brickCalls).toHaveLength(2);
    expect(brickCalls.at(-1)).toMatchObject({ amount: 28.75 });
    expect(getAuthorizeInputs()).toEqual([
      expect.objectContaining({ tipAmount: 375 }),
    ]);
  });

  it('does not rebuild the brick when the tip-inclusive total is unchanged', async () => {
    const { user } = renderMercadoPagoCheckout();
    await waitForBrickCalls(1);
    clearOperations();

    await user.click(await screen.findByRole('radio', { name: /no tip/i }));

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /no tip/i })).toHaveAttribute(
        'aria-checked',
        'true'
      );
    });
    expect(brickCalls).toHaveLength(1);
    expect(getOperations('AuthorizeCheckoutSession')).toHaveLength(0);
  });

  it('does not let the customer pay while the brick is rebuilt for a new tip', async () => {
    const firstCreate = gateNextCreate();
    const { user } = renderMercadoPagoCheckout();

    const payNow = await screen.findByRole('button', { name: /pay now/i });
    expect(payNow).toBeDisabled();

    firstCreate.release();
    await waitForBrickCalls(1);
    await waitFor(() => {
      expect(payNow).not.toBeDisabled();
    });

    const rebuild = gateNextCreate();
    await user.click(await screen.findByRole('radio', { name: /20%/ }));

    await waitFor(() => {
      expect(payNow).toBeDisabled();
    });

    rebuild.release();
    await waitForBrickCalls(2);
    await waitFor(() => {
      expect(payNow).not.toBeDisabled();
    });
    expect(brickCalls.at(-1)).toMatchObject({ amount: 30 });
  });

  it('starts the pending rebuild when a pay click finds the total has moved', async () => {
    const { user } = renderMercadoPagoCheckout();
    await waitForBrickCalls(1);
    clearOperations();

    // Held inside the flush so the tip lands while the click is still in
    // flight: the brick that would tokenize the card is for $25, the customer
    // is now paying $30, and there is nothing valid left to submit.
    const releaseFlush = gateNextFlush();
    fireEvent.click(await screen.findByRole('button', { name: /pay now/i }));

    await user.click(await screen.findByRole('radio', { name: /20%/ }));
    releaseFlush();
    await act(async () => undefined);

    // Asserted without waiting, because waiting is what this is about: the
    // rebuild is started by the click itself rather than left to sit out the
    // remaining debounce.
    expect(getOperations('AuthorizeCheckoutSession')).toHaveLength(1);

    await waitForBrickCalls(2);
    expect(brickCalls.at(-1)).toMatchObject({ amount: 30 });
    // Nothing was submitted for the stale total.
    expect(getOperations('ConfirmCheckoutSession')).toHaveLength(0);
  });

  it('confirms with the tip the brick and preference were built for', async () => {
    // confirmCheckout is made to fail so the module-level submit latch resets
    // and the brick can be torn down for the next test.
    const { user } = renderMercadoPagoCheckout({
      apiOverrides: {
        errors: { confirmCheckout: new Error('confirm failed') },
      },
    });
    await waitForBrickCalls(1);

    await user.click(await screen.findByRole('radio', { name: /20%/ }));
    await waitForBrickCalls(2);

    await user.click(await screen.findByRole('button', { name: /pay now/i }));
    await waitForOperation('ConfirmCheckoutSession');

    expect(getLastConfirmInput()).toMatchObject({
      paymentToken: 'mp-token-1',
      paymentType: 'mercadopago',
      tipAmount: 500,
    });
    expect(brickCalls.at(-1)).toMatchObject({ amount: 30 });
    expect(getAuthorizeInputs().at(-1)).toMatchObject({ tipAmount: 500 });
  });
});
