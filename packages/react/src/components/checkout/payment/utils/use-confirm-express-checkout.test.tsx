import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { checkoutContext } from '@/components/checkout/checkout';
import { PaymentProvider } from '@/components/checkout/payment/utils/use-confirm-checkout';
import { useConfirmExpressCheckout } from '@/components/checkout/payment/utils/use-confirm-express-checkout';
import { GoDaddyProvider } from '@/godaddy-provider';
import { PaymentMethodType } from '@/types';
import {
  buildCheckoutSession,
  buildDraftOrder,
  createTestQueryClient,
  getOperations,
  mockGodaddyApi,
} from '../../__tests__/checkout-test-env';

function wrapper(session = buildCheckoutSession()) {
  const queryClient = createTestQueryClient();

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
          {children}
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

  it('does not confirm while checkout is already confirming', async () => {
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

    await result.current.mutateAsync({
      paymentToken: 'wallet-nonce',
      paymentType: PaymentMethodType.CREDIT_CARD,
      paymentProvider: PaymentProvider.POYNT,
      isExpress: true,
    });

    expect(getOperations('ConfirmCheckoutSession')).toHaveLength(0);
  });
});
