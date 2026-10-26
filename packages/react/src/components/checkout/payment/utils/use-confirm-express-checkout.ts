import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import {
  redirectToSuccessUrl,
  useCheckoutContext,
} from '@/components/checkout/checkout';
import {
  CheckoutConfirmationBlockedError,
  isCheckoutConfirmationBlockedError,
  PaymentProvider,
} from '@/components/checkout/payment/utils/use-confirm-checkout';
import { useGoDaddyContext } from '@/godaddy-provider';
import { confirmCheckout } from '@/lib/godaddy/godaddy';
import { eventIds } from '@/tracking/events';
import {
  type TrackingEventId,
  TrackingEventType,
  track,
} from '@/tracking/track';
import type { ConfirmCheckoutMutationInput } from '@/types';
import { getStripeNextAction } from './stripe-next-action';
import {
  assertNoUnresolvedPayment,
  getUnresolvedPayment,
  isUnresolvedPaymentError,
  PAYMENT_STILL_CONFIRMING,
} from './unresolved-payment';
import { useConfirmCheckoutRecovery } from './use-confirm-checkout-recovery';

export function useConfirmExpressCheckout() {
  const {
    session,
    jwt,
    isConfirmingCheckout,
    setIsConfirmingCheckout,
    setCheckoutErrors,
  } = useCheckoutContext();
  const { apiHost } = useGoDaddyContext();
  const queryClient = useQueryClient();
  const isPendingRef = useRef(false);
  const confirmWithRecovery = useConfirmCheckoutRecovery();

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
      // Read from the session-scoped unresolved payment rather than this hook
      // instance, so a remounted express form still recognizes its own resume.
      const unresolved = getUnresolvedPayment(queryClient, session.id);
      const isContinuation =
        input.paymentProvider === PaymentProvider.STRIPE &&
        unresolved?.flow === 'express' &&
        unresolved.paymentReference === input.paymentToken;
      if (isConfirmingCheckout && !isContinuation) {
        throw new CheckoutConfirmationBlockedError(
          'Checkout confirmation is already in progress'
        );
      }
      // This mutation already contributes one to the live pending count.
      // A render-time busy flag can count confirmation itself and block resumption.
      const isOtherWorkPending =
        queryClient.isMutating() > 1 || queryClient.isFetching() > 0;
      if (isOtherWorkPending && !isContinuation) {
        throw new CheckoutConfirmationBlockedError(
          'Checkout is currently busy'
        );
      }
      if (isPendingRef.current) {
        throw new CheckoutConfirmationBlockedError(
          'Express checkout confirmation is already in progress'
        );
      }
      assertNoUnresolvedPayment(queryClient, session.id, {
        flow: 'express',
        paymentToken: input.paymentToken,
      });

      isPendingRef.current = true;

      try {
        const { isExpress: _isExpress, ...confirmCheckoutInput } = input;

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

        const data = await confirmWithRecovery(async () => {
          const result = jwt
            ? await confirmCheckout(
                confirmCheckoutInput,
                { accessToken: jwt, sessionId: session?.id || '' },
                apiHost
              )
            : await confirmCheckout(confirmCheckoutInput, session, apiHost);

          if (!result) {
            throw new Error('Express checkout confirmation failed');
          }
          return result;
        });

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
      if (isUnresolvedPaymentError(error)) {
        setCheckoutErrors([PAYMENT_STILL_CONFIRMING]);
        setIsConfirmingCheckout(false);
        return;
      }

      // useStripeCheckout records the challenge and keeps checkout locked.
      if (
        data?.paymentProvider === PaymentProvider.STRIPE &&
        getStripeNextAction(error)
      ) {
        return;
      }

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
