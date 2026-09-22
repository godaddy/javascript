import { act, render, waitFor } from '@testing-library/react';
import { FormProvider, type UseFormReturn, useForm } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The real SDK mounts its card inputs in cross-origin iframes and drives
// tokenisation and 3DS itself, none of which exists in jsdom. This mock hands
// the props PayPal would call back to the test so it can drive the flow itself.
// It has to live here rather than in the shared harness, which stubs whole
// payment components out.
vi.mock('@paypal/react-paypal-js', () => {
  // Stable across renders — `PayPalCardFieldsFormContent` keys an effect on it.
  const cardFieldsForm = { submit: async () => undefined };

  return {
    PayPalScriptProvider: ({ children }: { children: React.ReactNode }) =>
      children,
    usePayPalScriptReducer: () => [
      {
        isResolved: true,
        isPending: false,
        isInitial: false,
        isRejected: false,
      },
      () => undefined,
    ],
    usePayPalCardFields: () => ({ cardFieldsForm }),
    PayPalCardFieldsForm: () => <div data-testid='card-fields' />,
    PayPalCardFieldsProvider: (props: PayPalCardFieldsProviderMockProps) => {
      cardFieldsProviderProps = props;
      return props.children;
    },
  };
});

import {
  type CheckoutFormData,
  checkoutContext,
} from '@/components/checkout/checkout';
import { DraftOrderSyncProvider } from '@/components/checkout/order/draft-order-sync-provider';
import { PayPalCreditCardForm } from '@/components/checkout/payment/payment-methods/credit-card/paypal';
import { PayPalProvider } from '@/components/checkout/payment/utils/paypal-provider';
import { GoDaddyProvider } from '@/godaddy-provider';
import {
  buildCheckoutSession,
  buildDraftOrder,
  createTestQueryClient,
  getOperations,
  mockGodaddyApi,
  restoreWindowLocation,
  setupCheckoutTestGlobals,
} from '../../../__tests__/checkout-test-utils';

interface PayPalCardFieldsProviderMockProps {
  children?: React.ReactNode;
  createOrder?: () => Promise<string>;
  onApprove?: (data: { orderID: string }) => Promise<void>;
}

let cardFieldsProviderProps: PayPalCardFieldsProviderMockProps | undefined;

function getCardFieldsProps() {
  if (!cardFieldsProviderProps) {
    throw new Error('PayPalCardFieldsProvider has not rendered');
  }
  return cardFieldsProviderProps;
}

const noop = () => undefined;

const PAYPAL_ORDER_ID = 'paypal-order-1';

let form: UseFormReturn<CheckoutFormData> | undefined;

function renderPayPalCardFields({ enableTips = true, tipAmount = 0 } = {}) {
  const session = buildCheckoutSession({ enableTips });
  const draftOrder = buildDraftOrder();
  mockGodaddyApi({ session, draftOrder });
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
            paypalConfig: { clientId: 'client-1', merchantId: 'merchant-1' },
            isConfirmingCheckout: false,
            setIsConfirmingCheckout: noop,
            checkoutErrors: undefined,
            setCheckoutErrors: noop,
          }}
        >
          <FormProvider {...methods}>
            <DraftOrderSyncProvider>
              <PayPalProvider>
                <PayPalCreditCardForm />
              </PayPalProvider>
            </DraftOrderSyncProvider>
          </FormProvider>
        </checkoutContext.Provider>
      </GoDaddyProvider>
    );
  }

  return render(<Harness />);
}

// PayPal calls `createOrder` to authorize, then `onApprove` once the card has
// been tokenized and any 3DS challenge has cleared — two separate round trips,
// with the page still live in between.
async function createOrder() {
  return await getCardFieldsProps().createOrder?.();
}

async function approve() {
  await getCardFieldsProps().onApprove?.({ orderID: PAYPAL_ORDER_ID });
}

function lastInput(op: 'AuthorizeCheckoutSession' | 'ConfirmCheckoutSession') {
  return getOperations(op).at(-1)?.input as Record<string, unknown> | undefined;
}

describe('PayPalCreditCardForm', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    setupCheckoutTestGlobals();
    form = undefined;
    cardFieldsProviderProps = undefined;
  });

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
    vi.restoreAllMocks();
    restoreWindowLocation();
  });

  it('confirms with the authorized tip, not one that changed before approval', async () => {
    // Tokenisation and 3DS sit between `createOrder` and `onApprove`, and the
    // tip can move on its own across that gap — a percentage preset re-derives
    // itself whenever the draft-order subtotal settles. Confirming with the
    // current form value would capture a different tip than was authorized.
    renderPayPalCardFields({ enableTips: true, tipAmount: 500 });

    await act(async () => {
      await createOrder();
    });

    expect(lastInput('AuthorizeCheckoutSession')).toMatchObject({
      tipAmount: 500,
    });

    act(() => {
      form?.setValue('tipAmount', 100);
    });

    await act(async () => {
      await approve();
    });

    await waitFor(() => {
      expect(lastInput('ConfirmCheckoutSession')).toBeDefined();
    });
    expect(lastInput('ConfirmCheckoutSession')).toMatchObject({
      paymentToken: PAYPAL_ORDER_ID,
      paymentType: 'card',
      paymentProvider: 'PAYPAL',
      tipAmount: 500,
    });
  });

  it('authorizes and confirms the same tip when it changes during the flush', async () => {
    // `useAuthorizeCheckout` awaits the sync flush before reading the tip, so
    // the value it sends is not the one the form held at the click. Confirm has
    // to follow what was authorized rather than either earlier read.
    renderPayPalCardFields({ enableTips: true, tipAmount: 500 });

    await act(async () => {
      const created = createOrder();
      form?.setValue('tipAmount', 100);
      await created;
    });

    expect(lastInput('AuthorizeCheckoutSession')).toMatchObject({
      tipAmount: 100,
    });

    act(() => {
      form?.setValue('tipAmount', 900);
    });

    await act(async () => {
      await approve();
    });

    await waitFor(() => {
      expect(lastInput('ConfirmCheckoutSession')).toBeDefined();
    });
    expect(lastInput('ConfirmCheckoutSession')).toMatchObject({
      tipAmount: 100,
    });
  });

  it('confirms an authorized zero tip rather than falling back to the form', async () => {
    // A zero tip is a real authorized amount, not a missing one — it has to
    // survive the snapshot instead of being treated as absent.
    renderPayPalCardFields({ enableTips: true, tipAmount: 0 });

    await act(async () => {
      await createOrder();
    });

    expect(lastInput('AuthorizeCheckoutSession')).toMatchObject({
      tipAmount: 0,
    });

    act(() => {
      form?.setValue('tipAmount', 100);
    });

    await act(async () => {
      await approve();
    });

    await waitFor(() => {
      expect(lastInput('ConfirmCheckoutSession')).toBeDefined();
    });
    expect(lastInput('ConfirmCheckoutSession')?.tipAmount).toBe(0);
  });

  it('confirms with the selected tip when it does not change', async () => {
    renderPayPalCardFields({ enableTips: true, tipAmount: 500 });

    await act(async () => {
      await createOrder();
      await approve();
    });

    await waitFor(() => {
      expect(lastInput('ConfirmCheckoutSession')).toMatchObject({
        tipAmount: 500,
      });
    });
  });

  it('sends no tip when the session has tips disabled', async () => {
    // A stale tipAmount can linger in form state after tips are turned off.
    renderPayPalCardFields({ enableTips: false, tipAmount: 500 });

    await act(async () => {
      await createOrder();
      await approve();
    });

    await waitFor(() => {
      expect(lastInput('ConfirmCheckoutSession')).toBeDefined();
    });
    expect(lastInput('AuthorizeCheckoutSession')?.tipAmount).toBeUndefined();
    expect(lastInput('ConfirmCheckoutSession')?.tipAmount).toBeUndefined();
  });
});
