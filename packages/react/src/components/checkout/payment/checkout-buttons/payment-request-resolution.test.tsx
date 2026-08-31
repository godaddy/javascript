import { QueryClient } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type CheckoutFormData,
  checkoutContext,
} from '@/components/checkout/checkout';
import { GoDaddyProvider } from '@/godaddy-provider';
import type { DraftOrder } from '@/types';
import { CreditCardCheckoutButton } from './credit-card/godaddy';
import { SquareCreditCardCheckoutButton } from './credit-card/square';

const mocks = vi.hoisted(() => ({
  latestOrder: { id: 'latest-order' } as DraftOrder,
  flush: vi.fn(),
  buildFromOrder: vi.fn(),
  getNonce: vi.fn(),
  tokenize: vi.fn(),
  confirm: vi.fn(),
}));

vi.mock('@/components/checkout/payment/utils/use-flush-checkout-sync', () => ({
  useFlushCheckoutSync: () => mocks.flush,
}));

vi.mock(
  '@/components/checkout/payment/utils/use-build-payment-request',
  () => ({
    useBuildPaymentRequest: () => ({
      poyntCardRequest: { firstName: 'Stale' },
      squarePaymentRequest: { amount: '1.00' },
      buildPaymentRequestsFromOrder: mocks.buildFromOrder,
    }),
  })
);

vi.mock('@/components/checkout/payment/utils/poynt-provider', () => ({
  usePoyntCollect: () => ({
    collect: { getNonce: mocks.getNonce },
    isLoadingNonce: false,
    setIsLoadingNonce: vi.fn(),
  }),
}));

vi.mock('@/components/checkout/payment/utils/square-provider', () => ({
  useSquare: () => ({
    card: { tokenize: mocks.tokenize },
    isLoading: false,
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
      useConfirmCheckout: () => ({ mutateAsync: mocks.confirm }),
    };
  }
);

function Wrapper({ children }: { children: React.ReactNode }) {
  const form = useForm<CheckoutFormData>({
    defaultValues: { paymentMethod: 'card' } as CheckoutFormData,
  });
  const queryClient = React.useMemo(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
    []
  );

  return (
    <GoDaddyProvider queryClient={queryClient}>
      <checkoutContext.Provider
        value={{
          session: { id: 'session-1' } as never,
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

describe('payment request resolution from the flushed order', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.flush.mockResolvedValue({ latestOrder: mocks.latestOrder });
    mocks.buildFromOrder.mockReturnValue({
      poyntCardRequest: { firstName: 'Latest' },
      squarePaymentRequest: {
        amount: '43.21',
        billingContact: { givenName: 'Latest' },
      },
    });
    mocks.tokenize.mockResolvedValue({ status: 'OK', token: 'square-token' });
    mocks.confirm.mockResolvedValue(undefined);
  });

  it('passes the latest order request to GoDaddy tokenization', async () => {
    render(<CreditCardCheckoutButton />, { wrapper: Wrapper });

    fireEvent.click(screen.getByRole('button', { name: /pay now/i }));

    await waitFor(() => {
      expect(mocks.getNonce).toHaveBeenCalledWith({ firstName: 'Latest' });
    });
    expect(mocks.flush).toHaveBeenCalledWith({
      includeCurrentFormDiff: true,
    });
    expect(mocks.buildFromOrder).toHaveBeenCalledWith(mocks.latestOrder);
    expect(mocks.getNonce.mock.invocationCallOrder[0]).toBeGreaterThan(
      mocks.flush.mock.invocationCallOrder[0]
    );
  });

  it('passes the latest order request to Square before confirmation', async () => {
    render(<SquareCreditCardCheckoutButton />, { wrapper: Wrapper });

    fireEvent.click(screen.getByRole('button', { name: /pay now/i }));

    await waitFor(() => {
      expect(mocks.confirm).toHaveBeenCalledWith({
        paymentToken: 'square-token',
        paymentType: 'card',
        paymentProvider: 'SQUARE',
      });
    });
    expect(mocks.tokenize).toHaveBeenCalledWith({
      amount: '43.21',
      billingContact: { givenName: 'Latest' },
    });
    expect(mocks.tokenize.mock.invocationCallOrder[0]).toBeGreaterThan(
      mocks.flush.mock.invocationCallOrder[0]
    );
    expect(mocks.confirm.mock.invocationCallOrder[0]).toBeGreaterThan(
      mocks.tokenize.mock.invocationCallOrder[0]
    );
  });
});
