import { useMutation } from '@tanstack/react-query';
import { useFormContext } from 'react-hook-form';
import {
  redirectToSuccessUrl,
  useCheckoutContext,
} from '@/components/checkout/checkout';
import { DeliveryMethods } from '@/components/checkout/delivery/delivery-method';
import { buildPickupPayload } from '@/components/checkout/pickup/utils/build-pickup-payload';
import { useGoDaddyContext } from '@/godaddy-provider';
import { confirmCheckout } from '@/lib/godaddy/godaddy';
import { eventIds } from '@/tracking/events';
import {
  type TrackingEventId,
  TrackingEventType,
  track,
} from '@/tracking/track';
import type { ConfirmCheckoutMutationInput } from '@/types';

export enum PaymentProvider {
  CHASE_PAYMENTECH = 'CHASE_PAYMENTECH',
  REDE = 'REDE',
  EVO = 'EVO',
  FIRST_DATA = 'FIRST_DATA',
  GLOBAL_PAYMENTS = 'GLOBAL_PAYMENTS',
  HEARTLAND_PAYMENT_SYSTEM = 'HEARTLAND_PAYMENT_SYSTEM',
  ELAVON = 'ELAVON',
  MERCURY = 'MERCURY',
  MONERIS = 'MONERIS',
  PAYPAL = 'PAYPAL',
  ELAVON_MX = 'ELAVON_MX',
  STRIPE = 'STRIPE',
  TSYS = 'TSYS',
  VANTIV = 'VANTIV',
  WORLDPAY = 'WORLDPAY',
  EPX = 'EPX',
  WEPAY = 'WEPAY',
  MASHREQ = 'MASHREQ',
  AXIS = 'AXIS',
  KARTUKU = 'KARTUKU',
  NEXI = 'NEXI',
  DANA = 'DANA',
  MYNT = 'MYNT',
  POYNT = 'POYNT',
  NUVEI = 'NUVEI',
  NPAY = 'NPAY',
  BRIDGEPAY = 'BRIDGEPAY',
  CONVERGE = 'CONVERGE',
  MOCK = 'MOCK',
  NA_BANCARD = 'NA_BANCARD',
  CREDITCALL = 'CREDITCALL',
  ELAVON_EU = 'ELAVON_EU',
  FUSEBOX = 'FUSEBOX',
  EVERTEC = 'EVERTEC',
  GHL = 'GHL',
  RS2 = 'RS2',
  JCN = 'JCN',
  PRISMA = 'PRISMA',
  VANTIV_EXPRESS = 'VANTIV_EXPRESS',
  EZETAP = 'EZETAP',
  ADYEN = 'ADYEN',
  MERCADOPAGO = 'MERCADOPAGO',
  LETGO = 'LETGO',
  CHECK_COMMERCE = 'CHECK_COMMERCE',
  SQUARE = 'SQUARE',
  OFFLINE = 'OFFLINE',
}

export function useConfirmCheckout() {
  const {
    session,
    jwt,
    setIsConfirmingCheckout,
    isConfirmingCheckout,
    setCheckoutErrors,
  } = useCheckoutContext();
  const { apiHost } = useGoDaddyContext();
  const form = useFormContext();

  return useMutation({
    mutationFn: async (
      input: ConfirmCheckoutMutationInput['input'] & {
        paymentProvider: PaymentProvider;
        isExpress?: boolean;
      }
    ) => {
      if (!session || !input?.paymentType || isConfirmingCheckout) return;

      const { isExpress, ...confirmCheckoutInput } = input;

      const isPickup =
        form.getValues('deliveryMethod') === DeliveryMethods.PICKUP &&
        !isExpress;

      const pickUpData = isPickup
        ? buildPickupPayload({
            pickupDate: form.getValues('pickupDate'),
            pickupTime: form.getValues('pickupTime'),
            pickupLocationId: form.getValues('pickupLocationId'),
            leadTime: form.getValues('pickupLeadTime') || 0,
            timezone: form.getValues('pickupTimezone') || 'UTC',
          })
        : {};

      // keep for debugging
      // console.log({
      // 	pickupDate: form.getValues("pickupDate"),
      // 	pickupTime: form.getValues("pickupTime"),
      // 	pickupLocationId: form.getValues("pickupLocationId"),
      // 	leadTime: form.getValues("pickupLeadTime") || 0,
      // 	timezone: form.getValues("pickupTimezone") || "UTC",
      // 	pickUpData,
      // });

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
            {
              ...confirmCheckoutInput,
              ...(isPickup ? pickUpData : {}),
            },
            { accessToken: jwt, sessionId: session?.id || '' },
            apiHost
          )
        : await confirmCheckout(
            {
              ...confirmCheckoutInput,
              ...(isPickup ? pickUpData : {}),
            },
            session,
            apiHost
          );
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

      /* Track checkout completed event - if we have a specific event for express checkout */
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
      // Track checkout error event
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
  });
}
