import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  redirectToSuccessUrl,
  useCheckoutContext,
} from '@/components/checkout/checkout';
import { DeliveryMethods } from '@/components/checkout/delivery/delivery-methods';
import {
  type DraftOrderSession,
  useDraftOrder,
} from '@/components/checkout/order/use-draft-order';
import { useFlushCheckoutSync } from '@/components/checkout/payment/utils/use-flush-checkout-sync';
import { buildPickupPayload } from '@/components/checkout/pickup/utils/build-pickup-payload';
import { getPickupMode } from '@/components/checkout/pickup/utils/generate-pickup-time-slots';
import { getShippingFulfillmentSyncKey } from '@/components/checkout/shipping/utils/should-apply-shipping-method';
import { checkoutQueryKeys } from '@/components/checkout/utils/query-keys';
import { useGoDaddyContext } from '@/godaddy-provider';
import { confirmCheckout } from '@/lib/godaddy/godaddy';
import { eventIds } from '@/tracking/events';
import {
  type TrackingEventId,
  TrackingEventType,
  track,
} from '@/tracking/track';
import type { ConfirmCheckoutMutationInput } from '@/types';

export class CheckoutConfirmationBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CheckoutConfirmationBlockedError';
  }
}

export function isCheckoutConfirmationBlockedError(
  error: unknown
): error is CheckoutConfirmationBlockedError {
  return (
    error instanceof CheckoutConfirmationBlockedError ||
    (error instanceof Error &&
      error.name === 'CheckoutConfirmationBlockedError')
  );
}

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
  CCAVENUE = 'CCAVENUE',
}

export function useConfirmCheckout() {
  const { session, jwt, setIsConfirmingCheckout, setCheckoutErrors } =
    useCheckoutContext();
  const { apiHost } = useGoDaddyContext();
  const form = useFormContext();
  const { data: order } = useDraftOrder();
  const queryClient = useQueryClient();
  const flushCheckoutSync = useFlushCheckoutSync();
  const isPendingRef = useRef(false);

  return useMutation({
    mutationFn: async (
      input: ConfirmCheckoutMutationInput['input'] & {
        paymentProvider: PaymentProvider;
        isExpress?: boolean;
      }
    ) => {
      if (!session) {
        throw new Error('Checkout session is unavailable');
      }
      if (!input?.paymentType) {
        throw new Error('Checkout payment type is unavailable');
      }
      if (isPendingRef.current) {
        throw new CheckoutConfirmationBlockedError(
          'Checkout confirmation is already in progress'
        );
      }

      isPendingRef.current = true;

      try {
        const { isExpress, ...confirmCheckoutInput } = input;

        await flushCheckoutSync();

        const deliveryMethod = form.getValues('deliveryMethod');
        const isPickup =
          deliveryMethod === DeliveryMethods.PICKUP && !isExpress;
        const isShipping =
          deliveryMethod === DeliveryMethods.SHIP && !isExpress;

        const latestDraftOrderSession = session?.id
          ? await queryClient
              .fetchQuery<DraftOrderSession>({
                queryKey: checkoutQueryKeys.draftOrder(session.id),
              })
              .catch(error => {
                setCheckoutErrors(['DRAFT_ORDER_UPDATE_FAILED']);
                throw error;
              })
          : undefined;
        const latestOrder =
          latestDraftOrderSession?.checkoutSession?.draftOrder ?? order;

        const hasShippingLines = (latestOrder?.shippingLines?.length ?? 0) > 0;
        const hasLineItemsMissingShippingFulfillment = Boolean(
          getShippingFulfillmentSyncKey(latestOrder?.lineItems)
        );

        if (
          isShipping &&
          (!hasShippingLines || hasLineItemsMissingShippingFulfillment)
        ) {
          setCheckoutErrors(['MISSING_SHIPPING_INFO']);
          throw new Error('MISSING_SHIPPING_INFO');
        }

        const pickupLocationId = form.getValues('pickupLocationId');
        const pickupStoreHours = pickupLocationId
          ? (session?.locations?.find(
              location => location.id === pickupLocationId
            )?.operatingHours ?? session?.defaultOperatingHours)
          : session?.defaultOperatingHours;
        const pickUpData = isPickup
          ? buildPickupPayload({
              pickupDate: form.getValues('pickupDate'),
              pickupTime: form.getValues('pickupTime'),
              pickupLocationId,
              leadTime: form.getValues('pickupLeadTime') ?? 0,
              timezone: form.getValues('pickupTimezone'),
              defaultTimezone: session?.defaultOperatingHours?.timeZone,
              pickupMode: pickupStoreHours
                ? getPickupMode(pickupStoreHours)
                : undefined,
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

        if (!data) {
          throw new Error('Checkout confirmation failed');
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
    onError: (error: unknown, data) => {
      if (isCheckoutConfirmationBlockedError(error)) return;

      // Track checkout error event
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
