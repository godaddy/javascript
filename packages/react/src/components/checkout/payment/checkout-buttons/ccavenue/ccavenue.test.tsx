import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, type UseFormReturn, useForm } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type CheckoutFormData,
  checkoutContext,
} from '@/components/checkout/checkout';
import { DraftOrderSyncProvider } from '@/components/checkout/order/draft-order-sync-provider';
import { CCAvenueCheckoutButton } from '@/components/checkout/payment/checkout-buttons/ccavenue/ccavenue';
import { GoDaddyProvider } from '@/godaddy-provider';
import { getRedirectTipAmount } from '@/lib/redirect-tip-storage';
import {
  buildCheckoutSession,
  buildDraftOrder,
  createTestQueryClient,
  mockGodaddyApi,
  restoreWindowLocation,
  setupCheckoutTestGlobals,
} from '../../../__tests__/checkout-test-utils';

const mocks = vi.hoisted(() => ({ authorize: vi.fn() }));

vi.mock('@/components/checkout/payment/utils/use-authorize-checkout', () => ({
  useAuthorizeCheckout: () => ({ mutateAsync: mocks.authorize }),
}));

const noop = () => undefined;

let form: UseFormReturn<CheckoutFormData> | undefined;
let sessionId = '';

function renderCCAvenueButton({ enableTips = true, tipAmount = 0 } = {}) {
  const session = buildCheckoutSession({ enableTips });
  const draftOrder = buildDraftOrder();
  mockGodaddyApi({ session, draftOrder });
  const queryClient = createTestQueryClient();
  sessionId = session.id;

  function Harness() {
    const methods = useForm<CheckoutFormData>({
      defaultValues: { tipAmount } as CheckoutFormData,
    });
    form = methods;

    return (
      <GoDaddyProvider queryClient={queryClient}>
        <checkoutContext.Provider
          value={{
            session,
            ccavenueConfig: { accessCodeId: 'access-code-1' },
            isConfirmingCheckout: false,
            setIsConfirmingCheckout: noop,
            checkoutErrors: undefined,
            setCheckoutErrors: noop,
          }}
        >
          <FormProvider {...methods}>
            <DraftOrderSyncProvider>
              <CCAvenueCheckoutButton />
            </DraftOrderSyncProvider>
          </FormProvider>
        </checkoutContext.Provider>
      </GoDaddyProvider>
    );
  }

  return { ...render(<Harness />), user: userEvent.setup() };
}

describe('CCAvenueCheckoutButton', () => {
  beforeEach(() => {
    setupCheckoutTestGlobals();
    window.sessionStorage.clear();
    window.localStorage.clear();
    form = undefined;
    mocks.authorize.mockReset();
    vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(noop);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    restoreWindowLocation();
  });

  it('persists the tip the authorization sent when it changes during the flush', async () => {
    // `useAuthorizeCheckout` reads the tip after its own sync flush, so the tip
    // can move between the click and the amount the gateway will collect.
    // Reading the form again here would persist the tip it replaced, and the
    // return leg would confirm an order for less than the customer paid.
    mocks.authorize.mockImplementation(async () => {
      form?.setValue('tipAmount', 100);
      await Promise.resolve();
      return {
        transactionRefNum: 'enc-request-1',
        authorizedTipAmount: form?.getValues('tipAmount') ?? 0,
      };
    });

    const { user } = renderCCAvenueButton({ enableTips: true, tipAmount: 500 });

    await user.click(
      await screen.findByRole('button', { name: /pay with ccavenue/i })
    );

    await waitFor(() => {
      expect(getRedirectTipAmount(sessionId)).toBe(100);
    });
    expect(HTMLFormElement.prototype.submit).toHaveBeenCalled();
  });

  it('redirects for a zero tip storage would not take', async () => {
    // Nothing to recover is fine for a zero tip: the API also treats a missing
    // tip as zero, so private browsing does not have to fail the checkout.
    mocks.authorize.mockResolvedValue({
      transactionRefNum: 'enc-request-1',
      authorizedTipAmount: 0,
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });

    const { user } = renderCCAvenueButton({ enableTips: true, tipAmount: 0 });

    await user.click(
      await screen.findByRole('button', { name: /pay with ccavenue/i })
    );

    await waitFor(() => {
      expect(HTMLFormElement.prototype.submit).toHaveBeenCalled();
    });
  });

  it('abandons the redirect when an earlier tip would be confirmed instead', async () => {
    // An earlier attempt left $5.00 behind and storage has since gone read-only,
    // so the zero this redirect charges cannot replace it or remove it. Charging
    // nothing and confirming $5.00 is worse than not going to the gateway.
    window.sessionStorage.setItem(
      'godaddy-checkout-redirect-tip:checkout-session-1',
      JSON.stringify({ tipAmount: 500, savedAt: Date.now() })
    );
    mocks.authorize.mockResolvedValue({
      transactionRefNum: 'enc-request-1',
      authorizedTipAmount: 0,
    });
    for (const method of ['setItem', 'removeItem'] as const) {
      vi.spyOn(Storage.prototype, method).mockImplementation(() => {
        throw new Error('storage disabled');
      });
    }

    const { user } = renderCCAvenueButton({ enableTips: true, tipAmount: 0 });

    await user.click(
      await screen.findByRole('button', { name: /pay with ccavenue/i })
    );

    await waitFor(() => {
      expect(mocks.authorize).toHaveBeenCalled();
    });
    expect(HTMLFormElement.prototype.submit).not.toHaveBeenCalled();
  });

  it('does not persist a tip when tips are disabled', async () => {
    mocks.authorize.mockResolvedValue({
      transactionRefNum: 'enc-request-1',
      authorizedTipAmount: null,
    });

    const { user } = renderCCAvenueButton({
      enableTips: false,
      tipAmount: 500,
    });

    await user.click(
      await screen.findByRole('button', { name: /pay with ccavenue/i })
    );

    await waitFor(() => {
      expect(HTMLFormElement.prototype.submit).toHaveBeenCalled();
    });
    expect(getRedirectTipAmount(sessionId)).toBeNull();
  });
});
