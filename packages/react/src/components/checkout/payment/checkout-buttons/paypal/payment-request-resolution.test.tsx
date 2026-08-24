import { QueryClient } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { beforeEach, expect, it, vi } from 'vitest';
import {
  type CheckoutFormData,
  checkoutContext,
} from '@/components/checkout/checkout';
import { GoDaddyProvider } from '@/godaddy-provider';
import type { DraftOrder } from '@/types';
import { PayPalCheckoutButton } from './paypal';

const mocks = vi.hoisted(() => ({
  latestOrder: { id: 'latest-order' } as DraftOrder,
  flush: vi.fn(),
  buildFromOrder: vi.fn(),
  createOrder: vi.fn(),
  confirm: vi.fn(),
}));

vi.mock('@paypal/react-paypal-js', () => ({
  FUNDING: { PAYPAL: 'paypal' },
  usePayPalScriptReducer: () => [{ isResolved: true, isPending: false }],
  PayPalButtons: (props: {
    onClick: (data: unknown, actions: unknown) => Promise<unknown>;
    createOrder: (data: unknown, actions: unknown) => Promise<string>;
    onApprove: (data: unknown, actions: unknown) => Promise<void>;
  }) => (
    <button
      type='button'
      onClick={async () => {
        await props.onClick(
          {},
          {
            resolve: () => true,
            reject: () => false,
          }
        );
        await props.createOrder(
          {},
          {
            order: { create: mocks.createOrder },
          }
        );
        await props.onApprove(
          {},
          {
            order: {
              get: async () => ({
                id: 'paypal-order',
                payer: { payer_id: 'paypal-payer' },
              }),
            },
          }
        );
      }}
    >
      PayPal SDK button
    </button>
  ),
}));

vi.mock('@/components/checkout/payment/utils/use-flush-checkout-sync', () => ({
  useFlushCheckoutSync: () => mocks.flush,
}));

vi.mock(
  '@/components/checkout/payment/utils/use-build-payment-request',
  () => ({
    useBuildPaymentRequest: () => ({
      payPalRequest: { purchase_units: [{ amount: { value: '1.00' } }] },
      buildPaymentRequestsFromOrder: mocks.buildFromOrder,
    }),
  })
);

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
    defaultValues: { deliveryMethod: 'PURCHASE' } as CheckoutFormData,
  });
  const queryClient = React.useMemo(() => new QueryClient(), []);

  return (
    <GoDaddyProvider queryClient={queryClient}>
      <checkoutContext.Provider
        value={{
          session: { id: 'session-1' } as never,
          paypalConfig: { clientId: 'paypal-client' },
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
  mocks.flush.mockResolvedValue({ latestOrder: mocks.latestOrder });
  mocks.buildFromOrder.mockReturnValue({
    payPalRequest: {
      purchase_units: [
        {
          amount: { currency_code: 'USD', value: '43.21' },
          billing: { name: { full_name: 'Latest Buyer' } },
        },
      ],
    },
  });
  mocks.createOrder.mockResolvedValue('paypal-order');
  mocks.confirm.mockResolvedValue(undefined);
});

it('creates and confirms PayPal with the request from the flushed latest order', async () => {
  render(<PayPalCheckoutButton />, { wrapper: Wrapper });

  fireEvent.click(screen.getByRole('button', { name: /paypal sdk button/i }));

  await waitFor(() => {
    expect(mocks.confirm).toHaveBeenCalledWith({
      paymentToken: 'paypal-order:paypal-payer',
      paymentType: 'paypal',
      paymentProvider: 'PAYPAL',
    });
  });
  expect(mocks.flush).toHaveBeenCalledWith({ includeCurrentFormDiff: true });
  expect(mocks.buildFromOrder).toHaveBeenCalledWith(mocks.latestOrder);
  expect(mocks.createOrder).toHaveBeenCalledWith({
    purchase_units: [
      {
        amount: { currency_code: 'USD', value: '43.21' },
        billing: { name: { full_name: 'Latest Buyer' } },
      },
    ],
    application_context: { shipping_preference: 'SET_PROVIDED_ADDRESS' },
  });
  expect(mocks.createOrder.mock.invocationCallOrder[0]).toBeGreaterThan(
    mocks.flush.mock.invocationCallOrder[0]
  );
  expect(mocks.confirm.mock.invocationCallOrder[0]).toBeGreaterThan(
    mocks.createOrder.mock.invocationCallOrder[0]
  );
});
