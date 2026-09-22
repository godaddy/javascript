import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { FormProvider, type UseFormReturn, useForm } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type CheckoutFormData,
  checkoutContext,
} from '@/components/checkout/checkout';
import { DraftOrderSyncProvider } from '@/components/checkout/order/draft-order-sync-provider';
import { SquareCreditCardCheckoutButton } from '@/components/checkout/payment/checkout-buttons/credit-card/square';
import type { SquarePaymentRequest } from '@/components/checkout/payment/utils/use-build-payment-request';
import { GoDaddyProvider } from '@/godaddy-provider';
import {
  buildCheckoutSession,
  buildDraftOrder,
  createTestQueryClient,
  getOperations,
  mockGodaddyApi,
  restoreWindowLocation,
  setupCheckoutTestGlobals,
  waitForOperation,
} from '../../../__tests__/checkout-test-utils';

const SQUARE_TOKEN = 'square-token-1';

// The real SDK keys the card into a cross-origin iframe and tokenizes there,
// none of which exists in jsdom. This stub records the amount Square was asked
// to verify and lets the test hold `tokenize` open, which is the window the tip
// can move in.
const square = vi.hoisted(() => ({
  requests: [] as SquarePaymentRequest[],
  gate: null as { promise: Promise<void>; release: () => void } | null,
}));

vi.mock('@/components/checkout/payment/utils/square-provider', () => ({
  useSquare: () => ({
    card: {
      tokenize: async (request: SquarePaymentRequest) => {
        square.requests.push(request);
        const gate = square.gate;
        if (gate) {
          square.gate = null;
          await gate.promise;
        }
        return { status: 'OK', token: SQUARE_TOKEN };
      },
    },
    isLoading: false,
  }),
}));

function gateNextTokenize() {
  let release = () => undefined as void;
  const promise = new Promise<void>(resolve => {
    release = () => resolve();
  });
  square.gate = { promise, release };
  return square.gate;
}

const noop = () => undefined;

let form: UseFormReturn<CheckoutFormData> | undefined;

function renderSquareButton({ enableTips = true, tipAmount = 0 } = {}) {
  const session = buildCheckoutSession({ enableTips });
  mockGodaddyApi({ session, draftOrder: buildDraftOrder() });
  const queryClient = createTestQueryClient();

  function Harness() {
    const methods = useForm<CheckoutFormData>({
      defaultValues: { tipAmount } as CheckoutFormData,
    });
    form = methods;

    return (
      <GoDaddyProvider queryClient={queryClient}>
        <checkoutContext.Provider
          value={{
            session,
            squareConfig: { appId: 'app-1', locationId: 'location-1' },
            isConfirmingCheckout: false,
            setIsConfirmingCheckout: noop,
            checkoutErrors: undefined,
            setCheckoutErrors: noop,
          }}
        >
          <FormProvider {...methods}>
            <DraftOrderSyncProvider>
              <SquareCreditCardCheckoutButton />
            </DraftOrderSyncProvider>
          </FormProvider>
        </checkoutContext.Provider>
      </GoDaddyProvider>
    );
  }

  return render(<Harness />);
}

async function clickPayNow() {
  const payNow = await screen.findByRole('button', { name: /pay now/i });
  await waitFor(() => {
    expect(payNow).not.toBeDisabled();
  });
  fireEvent.click(payNow);
}

async function waitForTokenize() {
  await waitFor(() => {
    expect(square.requests).toHaveLength(1);
  });
  return square.requests[0];
}

function lastConfirmInput() {
  return getOperations('ConfirmCheckoutSession').at(-1)?.input as
    | Record<string, unknown>
    | undefined;
}

describe('SquareCreditCardCheckoutButton tips', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    setupCheckoutTestGlobals();
    square.requests.length = 0;
    square.gate = null;
    form = undefined;
  });

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
    vi.restoreAllMocks();
    restoreWindowLocation();
  });

  it('confirms the tip Square verified, not one changed during tokenization', async () => {
    // `card.tokenize` is awaited, and the tip can move on its own across that
    // gap — a percentage preset re-derives itself whenever the draft-order
    // subtotal settles. Confirming the current form value would capture a
    // different amount than Square verified.
    renderSquareButton({ enableTips: true, tipAmount: 500 });

    const gate = gateNextTokenize();
    await clickPayNow();

    expect(await waitForTokenize()).toMatchObject({ amount: '30.00' });

    act(() => {
      form?.setValue('tipAmount', 100);
    });
    gate.release();

    await waitForOperation('ConfirmCheckoutSession');
    expect(lastConfirmInput()).toMatchObject({
      paymentToken: SQUARE_TOKEN,
      paymentType: 'card',
      paymentProvider: 'SQUARE',
      tipAmount: 500,
    });
  });

  it('confirms a verified zero tip rather than falling back to the form', async () => {
    // A zero tip is a real verified amount, not a missing one — it has to
    // survive the snapshot instead of being treated as absent.
    renderSquareButton({ enableTips: true, tipAmount: 0 });

    const gate = gateNextTokenize();
    await clickPayNow();

    expect(await waitForTokenize()).toMatchObject({ amount: '25.00' });

    act(() => {
      form?.setValue('tipAmount', 500);
    });
    gate.release();

    await waitForOperation('ConfirmCheckoutSession');
    expect(lastConfirmInput()?.tipAmount).toBe(0);
  });

  it('confirms the selected tip when it does not change', async () => {
    renderSquareButton({ enableTips: true, tipAmount: 500 });

    await clickPayNow();

    await waitForOperation('ConfirmCheckoutSession');
    expect(await waitForTokenize()).toMatchObject({ amount: '30.00' });
    expect(lastConfirmInput()).toMatchObject({ tipAmount: 500 });
  });

  it('sends no tip when the session has tips disabled', async () => {
    // A stale tipAmount can linger in form state after tips are turned off.
    renderSquareButton({ enableTips: false, tipAmount: 500 });

    await clickPayNow();

    await waitForOperation('ConfirmCheckoutSession');
    expect(await waitForTokenize()).toMatchObject({ amount: '25.00' });
    expect(lastConfirmInput()?.tipAmount).toBeUndefined();
  });
});
