import { useMutation } from '@tanstack/react-query';
import { useRef } from 'react';
import {
  redirectToSuccessUrl,
  useCheckoutContext,
} from '@/components/checkout/checkout';
import { PaymentProvider } from '@/components/checkout/payment/utils/use-confirm-checkout';
import { useIsPaymentDisabled } from '@/components/checkout/payment/utils/use-is-payment-disabled';
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
  const { apiHost } = useGoDaddyContext();
  const isPaymentDisabled = useIsPaymentDisabled();
  const isPendingRef = useRef(false);

  return useMutation({
    mutationFn: async (
      input: ConfirmCheckoutMutationInput['input'] & {
        paymentProvider: PaymentProvider;
        isExpress?: boolean;
      }
    ) => {
      if (!session || !input?.paymentType) return;
      if (isConfirmingCheckout || isPaymentDisabled) return;
      if (isPendingRef.current) return;

      isPendingRef.current = true;
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

      const data = jwt
        ? await confirmCheckout(
            confirmCheckoutInput,
            { accessToken: jwt, sessionId: session?.id || '' },
            apiHost
          )
        : await confirmCheckout(confirmCheckoutInput, session, apiHost);
      return data;
    },
    onSuccess: (_data, input) => {
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
    onError: (error, data) => {
      track({
        eventId: eventIds.checkoutError,
        type: TrackingEventType.EVENT,
        properties: {
          errorCodes: error?.name || 'unknown',
          errorType: error?.message,
          paymentType: data?.paymentType,
          provider: data?.paymentProvider || 'unknown',
          draftOrderId: session?.draftOrder?.id || 'unknown',
        },
      });

      setIsConfirmingCheckout(false);
    },
    onSettled: () => {
      isPendingRef.current = false;
    },
  });
}
