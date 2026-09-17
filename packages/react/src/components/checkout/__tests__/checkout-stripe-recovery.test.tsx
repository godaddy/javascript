import { act, screen, waitFor } from '@testing-library/react';
import type React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as godaddyApi from '@/lib/godaddy/godaddy';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';
import {
  buildCheckoutSession,
  buildDraftOrder,
  renderCheckout,
  restoreWindowLocation,
  setupCheckoutTestGlobals,
  waitForCheckoutReady,
} from './checkout-test-utils';

const stripe = vi.hoisted(() => ({
  createPaymentMethod: vi.fn(),
  handleNextAction: vi.fn(),
}));
const elements = vi.hoisted(() => ({
  getElement: vi.fn(() => ({})),
  update: vi.fn(),
}));

// Keep the real Checkout, PaymentForm, StripeProvider, button, and confirm hook.
vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => children,
  CardElement: () => <div>Stripe card field</div>,
  useStripe: () => stripe,
  useElements: () => elements,
}));
vi.mock(
  '@/components/checkout/payment/utils/use-stripe-payment-intent',
  () => ({
    useStripePaymentIntent: () => ({
      stripePromise: stripe,
      currency: 'usd',
      clientSecret: null,
      isLoading: false,
      amount: 1000,
    }),
  })
);

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  setupCheckoutTestGlobals();
  stripe.createPaymentMethod
    .mockReset()
    .mockResolvedValue({ paymentMethod: { id: 'pm_original' } });
  stripe.handleNextAction.mockReset();
});

afterEach(() => {
  act(() => {
    vi.runOnlyPendingTimers();
  });
  vi.useRealTimers();
  vi.restoreAllMocks();
  restoreWindowLocation();
});

describe('Stripe recovery through the payment spinner', () => {
  it.each(['finalization', 'SDK transport'])(
    'reuses the intent after %s failure and button remount',
    async failure => {
      const draftOrder = buildDraftOrder();
      const session = buildCheckoutSession({
        draftOrder,
        enableShipping: false,
        enableLocalPickup: false,
        enableBillingAddressCollection: false,
        enableTaxCollection: false,
        paymentMethods: {
          card: { processor: 'stripe', checkoutTypes: ['standard'] },
        },
      });
      const { user } = renderCheckout({
        session,
        draftOrder,
        checkoutProps: { stripeConfig: { publishableKey: 'pk_test' } },
      });
      await waitForCheckoutReady();

      const confirm = vi.mocked(godaddyApi.confirmCheckout);
      confirm.mockRejectedValueOnce(
        new GraphQLErrorWithCodes([
          {
            code: 'PAYMENT_ACTION_REQUIRED',
            extensions: {
              paymentResult: {
                status: 'ACTION_REQUIRED',
                provider: 'STRIPE',
                paymentReference: 'pi_original',
                nextStep: {
                  type: 'SDK_ACTION',
                  sdk: 'STRIPE_JS',
                  action: 'HANDLE_NEXT_ACTION',
                  clientSecret: 'pi_original_secret',
                },
              },
            },
          },
        ])
      );
      if (failure === 'finalization')
        confirm.mockRejectedValueOnce(new Error('Connection lost'));

      let finishAction!: (value: unknown) => void;
      let failAction!: (reason: Error) => void;
      const action = new Promise((resolve, reject) => {
        finishAction = resolve;
        failAction = reject;
      });
      stripe.handleNextAction.mockReturnValueOnce(action);
      const originalButton = await screen.findByRole('button', {
        name: /pay now/i,
      });
      await user.click(originalButton);
      await waitFor(() =>
        expect(stripe.handleNextAction).toHaveBeenCalledOnce()
      );
      expect(originalButton).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /processing/i })
      ).toBeDisabled();

      await act(async () => {
        if (failure === 'SDK transport')
          failAction(new Error('Connection lost'));
        else
          finishAction({
            paymentIntent: { id: 'pi_original', status: 'succeeded' },
          });
      });
      const retryButton = await screen.findByRole('button', {
        name: /pay now/i,
      });
      expect(retryButton).not.toBe(originalButton);
      await waitFor(() => expect(retryButton).toBeEnabled());
      await user.click(retryButton);
      const expectedTokens =
        failure === 'finalization'
          ? ['pm_original', 'pi_original', 'pi_original']
          : ['pm_original', 'pi_original'];
      await waitFor(() =>
        expect(confirm.mock.calls.map(([input]) => input.paymentToken)).toEqual(
          expectedTokens
        )
      );
      expect(stripe.createPaymentMethod).toHaveBeenCalledOnce();
      expect(stripe.handleNextAction).toHaveBeenCalledOnce();
    }
  );
});
