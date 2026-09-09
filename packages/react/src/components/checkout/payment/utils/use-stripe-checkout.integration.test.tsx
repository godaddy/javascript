import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { checkoutContext } from '@/components/checkout/checkout';
import type { DraftOrder } from '@/types';
import { useStripeCheckout } from './use-stripe-checkout';

const mocks = vi.hoisted(() => ({
  latestOrder: { id: 'latest-order' } as DraftOrder,
  flush: vi.fn(),
  buildFromOrder: vi.fn(),
  createPaymentMethod: vi.fn(),
  confirm: vi.fn(),
  confirmExpress: vi.fn(),
  cardElement: {},
}));

vi.mock('@stripe/react-stripe-js', () => ({
  CardElement: function CardElement() {
    return null;
  },
  useStripe: () => ({ createPaymentMethod: mocks.createPaymentMethod }),
  useElements: () => ({
    getElement: () => mocks.cardElement,
  }),
}));

vi.mock(
  '@/components/checkout/payment/utils/use-build-payment-request',
  () => ({
    useBuildPaymentRequest: () => ({
      stripePaymentMethodParams: {
        billing_details: { name: 'Stale Buyer' },
      },
      buildPaymentRequestsFromOrder: mocks.buildFromOrder,
    }),
  })
);

vi.mock('@/components/checkout/payment/utils/use-flush-checkout-sync', () => ({
  useFlushCheckoutSync: () => mocks.flush,
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

vi.mock(
  '@/components/checkout/payment/utils/use-confirm-express-checkout',
  () => ({
    useConfirmExpressCheckout: () => ({ mutateAsync: mocks.confirmExpress }),
  })
);

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <checkoutContext.Provider
      value={{
        session: { id: 'session-1' } as never,
        isConfirmingCheckout: false,
        setIsConfirmingCheckout: vi.fn(),
        setCheckoutErrors: vi.fn(),
      }}
    >
      {children}
    </checkoutContext.Provider>
  );
}

describe('useStripeCheckout payment request resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.flush.mockResolvedValue({ latestOrder: mocks.latestOrder });
    mocks.buildFromOrder.mockReturnValue({
      stripePaymentMethodParams: {
        billing_details: { name: 'Latest Buyer' },
      },
    });
    mocks.createPaymentMethod.mockResolvedValue({
      paymentMethod: { id: 'stripe-payment-method' },
    });
    mocks.confirm.mockResolvedValue(undefined);
    mocks.confirmExpress.mockResolvedValue(undefined);
  });

  it('tokenizes card billing from the flushed latest order before confirmation', async () => {
    const { result } = renderHook(() => useStripeCheckout({ mode: 'card' }), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mocks.flush).toHaveBeenCalledWith({
      includeCurrentFormDiff: true,
    });
    expect(mocks.buildFromOrder).toHaveBeenCalledWith(mocks.latestOrder);
    expect(mocks.createPaymentMethod).toHaveBeenCalledWith({
      billing_details: { name: 'Latest Buyer' },
      card: mocks.cardElement,
      type: 'card',
    });
    expect(mocks.confirm).toHaveBeenCalledWith({
      paymentToken: 'stripe-payment-method',
      paymentType: 'card',
      paymentProvider: 'STRIPE',
    });
    expect(mocks.confirm.mock.invocationCallOrder[0]).toBeGreaterThan(
      mocks.createPaymentMethod.mock.invocationCallOrder[0]
    );
  });

  it('tokenizes express billing from the wallet event without flushing form data', async () => {
    const { result } = renderHook(
      () => useStripeCheckout({ mode: 'express' }),
      { wrapper: Wrapper }
    );
    const event = {
      expressPaymentType: 'apple_pay',
      billingDetails: {
        name: 'Wallet Buyer',
        email: 'wallet@example.com',
        phone: null,
        address: {
          line1: '789 Wallet Ave',
          line2: null,
          city: 'Phoenix',
          state: 'AZ',
          postal_code: '85001',
          country: 'US',
        },
      },
    } as never;

    await act(async () => {
      await result.current.handleSubmit({ event });
    });

    expect(mocks.flush).not.toHaveBeenCalled();
    expect(mocks.createPaymentMethod).toHaveBeenCalledWith({
      elements: expect.any(Object),
      params: {
        billing_details: {
          name: 'Wallet Buyer',
          email: 'wallet@example.com',
          phone: undefined,
          address: {
            line1: '789 Wallet Ave',
            line2: undefined,
            city: 'Phoenix',
            state: 'AZ',
            postal_code: '85001',
            country: 'US',
          },
        },
      },
    });
    expect(mocks.confirmExpress).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentToken: 'stripe-payment-method',
        paymentType: 'apple_pay',
        paymentProvider: 'STRIPE',
        isExpress: true,
      })
    );
  });
});
