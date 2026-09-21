import { act, render, waitFor } from '@testing-library/react';
import { FormProvider, type UseFormReturn, useForm } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type CheckoutFormData,
  checkoutContext,
} from '@/components/checkout/checkout';
import { DraftOrderSyncProvider } from '@/components/checkout/order/draft-order-sync-provider';
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
} from '../../__tests__/checkout-test-utils';
import { GoDaddyApplePayCheckoutButton } from './applePay/godaddy';
import { GoDaddyGooglePayCheckoutButton } from './googlePay/godaddy';
import { PazeCheckoutButton } from './paze/godaddy';

vi.mock('@/components/checkout/payment/utils/use-load-poynt-collect', () => ({
  useLoadPoyntCollect: () => ({ isPoyntLoaded: true }),
}));

const NONCE = 'wallet-nonce-1';

interface WalletRequest {
  total: { amount: string };
}

interface AuthorizedEvent {
  nonce?: string;
  source?: string;
  complete: (result?: { error?: unknown }) => void;
}

// The real SDK mounts its buttons in an iframe and opens a native sheet, neither
// of which exists in jsdom. This stub keeps the button's onClick and the SDK's
// own event handlers so a test can open the sheet, move the tip, and only then
// fire `payment_authorized` — the window the tip can change in.
const wallet = {
  clicks: new Map<string, () => Promise<void>>(),
  handlers: new Map<string, (event: AuthorizedEvent) => unknown>(),
  requests: [] as WalletRequest[],
};

class WalletTokenizeJs {
  async supportWalletPayments() {
    return { applePay: true, googlePay: true, paze: true };
  }

  mount(
    id: string,
    _document: Document,
    options: { buttonOptions?: { onClick?: () => Promise<void> } }
  ) {
    if (options.buttonOptions?.onClick) {
      wallet.clicks.set(id, options.buttonOptions.onClick);
    }
  }

  on(eventName: string, handler: (event: AuthorizedEvent) => unknown) {
    wallet.handlers.set(eventName, handler);
  }

  startApplePaySession(request: WalletRequest) {
    wallet.requests.push(request);
  }

  startGooglePaySession(request: WalletRequest) {
    wallet.requests.push(request);
  }

  startPazeSession(request: WalletRequest) {
    wallet.requests.push(request);
  }
}

const noop = () => undefined;

let form: UseFormReturn<CheckoutFormData> | undefined;

function renderWallet(
  Component: () => React.JSX.Element,
  { enableTips = true, tipAmount = 0 } = {}
) {
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
            godaddyPaymentsConfig: {
              appId: 'app-1',
              businessId: 'business-1',
            },
            isConfirmingCheckout: false,
            setIsConfirmingCheckout: noop,
            checkoutErrors: undefined,
            setCheckoutErrors: noop,
          }}
        >
          <FormProvider {...methods}>
            <DraftOrderSyncProvider>
              <Component />
            </DraftOrderSyncProvider>
          </FormProvider>
        </checkoutContext.Provider>
      </GoDaddyProvider>
    );
  }

  return render(<Harness />);
}

// Returns the request the sheet was opened with — the amount the buyer approves.
async function openWallet(elementId: string) {
  const element = await waitFor(() => {
    const node = document.getElementById(elementId);
    expect(node).not.toBeNull();
    return node as HTMLElement;
  });
  // The className mirrors the component's own `isDisabled`, which the click
  // handler bails on while the draft order is still in flight.
  await waitFor(() => {
    expect(element.className).toBe('');
  });
  await waitFor(() => {
    expect(wallet.clicks.has(elementId)).toBe(true);
  });

  await act(async () => {
    await wallet.clicks.get(elementId)?.();
  });

  return wallet.requests.at(-1);
}

async function authorize(source: string) {
  const complete = vi.fn();
  await act(async () => {
    await wallet.handlers.get('payment_authorized')?.({
      nonce: NONCE,
      source,
      complete,
    });
  });
  return complete;
}

function lastConfirmInput() {
  return getOperations('ConfirmCheckoutSession').at(-1)?.input as
    | Record<string, unknown>
    | undefined;
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  setupCheckoutTestGlobals();
  wallet.clicks.clear();
  wallet.handlers.clear();
  wallet.requests.length = 0;
  form = undefined;
  window.TokenizeJs = WalletTokenizeJs as never;
});

afterEach(() => {
  act(() => {
    vi.runOnlyPendingTimers();
  });
  vi.useRealTimers();
  vi.restoreAllMocks();
  restoreWindowLocation();
});

describe.each([
  {
    name: 'Apple Pay',
    Component: GoDaddyApplePayCheckoutButton,
    elementId: 'apple-pay-element',
    source: 'apple_pay',
  },
  {
    name: 'Google Pay',
    Component: GoDaddyGooglePayCheckoutButton,
    elementId: 'google-pay-element',
    source: 'google_pay',
  },
  {
    name: 'Paze',
    Component: PazeCheckoutButton,
    elementId: 'paze-pay-element',
    source: 'paze',
  },
])('$name tips', ({ Component, elementId, source }) => {
  it('confirms the tip the sheet was opened for, not one changed while it was open', async () => {
    // The sheet stays open until the buyer approves, and the tip can move on its
    // own across that gap — a percentage preset re-derives itself whenever the
    // draft-order subtotal settles. Confirming the current form value would
    // capture a different amount than the sheet was authorized for.
    renderWallet(Component, { enableTips: true, tipAmount: 500 });

    expect(await openWallet(elementId)).toMatchObject({
      total: { amount: '30.00' },
    });

    act(() => {
      form?.setValue('tipAmount', 100);
    });
    await authorize(source);

    await waitForOperation('ConfirmCheckoutSession');
    expect(lastConfirmInput()).toMatchObject({
      paymentToken: NONCE,
      paymentType: 'card',
      paymentProvider: 'POYNT',
      tipAmount: 500,
    });
  });

  it('confirms an opened zero tip rather than falling back to the form', async () => {
    // A zero tip is a real approved amount, not a missing one — it has to
    // survive the snapshot instead of being treated as absent.
    renderWallet(Component, { enableTips: true, tipAmount: 0 });

    expect(await openWallet(elementId)).toMatchObject({
      total: { amount: '25.00' },
    });

    act(() => {
      form?.setValue('tipAmount', 500);
    });
    await authorize(source);

    await waitForOperation('ConfirmCheckoutSession');
    expect(lastConfirmInput()?.tipAmount).toBe(0);
  });

  it('confirms the selected tip when it does not change', async () => {
    renderWallet(Component, { enableTips: true, tipAmount: 500 });

    expect(await openWallet(elementId)).toMatchObject({
      total: { amount: '30.00' },
    });
    const complete = await authorize(source);

    await waitForOperation('ConfirmCheckoutSession');
    expect(lastConfirmInput()).toMatchObject({ tipAmount: 500 });
    expect(complete).toHaveBeenCalledWith();
  });

  it('sends no tip when the session has tips disabled', async () => {
    // A stale tipAmount can linger in form state after tips are turned off.
    renderWallet(Component, { enableTips: false, tipAmount: 500 });

    expect(await openWallet(elementId)).toMatchObject({
      total: { amount: '25.00' },
    });
    await authorize(source);

    await waitForOperation('ConfirmCheckoutSession');
    expect(lastConfirmInput()?.tipAmount).toBeUndefined();
  });
});
