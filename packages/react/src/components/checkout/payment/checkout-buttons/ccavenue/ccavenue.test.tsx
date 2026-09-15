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
