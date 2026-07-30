import { renderHook, waitFor } from '@testing-library/react';
import type React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import {
  type CheckoutFormData,
  checkoutContext,
} from '@/components/checkout/checkout';
import { DraftOrderSyncProvider } from '@/components/checkout/order/draft-order-sync-provider';
import { useAuthorizeCheckout } from '@/components/checkout/payment/utils/use-authorize-checkout';
import { PaymentProvider } from '@/components/checkout/payment/utils/use-confirm-checkout';
import { GoDaddyProvider } from '@/godaddy-provider';
import { PaymentMethodType } from '@/types';
import {
  buildCheckoutSession,
  buildDraftOrder,
  createTestQueryClient,
  getOperations,
  mockGodaddyApi,
} from '../../__tests__/checkout-test-env';

function wrapper({
  enableTips = false,
  tipAmount,
}: {
  enableTips?: boolean;
  tipAmount?: number;
} = {}) {
  const session = buildCheckoutSession({ enableTips });
  const draftOrder = buildDraftOrder();
  mockGodaddyApi({ session, draftOrder });
  const queryClient = createTestQueryClient();

  return function Wrapper({ children }: { children: React.ReactNode }) {
    const methods = useForm<CheckoutFormData>({
      defaultValues: tipAmount === undefined ? {} : { tipAmount },
    });

    return (
      <GoDaddyProvider queryClient={queryClient}>
        <checkoutContext.Provider
          value={{
            session,
            isConfirmingCheckout: false,
            setIsConfirmingCheckout: () => undefined,
            checkoutErrors: undefined,
            setCheckoutErrors: () => undefined,
          }}
        >
          <FormProvider {...methods}>
            <DraftOrderSyncProvider>{children}</DraftOrderSyncProvider>
          </FormProvider>
        </checkoutContext.Provider>
      </GoDaddyProvider>
    );
  };
}

const cardFieldsInput = {
  paymentType: PaymentMethodType.CREDIT_CARD,
  paymentProvider: PaymentProvider.PAYPAL,
  paymentToken: '',
};

async function authorizedInput() {
  await waitFor(() => {
    expect(getOperations('AuthorizeCheckoutSession')).toHaveLength(1);
  });
  return getOperations('AuthorizeCheckoutSession')[0]?.input as
    | Record<string, unknown>
    | undefined;
}

describe('useAuthorizeCheckout', () => {
  it('authorizes for the tip-inclusive amount when tips are enabled', async () => {
    const { result } = renderHook(() => useAuthorizeCheckout(), {
      wrapper: wrapper({ enableTips: true, tipAmount: 500 }),
    });

    await result.current.mutateAsync(cardFieldsInput);

    expect(await authorizedInput()).toMatchObject({
      paymentType: PaymentMethodType.CREDIT_CARD,
      paymentProvider: 'PAYPAL',
      paymentToken: '',
      tipAmount: 500,
    });
  });

  it('authorizes with a zero tip when tips are enabled but none was chosen', async () => {
    const { result } = renderHook(() => useAuthorizeCheckout(), {
      wrapper: wrapper({ enableTips: true }),
    });

    await result.current.mutateAsync(cardFieldsInput);

    expect((await authorizedInput())?.tipAmount).toBe(0);
  });

  it('sends no tip when the session has tips disabled', async () => {
    // A stale tipAmount can linger in form state after tips are turned off, so
    // the session flag — not the form value — decides whether a tip is sent.
    const { result } = renderHook(() => useAuthorizeCheckout(), {
      wrapper: wrapper({ enableTips: false, tipAmount: 500 }),
    });

    await result.current.mutateAsync(cardFieldsInput);

    expect((await authorizedInput())?.tipAmount).toBeUndefined();
  });

  it('ignores a caller-supplied tip so the authorized amount cannot drift', async () => {
    const { result } = renderHook(() => useAuthorizeCheckout(), {
      wrapper: wrapper({ enableTips: true, tipAmount: 500 }),
    });

    await result.current.mutateAsync({ ...cardFieldsInput, tipAmount: 999 });

    expect((await authorizedInput())?.tipAmount).toBe(500);
  });

  it('returns the transaction used as the provider order reference', async () => {
    const { result } = renderHook(() => useAuthorizeCheckout(), {
      wrapper: wrapper({ enableTips: true, tipAmount: 500 }),
    });

    const authorized = await result.current.mutateAsync(cardFieldsInput);

    expect(authorized?.transactionRefNum).toBe('transaction-ref-1');
  });
});
