import { renderHook, waitFor } from '@testing-library/react';
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
          {formValues ? <MaybeForm>{children}</MaybeForm> : children}
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
