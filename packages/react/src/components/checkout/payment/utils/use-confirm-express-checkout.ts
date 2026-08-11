import { useMutation } from '@tanstack/react-query';
import { useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  redirectToSuccessUrl,
  useCheckoutContext,
} from '@/components/checkout/checkout';
import {
  CheckoutConfirmationBlockedError,
  isCheckoutConfirmationBlockedError,
  PaymentProvider,
} from '@/components/checkout/payment/utils/use-confirm-checkout';
import { useIsPaymentDisabled } from '@/components/checkout/payment/utils/use-is-payment-disabled';
import { applyTipFieldError } from '@/components/checkout/tips/utils/tip-field-errors';
import { useGoDaddyContext } from '@/godaddy-provider';
import { confirmCheckout } from '@/lib/godaddy/godaddy';
import { eventIds } from '@/tracking/events';
import {
  type TrackingEventId,
  TrackingEventType,
  track,
} from '@/tracking/track';
import type { ConfirmCheckoutMutationInput } from '@/types';

export function useConfirmExpressCheckout() {
  const {
    session,
    jwt,
    isConfirmingCheckout,
    setIsConfirmingCheckout,
    setCheckoutErrors,
  } = useCheckoutContext();
  const { apiHost, t } = useGoDaddyContext();
  const isPaymentDisabled = useIsPaymentDisabled();
  // Express buttons can render outside a form provider, so this may be null.
  const form = useFormContext();
  const isPendingRef = useRef(false);

  return useMutation({
    mutationFn: async (
      input: ConfirmCheckoutMutationInput['input'] & {
        paymentProvider: PaymentProvider;
        isExpress?: boolean;
      }
    ) => {
      if (!session) {
        throw new Error('Express checkout session is unavailable');
      }
      if (!input?.paymentType) {
        throw new Error('Express checkout payment type is unavailable');
      }
      if (isConfirmingCheckout) {
        throw new CheckoutConfirmationBlockedError(
          'Checkout confirmation is already in progress'
        );
      }
      if (isPaymentDisabled) {
        throw new CheckoutConfirmationBlockedError(
          'Checkout is currently busy'
        );
      }
      if (isPendingRef.current) {
        throw new CheckoutConfirmationBlockedError(
          'Express checkout confirmation is already in progress'
        );
      }

      isPendingRef.current = true;

      try {
        const { isExpress: _isExpress, ...confirmCheckoutInput } = input;

        // The wallet sheet and the Stripe Elements amount are tip-inclusive, so
        // capture the same tip the customer authorized. Callers may pass their
        // own tipAmount; otherwise fall back to the tips section's form value.
        const payload = {
          ...confirmCheckoutInput,
          tipAmount: session.enableTips
            ? (confirmCheckoutInput.tipAmount ??
              form?.getValues('tipAmount') ??
              0)
            : undefined,
        };

        setCheckoutErrors(undefined);
        setIsConfirmingCheckout(true);

        track({
          eventId: eventIds.paymentStart,
          type: TrackingEventType.EVENT,
          properties: {
            paymentType: input.paymentType,
            provider: input.paymentProvider,
            draftOrderId: session?.draftOrder?.id || 'unknown',
          },
        });

        const data = jwt
          ? await confirmCheckout(
              payload,
              { accessToken: jwt, sessionId: session?.id || '' },
              apiHost
            )
          : await confirmCheckout(payload, session, apiHost);

        if (!data) {
          throw new Error('Express checkout confirmation failed');
        }

        return data;
      } finally {
        isPendingRef.current = false;
      }
    },
    onSuccess: (data, input) => {
      if (!data) return;
      let completedEventId: TrackingEventId | null = null;
      switch (input.paymentType) {
        case 'apple_pay':
          completedEventId = eventIds.expressApplePayCompleted;
          break;
        case 'google_pay':
          completedEventId = eventIds.expressGooglePayCompleted;
          break;
        case 'paze':
          completedEventId = eventIds.pazePayCompleted;
          break;
        default:
          completedEventId = null;
      }

      if (completedEventId) {
        track({
          eventId: completedEventId,
          type: TrackingEventType.EVENT,
          properties: {
            draftOrderId: session?.draftOrder?.id || 'unknown',
            paymentType: input.paymentType,
            provider: 'poynt',
          },
        });
      }

      track({
        eventId: eventIds.checkoutComplete,
        type: TrackingEventType.EVENT,
        properties: {
          draftOrderId: session?.draftOrder?.id || 'unknown',
          total: session?.draftOrder?.totals?.total?.value || 0,
          currencyCode:
            session?.draftOrder?.totals?.total?.currencyCode || 'unknown',
          paymentType: input?.paymentType,
          provider: input?.paymentProvider || 'unknown',
        },
      });

      redirectToSuccessUrl(session?.successUrl);
    },
    onError: (error: unknown, data) => {
      if (isCheckoutConfirmationBlockedError(error)) return;

      // This payload carries a tip, so it can be rejected for one. Attributed to
      // the tip field as in `useAuthorizeCheckout` and `useConfirmCheckout`,
      // which leaves the customer somewhere to fix it rather than only a
      // checkout-wide message. A no-op when the button renders without a form.
      applyTipFieldError(
        form,
        error,
        code => t.apiErrors?.[code as keyof typeof t.apiErrors]
      );

      track({
        eventId: eventIds.checkoutError,
        type: TrackingEventType.EVENT,
        properties: {
          errorCodes: error instanceof Error ? error.name : 'unknown',
          errorType: error instanceof Error ? error.message : undefined,
          paymentType: data?.paymentType,
          provider: data?.paymentProvider || 'unknown',
          draftOrderId: session?.draftOrder?.id || 'unknown',
        },
      });

      setIsConfirmingCheckout(false);
    },
  });
}
