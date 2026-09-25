import type { StripeExpressCheckoutElementConfirmEvent } from '@stripe/stripe-js';
import { useQueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import {
  checkoutContext,
  useCheckoutContext,
} from '@/components/checkout/checkout';
import { PaymentProvider } from '@/components/checkout/payment/utils/use-confirm-checkout';
import { useConfirmExpressCheckout } from '@/components/checkout/payment/utils/use-confirm-express-checkout';
import { GoDaddyProvider } from '@/godaddy-provider';
import { confirmCheckout, getDraftOrder } from '@/lib/godaddy/godaddy';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';
import { PaymentMethodType } from '@/types';
import { StripeProvider } from './stripe-provider';
import { useStripeCheckout } from './use-stripe-checkout';

const stripe = vi.hoisted(() => ({
  createPaymentMethod: vi.fn(),
  handleNextAction: vi.fn(),
}));
vi.mock('@stripe/react-stripe-js', () => ({
  CardElement: () => null,
  useStripe: () => stripe,
  useElements: () => ({}),
}));
vi.mock('./use-build-payment-request', () => ({
  useBuildPaymentRequest: () => ({}),
}));
vi.mock('./use-flush-checkout-sync', () => ({
  useFlushCheckoutSync: () => vi.fn(),
}));
vi.mock('./use-confirm-checkout', async importOriginal => ({
  ...(await importOriginal<typeof import('./use-confirm-checkout')>()),
  useConfirmCheckout: () => ({ mutateAsync: vi.fn() }),
}));

import {
  buildCheckoutSession,
  buildDraftOrder,
  createTestQueryClient,
  getOperations,
  mockGodaddyApi,
} from '../../__tests__/checkout-test-env';

function wrapper(
  session = buildCheckoutSession(),
  formValues?: { tipAmount?: number }
) {
  const queryClient = createTestQueryClient();

  function MaybeForm({ children }: { children: React.ReactNode }) {
    const form = useForm({ defaultValues: formValues });
    return <FormProvider {...form}>{children}</FormProvider>;
  }

  return function Wrapper({ children }: { children: React.ReactNode }) {
    const [isConfirmingCheckout, setIsConfirmingCheckout] =
      React.useState(false);
    const [checkoutErrors, setCheckoutErrors] = React.useState<
      string[] | undefined
    >();

    return (
      <GoDaddyProvider queryClient={queryClient}>
        <checkoutContext.Provider
          value={{
            session,
            isConfirmingCheckout,
            setIsConfirmingCheckout,
            checkoutErrors,
            setCheckoutErrors,
          }}
        >
          <StripeProvider>
            {formValues ? <MaybeForm>{children}</MaybeForm> : children}
          </StripeProvider>
        </checkoutContext.Provider>
      </GoDaddyProvider>
    );
  };
}

describe('useConfirmExpressCheckout', () => {
  it('confirms wallet payloads without a form or draft-order sync provider', async () => {
    const session = buildCheckoutSession();
    const draftOrder = buildDraftOrder();
    mockGodaddyApi({ session, draftOrder });

    const { result } = renderHook(() => useConfirmExpressCheckout(), {
      wrapper: wrapper(session),
    });

    await result.current.mutateAsync({
      paymentToken: 'wallet-nonce',
      paymentType: 'apple_pay',
      paymentProvider: PaymentProvider.POYNT,
      isExpress: true,
      billing: {
        email: 'buyer@example.com',
        firstName: 'Buyer',
        lastName: 'Example',
      },
    });

    await waitFor(() => {
      expect(getOperations('ConfirmCheckoutSession')).toHaveLength(1);
    });
    expect(getOperations('ConfirmCheckoutSession')[0]?.input).toMatchObject({
      paymentToken: 'wallet-nonce',
      paymentType: 'apple_pay',
      paymentProvider: 'POYNT',
      billing: {
        email: 'buyer@example.com',
        firstName: 'Buyer',
        lastName: 'Example',
      },
    });
    expect(
      getOperations('ConfirmCheckoutSession')[0]?.input
    ).not.toHaveProperty('isExpress');
    expect(getOperations('UpdateCheckoutSessionDraftOrder')).toHaveLength(0);
    expect(getOperations('CalculateCheckoutSessionTaxes')).toHaveLength(0);
  });

  it.each([
    { scenario: 'tips are enabled for the session', enableTips: true },
    { scenario: 'tips are disabled for the session', enableTips: false },
  ])('omits the tip when $scenario', async ({ enableTips }) => {
    // Express never charges a tip: its wallet sheet is built from the subtotal
    // plus the shipping and taxes it calculates in its own event flows. A tip
    // the customer typed into the standard form must not ride along.
    const session = buildCheckoutSession({ enableTips });
    const draftOrder = buildDraftOrder();
    mockGodaddyApi({ session, draftOrder });

    const { result } = renderHook(() => useConfirmExpressCheckout(), {
      wrapper: wrapper(session, { tipAmount: 1234 }),
    });

    await result.current.mutateAsync({
      paymentToken: 'wallet-nonce',
      paymentType: 'apple_pay',
      paymentProvider: PaymentProvider.POYNT,
      isExpress: true,
    });

    await waitFor(() => {
      expect(getOperations('ConfirmCheckoutSession')).toHaveLength(1);
    });
    const confirmInput = getOperations('ConfirmCheckoutSession')[0]?.input as
      | { tipAmount?: number }
      | undefined;
    expect(confirmInput?.tipAmount).toBeUndefined();
  });

  it('rejects without confirming while checkout is already confirming', async () => {
    const session = buildCheckoutSession();
    const draftOrder = buildDraftOrder();
    mockGodaddyApi({ session, draftOrder });
    const queryClient = createTestQueryClient();

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <GoDaddyProvider queryClient={queryClient}>
        <checkoutContext.Provider
          value={{
            session,
            isConfirmingCheckout: true,
            setIsConfirmingCheckout: () => undefined,
            checkoutErrors: undefined,
            setCheckoutErrors: () => undefined,
          }}
        >
          {children}
        </checkoutContext.Provider>
      </GoDaddyProvider>
    );

    const { result } = renderHook(() => useConfirmExpressCheckout(), {
      wrapper: Wrapper,
    });

    await expect(
      result.current.mutateAsync({
        paymentToken: 'wallet-nonce',
        paymentType: PaymentMethodType.CREDIT_CARD,
        paymentProvider: PaymentProvider.POYNT,
        isExpress: true,
      })
    ).rejects.toThrow('Checkout confirmation is already in progress');

    expect(getOperations('ConfirmCheckoutSession')).toHaveLength(0);
  });
  it('keeps checkout locked while checking the order and preserves the original error if that check fails', async () => {
    const session = buildCheckoutSession();
    mockGodaddyApi({ session, draftOrder: buildDraftOrder() });
    const error = new Error('Confirmation response lost');
    vi.mocked(confirmCheckout).mockRejectedValueOnce(error);
    let rejectLookup!: (error: Error) => void;
    vi.mocked(getDraftOrder).mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectLookup = reject;
        })
    );
    const { result } = renderHook(
      () => ({
        confirmation: useConfirmExpressCheckout(),
        context: useCheckoutContext(),
      }),
      { wrapper: wrapper(session) }
    );
    const outcome = result.current.confirmation
      .mutateAsync({
        paymentToken: 'wallet-nonce',
        paymentType: 'apple_pay',
        paymentProvider: PaymentProvider.POYNT,
      })
      .catch(caught => caught);
    await waitFor(() => expect(getDraftOrder).toHaveBeenCalledTimes(1));
    expect(result.current.context.isConfirmingCheckout).toBe(true);
    rejectLookup(new Error('Status lookup failed'));
    expect(await outcome).toBe(error);
    await waitFor(() =>
      expect(result.current.context.isConfirmingCheckout).toBe(false)
    );
    expect(confirmCheckout).toHaveBeenCalledTimes(1);
  });

  it('does not refetch or replace a verification-required response', async () => {
    const session = buildCheckoutSession();
    mockGodaddyApi({ session, draftOrder: buildDraftOrder() });
    const error = new GraphQLErrorWithCodes([
      {
        code: 'PAYMENT_ACTION_REQUIRED',
        extensions: {
          paymentResult: {
            status: 'ACTION_REQUIRED',
            provider: 'STRIPE',
            nextStep: { type: 'SDK_ACTION' },
          },
        },
      },
    ]);
    vi.mocked(confirmCheckout).mockRejectedValueOnce(error);
    const { result } = renderHook(() => useConfirmExpressCheckout(), {
      wrapper: wrapper(session),
    });
    await expect(
      result.current.mutateAsync({
        paymentToken: 'wallet-nonce',
        paymentType: 'apple_pay',
        paymentProvider: PaymentProvider.STRIPE,
      })
    ).rejects.toBe(error);
    expect(getDraftOrder).not.toHaveBeenCalled();
  });
});

it('keeps express checkout locked during 3DS and allows only the matching intent to resume', async () => {
  const session = buildCheckoutSession();
  mockGodaddyApi({ session, draftOrder: buildDraftOrder() });
  vi.mocked(confirmCheckout).mockRejectedValueOnce(
    new GraphQLErrorWithCodes([
      {
        code: 'PAYMENT_ACTION_REQUIRED',
        extensions: {
          paymentResult: {
            status: 'ACTION_REQUIRED',
            provider: 'STRIPE',
            paymentReference: 'pi_wallet',
            nextStep: {
              type: 'SDK_ACTION',
              sdk: 'STRIPE_JS',
              action: 'HANDLE_NEXT_ACTION',
              clientSecret: 'pi_wallet_secret',
            },
          },
        },
      },
    ])
  );
  stripe.createPaymentMethod.mockResolvedValue({
    paymentMethod: { id: 'pm_wallet' },
  });
  let finishChallenge!: (value: unknown) => void;
  stripe.handleNextAction.mockReturnValueOnce(
    new Promise(resolve => {
      finishChallenge = resolve;
    })
  );
  const { result } = renderHook(
    () => ({
      payment: useStripeCheckout({ mode: 'express' }),
      otherConfirmation: useConfirmExpressCheckout(),
      context: useCheckoutContext(),
    }),
    { wrapper: wrapper(session) }
  );
  let submission!: ReturnType<typeof result.current.payment.handleSubmit>;
  await act(async () => {
    submission = result.current.payment.handleSubmit({
      event: {
        expressPaymentType: 'google_pay',
      } as StripeExpressCheckoutElementConfirmEvent,
    });
  });
  await waitFor(() => expect(stripe.handleNextAction).toHaveBeenCalledTimes(1));
  expect(result.current.context.isConfirmingCheckout).toBe(true);
  expect(result.current.context.checkoutErrors).toBeUndefined();
  expect(getDraftOrder).not.toHaveBeenCalled();
  expect(confirmCheckout).toHaveBeenCalledTimes(1);
  await act(async () => {
    await expect(
      result.current.otherConfirmation.mutateAsync({
        paymentToken: 'pm_other',
        paymentType: 'google_pay',
        paymentProvider: PaymentProvider.STRIPE,
      })
    ).rejects.toThrow('Checkout confirmation is already in progress');
  });
  expect(result.current.context.isConfirmingCheckout).toBe(true);
  await act(async () => {
    finishChallenge({
      paymentIntent: { id: 'pi_wallet', status: 'succeeded' },
    });
    await submission;
  });
  expect(confirmCheckout).toHaveBeenCalledTimes(2);
  expect(
    vi.mocked(confirmCheckout).mock.calls.map(([input]) => input.paymentToken)
  ).toEqual(['pm_wallet', 'pi_wallet']);
  expect(stripe.createPaymentMethod).toHaveBeenCalledTimes(1);
});

it.each(['query', 'mutation'])(
  'blocks a fresh express payment during another %s',
  async kind => {
    const session = buildCheckoutSession();
    mockGodaddyApi({ session, draftOrder: buildDraftOrder() });
    const { result } = renderHook(
      () => ({
        confirmation: useConfirmExpressCheckout(),
        client: useQueryClient(),
      }),
      { wrapper: wrapper(session) }
    );
    let finish!: () => void;
    const pending = new Promise<void>(resolve => {
      finish = resolve;
    });
    const work =
      kind === 'query'
        ? result.current.client.fetchQuery({
            queryKey: ['other-work'],
            queryFn: () => pending.then(() => null),
          })
        : result.current.client
            .getMutationCache()
            .build(result.current.client, { mutationFn: () => pending })
            .execute(undefined);
    await expect(
      result.current.confirmation.mutateAsync({
        paymentToken: 'pm_wallet',
        paymentType: 'google_pay',
        paymentProvider: PaymentProvider.STRIPE,
      })
    ).rejects.toThrow('Checkout is currently busy');
    expect(confirmCheckout).not.toHaveBeenCalled();
    finish();
    await work;
  }
);
