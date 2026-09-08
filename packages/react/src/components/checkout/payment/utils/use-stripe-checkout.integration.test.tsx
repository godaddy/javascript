import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { checkoutContext } from '@/components/checkout/checkout';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';
import type { DraftOrder } from '@/types';
import { useStripeCheckout } from './use-stripe-checkout';

const mocks = vi.hoisted(() => ({
  latestOrder: { id: 'latest-order' } as DraftOrder,
  flush: vi.fn(),
  buildFromOrder: vi.fn(),
  createPaymentMethod: vi.fn(),
  handleNextAction: vi.fn(),
  confirm: vi.fn(),
  confirmExpress: vi.fn(),
  setCheckoutErrors: vi.fn(),
  setIsConfirmingCheckout: vi.fn(),
  cardElement: {},
}));

vi.mock('@stripe/react-stripe-js', () => ({
  CardElement: function CardElement() {
    return null;
  },
  useStripe: () => ({
    createPaymentMethod: mocks.createPaymentMethod,
    handleNextAction: mocks.handleNextAction,
  }),
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
        setIsConfirmingCheckout: mocks.setIsConfirmingCheckout,
        setCheckoutErrors: mocks.setCheckoutErrors,
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
    mocks.handleNextAction.mockResolvedValue({
      paymentIntent: { id: 'pi-confirmed' },
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

  it('handles a valid Stripe next step and retries confirmation with the PaymentIntent', async () => {
    mocks.confirm
      .mockRejectedValueOnce(
        new GraphQLErrorWithCodes([
          {
            message: 'Payment requires additional customer action',
            code: 'PAYMENT_ACTION_REQUIRED',
            extensions: {
              paymentResult: {
                status: 'ACTION_REQUIRED',
                provider: 'STRIPE',
                paymentReference: 'pi-confirmed',
                nextStep: {
                  type: 'SDK_ACTION',
                  sdk: 'STRIPE_JS',
                  action: 'HANDLE_NEXT_ACTION',
                  actionId: 'pi-confirmed',
                  clientSecret: 'pi-confirmed-secret',
                },
              },
            },
          },
        ])
      )
      .mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useStripeCheckout({ mode: 'card' }), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mocks.handleNextAction).toHaveBeenCalledWith({
      clientSecret: 'pi-confirmed-secret',
    });
    expect(mocks.confirm).toHaveBeenNthCalledWith(1, {
      paymentToken: 'stripe-payment-method',
      paymentType: 'card',
      paymentProvider: 'STRIPE',
    });
    expect(mocks.confirm).toHaveBeenNthCalledWith(2, {
      paymentToken: 'pi-confirmed',
      paymentType: 'card',
      paymentProvider: 'STRIPE',
    });
    expect(mocks.setIsConfirmingCheckout).not.toHaveBeenCalledWith(false);
  });

  it('does not run Stripe next actions for legacy GraphQL errors without the 3DS extension', async () => {
    mocks.confirm.mockRejectedValueOnce(
      new GraphQLErrorWithCodes([
        {
          message: 'Failed to process transaction',
          code: 'TRANSACTION_PROCESSING_FAILED',
        },
      ])
    );

    const { result } = renderHook(() => useStripeCheckout({ mode: 'card' }), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mocks.handleNextAction).not.toHaveBeenCalled();
    expect(mocks.setCheckoutErrors).toHaveBeenCalledWith([
      'TRANSACTION_PROCESSING_FAILED',
    ]);
    expect(mocks.setIsConfirmingCheckout).toHaveBeenCalledWith(false);
  });

  it('does not run Stripe for malformed action-required extensions', async () => {
    mocks.confirm.mockRejectedValueOnce(
      new GraphQLErrorWithCodes([
        {
          code: 'PAYMENT_ACTION_REQUIRED',
          extensions: {
            paymentResult: {
              status: 'ACTION_REQUIRED',
              provider: 'STRIPE',
              nextStep: {
                type: 'SDK_ACTION',
                sdk: 'STRIPE_JS',
                action: 'HANDLE_NEXT_ACTION',
              },
            },
          },
        },
      ])
    );

    const { result } = renderHook(() => useStripeCheckout({ mode: 'card' }), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mocks.handleNextAction).not.toHaveBeenCalled();
    expect(mocks.setIsConfirmingCheckout).toHaveBeenCalledWith(false);
  });

  it('unlocks checkout when Stripe cannot complete the next action', async () => {
    mocks.confirm.mockRejectedValueOnce(
      new GraphQLErrorWithCodes([
        {
          code: 'PAYMENT_ACTION_REQUIRED',
          extensions: {
            paymentResult: {
              status: 'ACTION_REQUIRED',
              provider: 'STRIPE',
              nextStep: {
                type: 'SDK_ACTION',
                sdk: 'STRIPE_JS',
                action: 'HANDLE_NEXT_ACTION',
                clientSecret: 'pi-secret',
              },
            },
          },
        },
      ])
    );
    mocks.handleNextAction.mockResolvedValueOnce({
      error: { code: 'payment_intent_authentication_failure' },
    });

    const { result } = renderHook(() => useStripeCheckout({ mode: 'card' }), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mocks.confirm).toHaveBeenCalledTimes(1);
    expect(mocks.setCheckoutErrors).toHaveBeenCalledWith([
      'payment_intent_authentication_failure',
    ]);
    expect(mocks.setIsConfirmingCheckout).toHaveBeenCalledWith(false);
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
