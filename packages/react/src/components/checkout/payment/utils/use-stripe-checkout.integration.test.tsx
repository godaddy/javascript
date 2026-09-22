import type { StripeExpressCheckoutElementConfirmEvent } from '@stripe/stripe-js';
import { act, render, renderHook } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { checkoutContext } from '@/components/checkout/checkout';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';
import { eventIds } from '@/tracking/events';
import type { DraftOrder } from '@/types';
import { StripeProvider } from './stripe-provider';
import { CheckoutConfirmationBlockedError } from './use-confirm-checkout';
import { useStripeCheckout } from './use-stripe-checkout';

const mocks = vi.hoisted(() => ({
  sessionId: 'session-1',
  latestOrder: { id: 'latest-order' } as DraftOrder,
  flush: vi.fn(),
  buildFromOrder: vi.fn(),
  createPaymentMethod: vi.fn(),
  handleNextAction: vi.fn(),
  confirm: vi.fn(),
  confirmExpress: vi.fn(),
  setCheckoutErrors: vi.fn(),
  setIsConfirmingCheckout: vi.fn(),
  track: vi.fn(),
  cardElement: {},
}));

vi.mock('@/tracking/track', () => ({
  track: mocks.track,
  TrackingEventType: { EVENT: 'event' },
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
        session: { id: mocks.sessionId } as never,
        isConfirmingCheckout: false,
        setIsConfirmingCheckout: mocks.setIsConfirmingCheckout,
        setCheckoutErrors: mocks.setCheckoutErrors,
      }}
    >
      <StripeProvider>{children}</StripeProvider>
    </checkoutContext.Provider>
  );
}

function actionRequiredError() {
  return new GraphQLErrorWithCodes([
    {
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
            clientSecret: 'pi-secret',
          },
        },
      },
    },
  ]);
}

describe('useStripeCheckout payment request resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sessionId = 'session-1';
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
      paymentIntent: { id: 'pi-confirmed', status: 'succeeded' },
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

  it.each([
    ['card', undefined],
    ['express', 'apple_pay'],
    ['express', 'google_pay'],
    ['express', 'link'],
  ] as const)(
    'ignores a duplicate %s %s submission without affecting the active payment',
    async (mode, expressPaymentType) => {
      let finish!: () => void;
      const active = new Promise<void>(resolve => {
        finish = resolve;
      });
      const confirm = mode === 'card' ? mocks.confirm : mocks.confirmExpress;
      confirm.mockReturnValueOnce(active);
      const { result } = renderHook(() => useStripeCheckout({ mode }), {
        wrapper: Wrapper,
      });
      const expressData =
        mode === 'express'
          ? {
              event: {
                expressPaymentType,
              } as StripeExpressCheckoutElementConfirmEvent,
            }
          : undefined;
      let first!: ReturnType<typeof result.current.handleSubmit>;
      await act(async () => {
        first = result.current.handleSubmit(expressData);
      });
      expect(confirm).toHaveBeenCalledTimes(1);

      await act(async () => {
        await expect(
          result.current.handleSubmit(expressData)
        ).resolves.toBeUndefined();
      });
      expect(mocks.createPaymentMethod).toHaveBeenCalledTimes(1);
      expect(confirm).toHaveBeenCalledTimes(1);
      expect(result.current.isProcessingPayment).toBe(true);
      expect(mocks.setCheckoutErrors).not.toHaveBeenCalled();
      expect(mocks.setIsConfirmingCheckout).not.toHaveBeenCalled();
      expect(mocks.track).not.toHaveBeenCalled();

      await act(async () => {
        finish();
        await first;
      });
      expect(result.current.isProcessingPayment).toBe(false);
      if (mode === 'express') {
        expect(mocks.track).toHaveBeenCalledTimes(1);
        expect(mocks.track).toHaveBeenCalledWith(
          expect.objectContaining({
            eventId: eventIds.expressCheckoutCompleted,
            properties: { paymentType: expressPaymentType, provider: 'stripe' },
          })
        );
      }
    }
  );

  it.each(['card', 'express'] as const)(
    'does not unlock checkout when a %s confirmation belongs to another submission',
    async mode => {
      const blocked = new CheckoutConfirmationBlockedError(
        'Checkout confirmation is already in progress'
      );
      const confirm = mode === 'card' ? mocks.confirm : mocks.confirmExpress;
      confirm.mockRejectedValueOnce(blocked);
      const { result } = renderHook(() => useStripeCheckout({ mode }), {
        wrapper: Wrapper,
      });
      await act(async () => {
        if (mode === 'express') {
          await expect(result.current.handleSubmit()).rejects.toBe(blocked);
        } else {
          await result.current.handleSubmit();
        }
      });
      expect(mocks.setCheckoutErrors).not.toHaveBeenCalled();
      expect(mocks.setIsConfirmingCheckout).not.toHaveBeenCalled();
      expect(result.current.isProcessingPayment).toBe(false);
    }
  );

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
              paymentReference: 'pi-confirmed',
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
      'AUTHORIZATION_FAILED',
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
  it.each([
    'requires_payment_method',
    'requires_action',
    'canceled',
    undefined,
  ])('does not retry confirmation for intent status %s', async status => {
    mocks.confirm.mockRejectedValueOnce(actionRequiredError());
    mocks.handleNextAction.mockResolvedValueOnce({
      paymentIntent: { id: 'pi-confirmed', status },
    });
    const { result } = renderHook(() => useStripeCheckout({ mode: 'card' }), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(mocks.confirm).toHaveBeenCalledTimes(1);
    expect(mocks.setCheckoutErrors).toHaveBeenCalledWith([
      'AUTHORIZATION_FAILED',
    ]);
    expect(mocks.setIsConfirmingCheckout).toHaveBeenCalledWith(false);
  });

  it.each([
    'succeeded',
    'processing',
    'requires_capture',
    'requires_confirmation',
  ])(
    'lets the server decide payment completion after SDK status %s',
    async status => {
      mocks.confirm.mockRejectedValueOnce(actionRequiredError());
      mocks.handleNextAction.mockResolvedValueOnce({
        paymentIntent: { id: 'pi-confirmed', status },
      });
      const { result } = renderHook(() => useStripeCheckout({ mode: 'card' }), {
        wrapper: Wrapper,
      });
      await act(async () => {
        await result.current.handleSubmit();
      });
      expect(mocks.confirm).toHaveBeenCalledTimes(2);
      expect(mocks.confirm).toHaveBeenLastCalledWith(
        expect.objectContaining({ paymentToken: 'pi-confirmed' })
      );
      expect(mocks.setCheckoutErrors).not.toHaveBeenCalled();
    }
  );

  it.each([
    ['network failure', new Error('Failed to fetch')],
    [
      'backend failure',
      new GraphQLErrorWithCodes([{ code: 'TRANSACTION_PROCESSING_FAILED' }]),
    ],
  ])(
    'reuses the authenticated intent across retries after %s',
    async (_, error) => {
      mocks.confirm
        .mockRejectedValueOnce(actionRequiredError())
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(undefined);
      const { result, rerender } = renderHook(
        () => useStripeCheckout({ mode: 'card' }),
        {
          wrapper: Wrapper,
        }
      );

      await act(async () => {
        await result.current.handleSubmit();
      });
      expect(mocks.setIsConfirmingCheckout).toHaveBeenCalledWith(false);
      expect(result.current.isProcessingPayment).toBe(false);
      rerender();
      await act(async () => {
        await result.current.handleSubmit();
      });
      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(
        mocks.confirm.mock.calls.map(([input]) => input.paymentToken)
      ).toEqual([
        'stripe-payment-method',
        'pi-confirmed',
        'pi-confirmed',
        'pi-confirmed',
      ]);
      expect(mocks.createPaymentMethod).toHaveBeenCalledTimes(1);
      expect(mocks.handleNextAction).toHaveBeenCalledTimes(1);
      expect(result.current.isProcessingPayment).toBe(false);
    }
  );

  it('does not reuse an authenticated intent in another checkout session', async () => {
    mocks.confirm
      .mockRejectedValueOnce(actionRequiredError())
      .mockRejectedValueOnce(new Error('Failed to fetch'));
    const { result, rerender } = renderHook(
      () => useStripeCheckout({ mode: 'card' }),
      {
        wrapper: Wrapper,
      }
    );
    await act(async () => {
      await result.current.handleSubmit();
    });
    mocks.sessionId = 'session-2';
    rerender();
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(mocks.confirm).toHaveBeenLastCalledWith(
      expect.objectContaining({ paymentToken: 'stripe-payment-method' })
    );
    expect(mocks.createPaymentMethod).toHaveBeenCalledTimes(2);
  });

  it.each(['rejected promise', 'SDK error result'])(
    'reconciles the original intent after an SDK transport failure: %s',
    async failure => {
      mocks.confirm.mockRejectedValueOnce(actionRequiredError());
      if (failure === 'rejected promise') {
        mocks.handleNextAction.mockRejectedValueOnce(
          new Error('Connection lost')
        );
      } else {
        mocks.handleNextAction.mockResolvedValueOnce({
          error: { type: 'api_connection_error' },
        });
      }
      const { result } = renderHook(() => useStripeCheckout({ mode: 'card' }), {
        wrapper: Wrapper,
      });
      await act(async () => {
        await result.current.handleSubmit();
      });
      expect(mocks.setIsConfirmingCheckout).toHaveBeenCalledWith(false);
      await act(async () => {
        await result.current.handleSubmit();
      });
      expect(
        mocks.confirm.mock.calls.map(([input]) => input.paymentToken)
      ).toEqual(['stripe-payment-method', 'pi-confirmed']);
      expect(mocks.createPaymentMethod).toHaveBeenCalledTimes(1);
    }
  );

  it.each(['requires_payment_method', 'canceled'])(
    'allows a replacement only after Stripe reports the saved intent as %s',
    async status => {
      mocks.confirm.mockRejectedValueOnce(actionRequiredError());
      mocks.handleNextAction.mockResolvedValueOnce({
        error: {
          code: 'payment_intent_authentication_failure',
          payment_intent: { id: 'pi-confirmed', status },
        },
      });
      const { result } = renderHook(() => useStripeCheckout({ mode: 'card' }), {
        wrapper: Wrapper,
      });
      await act(async () => {
        await result.current.handleSubmit();
      });
      await act(async () => {
        await result.current.handleSubmit();
      });
      expect(mocks.createPaymentMethod).toHaveBeenCalledTimes(2);
      expect(mocks.confirm).toHaveBeenLastCalledWith(
        expect.objectContaining({ paymentToken: 'stripe-payment-method' })
      );
    }
  );
});

describe('Stripe express verification', () => {
  const expressData = {
    event: {
      expressPaymentType: 'google_pay',
      billingDetails: { name: 'Wallet Buyer', email: 'buyer@example.com' },
      shippingAddress: {
        name: 'Wallet Buyer',
        address: {
          line1: '123 Main St',
          city: 'Austin',
          state: 'TX',
          postal_code: '78701',
          country: 'US',
        },
      },
    } as StripeExpressCheckoutElementConfirmEvent,
    shippingTotal: { currencyCode: 'USD', value: 500 },
    selectedShippingMethod: {
      displayName: 'Standard',
      carrierCode: 'carrier',
      serviceCode: 'standard',
      cost: null,
      description: null,
      features: null,
      maxDeliveryDate: null,
      minDeliveryDate: null,
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    mocks.sessionId = 'session-1';
    mocks.createPaymentMethod.mockResolvedValue({
      paymentMethod: {
        id: 'pm_wallet',
        card: { wallet: { type: 'google_pay' } },
      },
    });
    mocks.handleNextAction.mockResolvedValue({
      paymentIntent: { id: 'pi-confirmed', status: 'succeeded' },
    });
    mocks.confirmExpress.mockResolvedValue(undefined);
  });

  it.each([
    'succeeded',
    'processing',
    'requires_capture',
    'requires_confirmation',
  ])(
    'resumes the express intent after %s and preserves the wallet payload',
    async status => {
      mocks.confirmExpress.mockRejectedValueOnce(actionRequiredError());
      mocks.handleNextAction.mockResolvedValueOnce({
        paymentIntent: { id: 'pi-confirmed', status },
      });
      const { result } = renderHook(
        () => useStripeCheckout({ mode: 'express' }),
        { wrapper: Wrapper }
      );
      await act(async () => {
        await result.current.handleSubmit(expressData);
      });
      expect(mocks.handleNextAction).toHaveBeenCalledWith({
        clientSecret: 'pi-secret',
      });
      expect(mocks.confirmExpress).toHaveBeenCalledTimes(2);
      const initialInput = mocks.confirmExpress.mock.calls[0][0];
      expect(initialInput).toMatchObject({
        paymentToken: 'pm_wallet',
        paymentType: 'google_pay',
        paymentProvider: 'STRIPE',
        isExpress: true,
        billing: { email: 'buyer@example.com' },
        shipping: { address: { addressLine1: '123 Main St' } },
        shippingTotal: { currencyCode: 'USD', value: 500 },
        shippingLines: [{ name: 'Standard' }],
      });
      expect(mocks.confirmExpress.mock.calls[1][0]).toEqual({
        ...initialInput,
        paymentToken: 'pi-confirmed',
      });
      expect(mocks.createPaymentMethod).toHaveBeenCalledTimes(1);
      expect(mocks.setCheckoutErrors).not.toHaveBeenCalled();
      expect(mocks.track).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: eventIds.expressCheckoutCompleted,
          properties: { paymentType: 'google_pay', provider: 'stripe' },
        })
      );
    }
  );

  it('ignores secondary submissions throughout the challenge and final confirmation', async () => {
    mocks.confirmExpress.mockRejectedValueOnce(actionRequiredError());
    let completeChallenge!: (value: unknown) => void;
    mocks.handleNextAction.mockReturnValueOnce(
      new Promise(resolve => {
        completeChallenge = resolve;
      })
    );
    let completeConfirmation!: () => void;
    mocks.confirmExpress.mockReturnValueOnce(
      new Promise<void>(resolve => {
        completeConfirmation = resolve;
      })
    );
    const { result } = renderHook(
      () => useStripeCheckout({ mode: 'express' }),
      { wrapper: Wrapper }
    );
    let submission!: ReturnType<typeof result.current.handleSubmit>;
    await act(async () => {
      submission = result.current.handleSubmit(expressData);
    });
    await act(async () => {
      await result.current.handleSubmit(expressData);
    });
    expect(mocks.confirmExpress).toHaveBeenCalledTimes(1);
    expect(result.current.isProcessingPayment).toBe(true);
    await act(async () => {
      completeChallenge({
        paymentIntent: { id: 'pi-confirmed', status: 'succeeded' },
      });
    });
    await act(async () => {
      await result.current.handleSubmit(expressData);
    });
    expect(mocks.confirmExpress).toHaveBeenCalledTimes(2);
    expect(mocks.createPaymentMethod).toHaveBeenCalledTimes(1);
    expect(mocks.track).not.toHaveBeenCalledWith(
      expect.objectContaining({ eventId: eventIds.expressCheckoutCompleted })
    );
    await act(async () => {
      completeConfirmation();
      await submission;
    });
    expect(result.current.isProcessingPayment).toBe(false);
  });

  it.each(['canceled', 'requires_payment_method'])(
    'reports authentication failure and permits a new wallet attempt after %s',
    async status => {
      mocks.confirmExpress.mockRejectedValueOnce(actionRequiredError());
      mocks.handleNextAction.mockResolvedValueOnce({
        error: {
          code: 'payment_intent_authentication_failure',
          payment_intent: { id: 'pi-confirmed', status },
        },
      });
      const { result } = renderHook(
        () => useStripeCheckout({ mode: 'express' }),
        { wrapper: Wrapper }
      );
      await act(async () => {
        await expect(
          result.current.handleSubmit(expressData)
        ).rejects.toBeInstanceOf(GraphQLErrorWithCodes);
      });
      expect(mocks.confirmExpress).toHaveBeenCalledTimes(1);
      expect(mocks.setCheckoutErrors).toHaveBeenCalledWith([
        'AUTHORIZATION_FAILED',
      ]);
      expect(mocks.setIsConfirmingCheckout).toHaveBeenCalledWith(false);
      expect(mocks.track).not.toHaveBeenCalledWith(
        expect.objectContaining({ eventId: eventIds.expressCheckoutCompleted })
      );
      await act(async () => {
        await result.current.handleSubmit(expressData);
      });
      expect(mocks.createPaymentMethod).toHaveBeenCalledTimes(2);
    }
  );

  it.each(['SDK transport', 'final confirmation'])(
    'reuses the intent after an uncertain %s failure and hook remount',
    async stage => {
      const failure = new Error('Connection lost');
      mocks.confirmExpress.mockRejectedValueOnce(actionRequiredError());
      if (stage === 'SDK transport')
        mocks.handleNextAction.mockRejectedValueOnce(failure);
      else mocks.confirmExpress.mockRejectedValueOnce(failure);
      let current!: ReturnType<typeof useStripeCheckout>;
      function Payment() {
        current = useStripeCheckout({ mode: 'express' });
        return null;
      }
      const { rerender } = render(
        <Wrapper>
          <Payment />
        </Wrapper>
      );
      await act(async () => {
        await expect(current.handleSubmit(expressData)).rejects.toBe(failure);
      });
      rerender(<Wrapper>{null}</Wrapper>);
      rerender(
        <Wrapper>
          <Payment />
        </Wrapper>
      );
      await act(async () => {
        await current.handleSubmit(expressData);
      });
      expect(mocks.createPaymentMethod).toHaveBeenCalledTimes(1);
      expect(mocks.confirmExpress).toHaveBeenLastCalledWith(
        expect.objectContaining({
          paymentToken: 'pi-confirmed',
          paymentType: 'google_pay',
        })
      );
    }
  );

  it.each([
    [
      'legacy failure',
      new GraphQLErrorWithCodes([{ code: 'TRANSACTION_PROCESSING_FAILED' }]),
    ],
    [
      'unsupported next action',
      new GraphQLErrorWithCodes([
        {
          code: 'PAYMENT_ACTION_REQUIRED',
          extensions: {
            paymentResult: {
              status: 'ACTION_REQUIRED',
              provider: 'STRIPE',
              paymentReference: 'pi-confirmed',
              nextStep: { type: 'REDIRECT', url: 'https://example.com/verify' },
            },
          },
        },
      ]),
    ],
  ])('fails safely for %s without invoking the SDK', async (_, error) => {
    mocks.confirmExpress.mockRejectedValueOnce(error);
    const { result } = renderHook(
      () => useStripeCheckout({ mode: 'express' }),
      { wrapper: Wrapper }
    );
    await act(async () => {
      await expect(result.current.handleSubmit(expressData)).rejects.toBe(
        error
      );
    });
    expect(mocks.handleNextAction).not.toHaveBeenCalled();
    expect(mocks.setCheckoutErrors).toHaveBeenCalledWith([
      'TRANSACTION_PROCESSING_FAILED',
    ]);
    expect(mocks.setIsConfirmingCheckout).toHaveBeenCalledWith(false);
  });

  it('does not loop when final confirmation still requires action', async () => {
    mocks.confirmExpress
      .mockRejectedValueOnce(actionRequiredError())
      .mockRejectedValueOnce(actionRequiredError());
    const { result } = renderHook(
      () => useStripeCheckout({ mode: 'express' }),
      { wrapper: Wrapper }
    );
    await act(async () => {
      await expect(
        result.current.handleSubmit(expressData)
      ).rejects.toBeInstanceOf(GraphQLErrorWithCodes);
    });
    expect(mocks.handleNextAction).toHaveBeenCalledTimes(1);
    expect(mocks.confirmExpress).toHaveBeenCalledTimes(2);
    expect(mocks.setCheckoutErrors).toHaveBeenCalledWith([
      'TRANSACTION_PROCESSING_FAILED',
    ]);
    await act(async () => {
      await result.current.handleSubmit(expressData);
    });
    expect(mocks.createPaymentMethod).toHaveBeenCalledTimes(1);
    expect(mocks.confirmExpress).toHaveBeenLastCalledWith(
      expect.objectContaining({ paymentToken: 'pi-confirmed' })
    );
  });

  it('does not submit an SDK result belonging to another intent', async () => {
    mocks.confirmExpress.mockRejectedValueOnce(actionRequiredError());
    mocks.handleNextAction.mockResolvedValueOnce({
      paymentIntent: { id: 'pi_other', status: 'succeeded' },
    });
    const { result } = renderHook(
      () => useStripeCheckout({ mode: 'express' }),
      { wrapper: Wrapper }
    );
    await act(async () => {
      await expect(
        result.current.handleSubmit(expressData)
      ).rejects.toBeInstanceOf(GraphQLErrorWithCodes);
    });
    expect(mocks.confirmExpress).toHaveBeenCalledTimes(1);
    await act(async () => {
      await result.current.handleSubmit(expressData);
    });
    expect(mocks.confirmExpress).toHaveBeenLastCalledWith(
      expect.objectContaining({ paymentToken: 'pi-confirmed' })
    );
    expect(mocks.createPaymentMethod).toHaveBeenCalledTimes(1);
  });

  it('discards the pending express intent when the checkout session changes', async () => {
    mocks.confirmExpress
      .mockRejectedValueOnce(actionRequiredError())
      .mockRejectedValueOnce(new Error('Connection lost'));
    const { result, rerender } = renderHook(
      () => useStripeCheckout({ mode: 'express' }),
      { wrapper: Wrapper }
    );
    await act(async () => {
      await expect(result.current.handleSubmit(expressData)).rejects.toThrow(
        'Connection lost'
      );
    });
    mocks.sessionId = 'session-2';
    rerender();
    await act(async () => {
      await result.current.handleSubmit(expressData);
    });
    expect(mocks.createPaymentMethod).toHaveBeenCalledTimes(2);
    expect(mocks.confirmExpress).toHaveBeenLastCalledWith(
      expect.objectContaining({ paymentToken: 'pm_wallet' })
    );
  });
});
