import { render, waitFor } from '@testing-library/react';
import type React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  type CheckoutFormData,
  checkoutContext,
} from '@/components/checkout/checkout';
import { DraftOrderSyncProvider } from '@/components/checkout/order/draft-order-sync-provider';
import { CCAvenueReturnProvider } from '@/components/checkout/payment/utils/ccavenue-return-provider';
import { GoDaddyProvider } from '@/godaddy-provider';
import { setRedirectTipAmount } from '@/lib/redirect-tip-storage';
import type { CheckoutSession } from '@/types';
import {
  buildCheckoutSession,
  buildDraftOrder,
  createTestQueryClient,
  getOperations,
  mockGodaddyApi,
  setCheckoutUrl,
} from '../../__tests__/checkout-test-env';

// Stable across renders, like the state setters the real provider supplies —
// an inline callback would re-run the effect on every render and mask whether
// the declared dependencies are complete.
const noop = () => undefined;

// The session cookie is absent in the token-exchange path, so `jwt` is the only
// credential the return leg can authenticate with.
function buildCookielessSession(): CheckoutSession {
  return {
    ...buildCheckoutSession({ enableTips: true }),
    token: null,
  };
}

function renderReturnProvider(session: CheckoutSession) {
  const queryClient = createTestQueryClient();

  function Harness({ jwt }: { jwt?: string }) {
    const methods = useForm<CheckoutFormData>();

    return (
      <GoDaddyProvider queryClient={queryClient}>
        <checkoutContext.Provider
          value={{
            session,
            jwt,
            isConfirmingCheckout: false,
            setIsConfirmingCheckout: noop,
            checkoutErrors: undefined,
            setCheckoutErrors: noop,
          }}
        >
          <FormProvider {...methods}>
            <DraftOrderSyncProvider>
              <CCAvenueReturnProvider>
                <div>checkout</div>
              </CCAvenueReturnProvider>
            </DraftOrderSyncProvider>
          </FormProvider>
        </checkoutContext.Provider>
      </GoDaddyProvider>
    );
  }

  const view = render(<Harness />);
  return {
    setJwt: (jwt: string) => view.rerender(<Harness jwt={jwt} />),
  };
}

function confirmOperations() {
  return getOperations('ConfirmCheckoutSession');
}

describe('CCAvenueReturnProvider', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    mockGodaddyApi({
      session: buildCookielessSession(),
      draftOrder: buildDraftOrder(),
    });
    setCheckoutUrl({
      pathname: '/checkout/checkout-session-1',
      search: 'encResp=enc-resp-1',
    });
  });

  it('confirms with the authorized tip once the jwt arrives after the first render', async () => {
    // The effect reads `jwt`, so it has to re-run when the token lands or the
    // customer is left paid at the gateway with no order.
    setRedirectTipAmount('checkout-session-1', 500);

    const { setJwt } = renderReturnProvider(buildCookielessSession());
    expect(confirmOperations()).toHaveLength(0);

    setJwt('jwt-1');

    await waitFor(() => {
      expect(confirmOperations()).toHaveLength(1);
    });
    expect(confirmOperations()[0]?.input).toMatchObject({
      paymentToken: 'enc-resp-1',
      paymentType: 'ccavenue',
      tipAmount: 500,
    });
  });

  it('confirms only once when the context changes again after the confirmation', async () => {
    setRedirectTipAmount('checkout-session-1', 500);

    const { setJwt } = renderReturnProvider(buildCookielessSession());
    setJwt('jwt-1');
    await waitFor(() => {
      expect(confirmOperations()).toHaveLength(1);
    });

    setJwt('jwt-2');

    await waitFor(() => {
      expect(confirmOperations()).toHaveLength(1);
    });
  });

  it('does not confirm while no credential is available', async () => {
    setRedirectTipAmount('checkout-session-1', 500);

    renderReturnProvider(buildCookielessSession());

    await waitFor(() => {
      expect(confirmOperations()).toHaveLength(0);
    });
  });
});
