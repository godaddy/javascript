import { QueryClient } from '@tanstack/react-query';
import { act, render, waitFor } from '@testing-library/react';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type CheckoutFormData,
  checkoutContext,
} from '@/components/checkout/checkout';
import { GoDaddyProvider } from '@/godaddy-provider';
import type { DraftOrder } from '@/types';
import { GoDaddyApplePayCheckoutButton } from './applePay/godaddy';
import { GoDaddyGooglePayCheckoutButton } from './googlePay/godaddy';
import { PazeCheckoutButton } from './paze/godaddy';

const mocks = vi.hoisted(() => ({
  latestOrder: { id: 'latest-order' } as DraftOrder,
  flush: vi.fn(),
  buildFromOrder: vi.fn(),
  startApplePaySession: vi.fn(),
  startGooglePaySession: vi.fn(),
  startPazeSession: vi.fn(),
  walletClickHandlers: new Map<string, () => Promise<void>>(),
}));

vi.mock('@/components/checkout/payment/utils/use-flush-checkout-sync', () => ({
  useFlushCheckoutSync: () => mocks.flush,
}));

vi.mock(
  '@/components/checkout/payment/utils/use-build-payment-request',
  () => ({
    useBuildPaymentRequest: () => ({
      poyntStandardRequest: { total: { amount: '1.00' } },
      buildPaymentRequestsFromOrder: mocks.buildFromOrder,
    }),
  })
);

vi.mock('@/components/checkout/payment/utils/use-load-poynt-collect', () => ({
  useLoadPoyntCollect: () => ({ isPoyntLoaded: true }),
}));

vi.mock('@/components/checkout/order/use-draft-order', () => ({
  useDraftOrderTotals: () => ({
    data: { total: { value: 100, currencyCode: 'USD' } },
  }),
}));

vi.mock('@/components/checkout/payment/utils/use-is-payment-disabled', () => ({
  useIsPaymentDisabled: () => false,
}));

vi.mock(
  '@/components/checkout/payment/utils/use-confirm-checkout',
  async () => {
    const actual = await vi.importActual<
      typeof import('@/components/checkout/payment/utils/use-confirm-checkout')
    >('@/components/checkout/payment/utils/use-confirm-checkout');
    return {
      ...actual,
      useConfirmCheckout: () => ({ mutateAsync: vi.fn() }),
    };
  }
);

class MockTokenizeJs {
  async supportWalletPayments() {
    return { applePay: true, googlePay: true, paze: true };
  }

  mount(
    id: string,
    _document: Document,
    options: { buttonOptions?: { onClick?: () => Promise<void> } }
  ) {
    if (options.buttonOptions?.onClick) {
      mocks.walletClickHandlers.set(id, options.buttonOptions.onClick);
    }
  }

  on(_eventName: string, _handler: (event: unknown) => void) {
    return undefined;
  }

  startApplePaySession(request: unknown) {
    mocks.startApplePaySession(request);
  }

  startGooglePaySession(request: unknown) {
    mocks.startGooglePaySession(request);
  }

  startPazeSession(request: unknown) {
    mocks.startPazeSession(request);
  }
}

function Wrapper({ children }: { children: React.ReactNode }) {
  const form = useForm<CheckoutFormData>({
    defaultValues: { paymentMethod: 'card' } as CheckoutFormData,
  });
  const queryClient = React.useMemo(() => new QueryClient(), []);

  return (
    <GoDaddyProvider queryClient={queryClient}>
      <checkoutContext.Provider
        value={{
          session: {
            id: 'session-1',
            storeId: 'store-1',
            channelId: 'channel-1',
            businessId: 'business-1',
            storeName: 'Test Store',
            shipping: { originAddress: { countryCode: 'US' } },
          } as never,
          godaddyPaymentsConfig: { appId: 'app-1', businessId: 'business-1' },
          isConfirmingCheckout: false,
          setIsConfirmingCheckout: vi.fn(),
          setCheckoutErrors: vi.fn(),
        }}
      >
        <FormProvider {...form}>{children}</FormProvider>
      </checkoutContext.Provider>
    </GoDaddyProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.walletClickHandlers.clear();
  mocks.flush.mockResolvedValue({ latestOrder: mocks.latestOrder });
  mocks.buildFromOrder.mockReturnValue({
    poyntStandardRequest: { total: { amount: '43.21' } },
  });
  window.TokenizeJs = MockTokenizeJs as never;
});

describe.each([
  {
    name: 'Apple Pay',
    Component: GoDaddyApplePayCheckoutButton,
    elementId: 'apple-pay-element',
    start: mocks.startApplePaySession,
  },
  {
    name: 'Google Pay',
    Component: GoDaddyGooglePayCheckoutButton,
    elementId: 'google-pay-element',
    start: mocks.startGooglePaySession,
  },
  {
    name: 'Paze',
    Component: PazeCheckoutButton,
    elementId: 'paze-pay-element',
    start: mocks.startPazeSession,
  },
])('$name request resolution', ({ Component, elementId, start }) => {
  it('starts the wallet with totals from the flushed latest order', async () => {
    render(<Component />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(mocks.walletClickHandlers.has(elementId)).toBe(true);
    });
    await act(async () => {
      await mocks.walletClickHandlers.get(elementId)?.();
    });

    expect(mocks.flush).toHaveBeenCalledWith({
      includeCurrentFormDiff: true,
    });
    expect(mocks.buildFromOrder).toHaveBeenCalledWith(mocks.latestOrder);
    expect(start).toHaveBeenCalledWith({ total: { amount: '43.21' } });
    expect(start.mock.invocationCallOrder[0]).toBeGreaterThan(
      mocks.flush.mock.invocationCallOrder[0]
    );
  });
});
