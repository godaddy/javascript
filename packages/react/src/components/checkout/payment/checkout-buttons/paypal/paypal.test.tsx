import { act, render, waitFor } from '@testing-library/react';
import { FormProvider, type UseFormReturn, useForm } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The real SDK renders its buttons in a cross-origin iframe and drives the flow
// from a popup, neither of which exists in jsdom. This mock hands the props
// PayPal would call back to the test so it can drive the flow itself. It has to
// live here rather than in the shared harness: the harness stubs the whole
// button component out, which is what these tests exercise.
vi.mock('@paypal/react-paypal-js', () => ({
  PayPalScriptProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  FUNDING: { PAYPAL: 'paypal' },
  usePayPalScriptReducer: () => [
    { isResolved: true, isPending: false, isInitial: false, isRejected: false },
    () => undefined,
  ],
  PayPalButtons: (props: PayPalButtonsMockProps) => {
    payPalButtonsProps = props;
    return <button type='button'>PayPal mock</button>;
  },
}));

import {
  type CheckoutFormData,
  checkoutContext,
} from '@/components/checkout/checkout';
import { DraftOrderSyncProvider } from '@/components/checkout/order/draft-order-sync-provider';
import { PayPalCheckoutButton } from '@/components/checkout/payment/checkout-buttons/paypal/paypal';
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

interface PayPalOrderActions {
  order: {
    create: (order: Record<string, unknown>) => Promise<string>;
    get: () => Promise<{ id: string; payer: { payer_id: string } }>;
  };
}

interface PayPalButtonsMockProps {
  disabled?: boolean;
  createOrder?: (data: unknown, actions: PayPalOrderActions) => Promise<string>;
  onApprove?: (data: unknown, actions: PayPalOrderActions) => Promise<void>;
}

let payPalButtonsProps: PayPalButtonsMockProps | undefined;

function getPayPalButtonsProps() {
  if (!payPalButtonsProps) {
    throw new Error('PayPalButtons has not rendered');
  }
  return payPalButtonsProps;
}

const noop = () => undefined;

const PAYPAL_ORDER_ID = 'paypal-order-1';

let form: UseFormReturn<CheckoutFormData> | undefined;

function renderPayPalButton({ enableTips = true, tipAmount = 0 } = {}) {
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
              <PayPalCheckoutButton />
            </DraftOrderSyncProvider>
          </FormProvider>
        </checkoutContext.Provider>
      </GoDaddyProvider>
    );
  }

  return render(<Harness />);
}

// PayPal calls `createOrder` when the buyer opens the popup and `onApprove`
// after they approve inside it — two separate round trips, with the page still
// live in between.
function payPalActions(createdOrders: Array<Record<string, unknown>>) {
  return {
    order: {
      create: async (order: Record<string, unknown>) => {
        createdOrders.push(order);
        return PAYPAL_ORDER_ID;
      },
      get: async () => ({
        id: PAYPAL_ORDER_ID,
        payer: { payer_id: 'payer-1' },
      }),
    },
  } satisfies PayPalOrderActions;
}

function tipMinorUnitsInOrder(order: Record<string, unknown>) {
  const purchaseUnit = (
    order.purchase_units as Array<{
      items?: Array<{ name: string; unit_amount: { value: string } }>;
    }>
  )[0];
  const tipItem = purchaseUnit?.items?.find(item => item.name === 'Tip');
  return tipItem ? Math.round(Number(tipItem.unit_amount.value) * 100) : 0;
}

function confirmInput() {
  return getOperations('ConfirmCheckoutSession').at(-1)?.input as
    | Record<string, unknown>
    | undefined;
}

describe('PayPalCheckoutButton', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    setupCheckoutTestGlobals();
    form = undefined;
    payPalButtonsProps = undefined;
  });

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
    vi.restoreAllMocks();
    restoreWindowLocation();
  });

  it('confirms with the tip PayPal authorized, not a tip chosen afterwards', async () => {
    // The popup stays open across `createOrder` → `onApprove`, so the tip
    // control can move underneath it. Confirming with the current form value
    // would charge the authorized amount but record a different tip.
    renderPayPalButton({ enableTips: true, tipAmount: 500 });
    const createdOrders: Array<Record<string, unknown>> = [];

    await act(async () => {
      await getPayPalButtonsProps().createOrder?.(
        {},
        payPalActions(createdOrders)
      );
    });

    expect(tipMinorUnitsInOrder(createdOrders[0])).toBe(500);

    act(() => {
      form?.setValue('tipAmount', 100);
    });

    await act(async () => {
      await getPayPalButtonsProps().onApprove?.(
        {},
        payPalActions(createdOrders)
      );
    });

    await waitFor(() => {
      expect(confirmInput()).toBeDefined();
    });
    expect(confirmInput()).toMatchObject({
      paymentToken: `${PAYPAL_ORDER_ID}:payer-1`,
      paymentType: 'paypal',
      tipAmount: 500,
    });
  });

  it('confirms with the selected tip when it does not change', async () => {
    renderPayPalButton({ enableTips: true, tipAmount: 500 });
    const createdOrders: Array<Record<string, unknown>> = [];

    await act(async () => {
      await getPayPalButtonsProps().createOrder?.(
        {},
        payPalActions(createdOrders)
      );
      await getPayPalButtonsProps().onApprove?.({}, payPalActions([]));
    });

    await waitFor(() => {
      expect(confirmInput()).toMatchObject({ tipAmount: 500 });
    });
  });

  it('sends no tip when the session has tips disabled', async () => {
    // A stale tipAmount can linger in form state after tips are turned off.
    renderPayPalButton({ enableTips: false, tipAmount: 500 });
    const createdOrders: Array<Record<string, unknown>> = [];

    await act(async () => {
      await getPayPalButtonsProps().createOrder?.(
        {},
        payPalActions(createdOrders)
      );
      await getPayPalButtonsProps().onApprove?.({}, payPalActions([]));
    });

    await waitFor(() => {
      expect(confirmInput()).toBeDefined();
    });
    expect(tipMinorUnitsInOrder(createdOrders[0])).toBe(0);
    expect(confirmInput()?.tipAmount).toBeUndefined();
  });
});
