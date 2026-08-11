import { renderHook, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import { checkoutContext } from '@/components/checkout/checkout';
import { PaymentProvider } from '@/components/checkout/payment/utils/use-confirm-checkout';
import { useConfirmExpressCheckout } from '@/components/checkout/payment/utils/use-confirm-express-checkout';
import { TIP_SERVER_ERROR_TYPE } from '@/components/checkout/tips/utils/tip-field-errors';
import { GoDaddyProvider } from '@/godaddy-provider';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';
import { PaymentMethodType } from '@/types';
import {
  buildCheckoutSession,
  buildDraftOrder,
  createTestQueryClient,
  getOperations,
  mockGodaddyApi,
  setApiError,
} from '../../__tests__/checkout-test-env';

/**
 * Stands in for the tip field's own message, which is what a customer sees. Also
 * the thing that subscribes to `errors` — react-hook-form's `formState` proxy
 * only refreshes for a component that reads it during render.
 */
function TipErrorProbe() {
  const {
    formState: { errors },
  } = useFormContext();
  const error = errors.tipAmount;
  if (!error) return null;
  return (
    <p data-testid='tip-error' data-error-type={String(error.type)}>
      {String(error.message)}
    </p>
  );
}

function wrapper(
  session = buildCheckoutSession(),
  formValues?: { tipAmount?: number },
  probeTipError = false
) {
  const queryClient = createTestQueryClient();

  function MaybeForm({ children }: { children: React.ReactNode }) {
    const form = useForm({ defaultValues: formValues });
    return (
      <FormProvider {...form}>
        {children}
        {probeTipError ? <TipErrorProbe /> : null}
      </FormProvider>
    );
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

  it('sends the tip the wallet sheet authorized when tips are enabled', async () => {
    const session = buildCheckoutSession({ enableTips: true });
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
    expect(getOperations('ConfirmCheckoutSession')[0]?.input).toMatchObject({
      tipAmount: 1234,
    });
  });

  it('attributes a rejected tip to the tip field', async () => {
    const session = buildCheckoutSession({ enableTips: true });
    const draftOrder = buildDraftOrder();
    mockGodaddyApi({ session, draftOrder });
    setApiError(
      'confirmCheckout',
      new GraphQLErrorWithCodes([
        {
          message:
            'Tip may not exceed 100% of the order total or 2000, whichever is greater',
          code: 'TIP_EXCEEDS_LIMIT',
          // The API tags its tip errors with the input path they belong to.
          path: ['tipAmount'],
        },
      ])
    );

    const { result } = renderHook(() => useConfirmExpressCheckout(), {
      wrapper: wrapper(session, { tipAmount: 999999 }, true),
    });

    await expect(
      result.current.mutateAsync({
        paymentToken: 'wallet-nonce',
        paymentType: 'apple_pay',
        paymentProvider: PaymentProvider.POYNT,
        isExpress: true,
      })
    ).rejects.toBeInstanceOf(GraphQLErrorWithCodes);

    // A wallet payload the API rejected over its tip leaves the customer
    // somewhere to fix it, not just a checkout-wide message.
    const tipError = await screen.findByTestId('tip-error');
    expect(tipError).toHaveTextContent('Tip is too large for this order');
    expect(tipError).toHaveAttribute('data-error-type', TIP_SERVER_ERROR_TYPE);
  });

  it('omits the tip when tips are disabled for the session', async () => {
    const session = buildCheckoutSession({ enableTips: false });
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
});
