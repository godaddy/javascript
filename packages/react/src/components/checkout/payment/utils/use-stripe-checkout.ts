import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import type {
  PaymentMethodCreateParams,
  StripeExpressCheckoutElementConfirmEvent,
} from '@stripe/stripe-js';
import { useCallback, useRef, useState } from 'react';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useBuildPaymentRequest } from '@/components/checkout/payment/utils/use-build-payment-request';
import {
  isCheckoutConfirmationBlockedError,
  PaymentProvider,
  useConfirmCheckout,
} from '@/components/checkout/payment/utils/use-confirm-checkout';
import { useConfirmExpressCheckout } from '@/components/checkout/payment/utils/use-confirm-express-checkout';
import { useFlushCheckoutSync } from '@/components/checkout/payment/utils/use-flush-checkout-sync';
import {
  GraphQLErrorWithCodes,
  getPaymentActionRequiredResult,
} from '@/lib/graphql-with-errors';
import { eventIds } from '@/tracking/events';
import { TrackingEventType, track } from '@/tracking/track';
import type {
  CalculatedAdjustments,
  CalculatedTaxes,
  DraftOrder,
  ShippingMethod,
} from '@/types';
import { PaymentMethodType } from '@/types';
import {
  getStripeNextAction,
  stripeCheckoutErrorCode,
} from './stripe-next-action';
import { usePendingStripeIntent } from './stripe-provider';

function confirmationErrorCodes(error: unknown): string[] {
  if (
    error instanceof GraphQLErrorWithCodes &&
    error.codes.length &&
    !getPaymentActionRequiredResult(error) &&
    !error.codes.includes('PAYMENT_ACTION_REQUIRED')
  ) {
    return error.codes;
  }
  return ['TRANSACTION_PROCESSING_FAILED'];
}

type UseStripeCheckoutOptions = {
  mode: 'card' | 'express';
  clientSecret?: string | null;
};

// Express checkout data to pass to confirmCheckout
export function buildStripeExpressPaymentMethodParams(
  billingDetails:
    | StripeExpressCheckoutElementConfirmEvent['billingDetails']
    | null
    | undefined
): PaymentMethodCreateParams {
  return {
    billing_details: {
      name: billingDetails?.name || undefined,
      email: billingDetails?.email || undefined,
      phone: billingDetails?.phone || undefined,
      address: {
        line1: billingDetails?.address?.line1 || undefined,
        line2: billingDetails?.address?.line2 || undefined,
        city: billingDetails?.address?.city || undefined,
        state: billingDetails?.address?.state || undefined,
        postal_code: billingDetails?.address?.postal_code || undefined,
        country: billingDetails?.address?.country || undefined,
      },
    },
  };
}

export type StripeExpressCheckoutData = {
  // Stripe confirm event data
  event: StripeExpressCheckoutElementConfirmEvent;
  // Calculated values from express checkout flow
  calculatedTaxes?: CalculatedTaxes | null;
  calculatedAdjustments?: CalculatedAdjustments | null;
  // Shipping info
  shippingTotal?: {
    currencyCode: string;
    value: number;
  } | null;
  selectedShippingMethod?: ShippingMethod | null;
};

export function useStripeCheckout({ mode }: UseStripeCheckoutOptions) {
  const stripe = useStripe();
  const elements = useElements();
  const confirmCheckout = useConfirmCheckout();
  const confirmExpressCheckout = useConfirmExpressCheckout();
  const { session, setCheckoutErrors, setIsConfirmingCheckout } =
    useCheckoutContext();
  const { stripePaymentMethodParams, buildPaymentRequestsFromOrder } =
    useBuildPaymentRequest();
  const flushCheckoutSync = useFlushCheckoutSync();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const isSubmittingRef = useRef(false);
  const pendingIntent = usePendingStripeIntent();

  const handleSubmit = useCallback(
    async (
      expressData?: StripeExpressCheckoutData,
      resolvedOrder?: DraftOrder | null
    ) => {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;
      setIsProcessingPayment(true);
      try {
        if (!stripe || !elements) {
          return;
        }

        if (pendingIntent.current?.sessionId !== session?.id) {
          pendingIntent.current = null;
        }

        // Both card and express payments resume the same intent after authentication.
        const confirmWithNextAction = async (
          paymentToken: string,
          paymentType: string,
          confirm: (token: string) => Promise<unknown>
        ) => {
          try {
            await confirm(paymentToken);
            pendingIntent.current = null;
          } catch (error) {
            if (isCheckoutConfirmationBlockedError(error)) throw error;
            const nextAction = getStripeNextAction(error);
            if (!nextAction) throw error;

            // Keep the reference even if the SDK loses its response after payment completes.
            pendingIntent.current = {
              sessionId: session?.id,
              id: nextAction.paymentReference,
              paymentType,
            };
            track({
              eventId: eventIds.paymentChallengeStarted,
              type: TrackingEventType.EVENT,
              properties: { provider: 'STRIPE' },
            });
            let challengeSucceeded = false;
            try {
              const actionResult = await stripe.handleNextAction({
                clientSecret: nextAction.clientSecret,
              });
              if (
                actionResult.error ||
                actionResult.paymentIntent?.id !==
                  nextAction.paymentReference ||
                ![
                  'succeeded',
                  'processing',
                  'requires_capture',
                  'requires_confirmation',
                ].includes(actionResult.paymentIntent.status)
              ) {
                const intent =
                  actionResult.paymentIntent ??
                  actionResult.error?.payment_intent;
                // Only a definite unpaid outcome permits a replacement payment.
                if (
                  intent?.id === nextAction.paymentReference &&
                  ['requires_payment_method', 'canceled'].includes(
                    intent.status
                  )
                ) {
                  pendingIntent.current = null;
                }
                throw new GraphQLErrorWithCodes([
                  {
                    code: actionResult.error
                      ? stripeCheckoutErrorCode(actionResult.error.code)
                      : 'AUTHORIZATION_FAILED',
                  },
                ]);
              }

              challengeSucceeded = true;
              await confirm(actionResult.paymentIntent.id);
              pendingIntent.current = null;
            } finally {
              track({
                eventId: eventIds.paymentChallengeCompleted,
                type: TrackingEventType.EVENT,
                properties: { provider: 'STRIPE', success: challengeSucceeded },
              });
            }
          }
        };

        if (mode === 'card') {
          let paymentToken = pendingIntent.current?.id;
          if (!paymentToken) {
            const cardElement = elements.getElement(CardElement);

            if (!cardElement) {
              return;
            }

            const latestOrder =
              resolvedOrder ??
              (
                await flushCheckoutSync({
                  includeCurrentFormDiff: true,
                })
              ).latestOrder;
            const { paymentMethod, error } = await stripe.createPaymentMethod({
              ...(latestOrder
                ? buildPaymentRequestsFromOrder(latestOrder)
                    .stripePaymentMethodParams
                : stripePaymentMethodParams),
              card: cardElement,
              type: 'card',
            });

            if (error) {
              setCheckoutErrors([stripeCheckoutErrorCode(error.code)]);
              return;
            }
            paymentToken = paymentMethod?.id;
          }

          if (paymentToken) {
            const confirmInput = {
              paymentToken,
              paymentType: PaymentMethodType.CREDIT_CARD,
              paymentProvider: PaymentProvider.STRIPE,
            };

            try {
              await confirmWithNextAction(
                paymentToken,
                confirmInput.paymentType,
                token =>
                  confirmCheckout.mutateAsync({
                    ...confirmInput,
                    paymentToken: token,
                  })
              );
            } catch (error) {
              if (isCheckoutConfirmationBlockedError(error)) return;
              setCheckoutErrors(confirmationErrorCodes(error));
              setIsConfirmingCheckout(false);
            }
          } else {
            setCheckoutErrors(['TRANSACTION_PROCESSING_FAILED']);
          }
        }

        if (mode === 'express') {
          let paymentToken = pendingIntent.current?.id;
          let paymentType = pendingIntent.current?.paymentType;
          if (!paymentToken) {
            const { error, paymentMethod } = await stripe.createPaymentMethod({
              elements,
              params: buildStripeExpressPaymentMethodParams(
                expressData?.event.billingDetails
              ),
            });
            if (error || !paymentMethod) {
              const code = stripeCheckoutErrorCode(error?.code);
              setCheckoutErrors([code]);
              throw new GraphQLErrorWithCodes([{ code }]);
            }
            paymentToken = paymentMethod.id;
            paymentType = paymentMethod.card?.wallet?.type;
          }

          if (paymentToken) {
            try {
              const event = expressData?.event;
              const currencyCode =
                expressData?.shippingTotal?.currencyCode || 'USD';
              paymentType = paymentType || event?.expressPaymentType || 'card';

              // Map Stripe billing details to checkout format
              const billing = event?.billingDetails
                ? {
                    email: event.billingDetails.email || '',
                    phone: event.billingDetails.phone || '',
                    firstName: event.billingDetails.name?.split(' ')?.[0] || '',
                    lastName:
                      event.billingDetails.name
                        ?.split(' ')
                        .slice(1)
                        .join(' ') || '',
                    address: {
                      countryCode: event.billingDetails.address?.country || '',
                      postalCode:
                        event.billingDetails.address?.postal_code || '',
                      adminArea1: event.billingDetails.address?.state || '',
                      adminArea2: event.billingDetails.address?.city || '',
                      addressLine1: event.billingDetails.address?.line1 || '',
                      addressLine2: event.billingDetails.address?.line2 || '',
                    },
                  }
                : undefined;

              // Map Stripe shipping address to checkout format
              const shipping = event?.shippingAddress
                ? {
                    email: event.billingDetails?.email || '',
                    phone: event.billingDetails?.phone || '',
                    firstName:
                      event.shippingAddress.name?.split(' ')?.[0] || '',
                    lastName:
                      event.shippingAddress.name
                        ?.split(' ')
                        .slice(1)
                        .join(' ') || '',
                    address: {
                      countryCode: event.shippingAddress.address?.country || '',
                      postalCode:
                        event.shippingAddress.address?.postal_code || '',
                      adminArea1: event.shippingAddress.address?.state || '',
                      adminArea2: event.shippingAddress.address?.city || '',
                      addressLine1: event.shippingAddress.address?.line1 || '',
                      addressLine2: event.shippingAddress.address?.line2 || '',
                    },
                  }
                : undefined;

              // Build shipping lines from selected shipping method
              const shippingLines = expressData?.selectedShippingMethod
                ? [
                    {
                      amount: expressData.shippingTotal || {
                        currencyCode,
                        value: 0,
                      },
                      name:
                        expressData.selectedShippingMethod.displayName || '',
                      requestedProvider:
                        expressData.selectedShippingMethod.carrierCode || '',
                      requestedService:
                        expressData.selectedShippingMethod.serviceCode || '',
                      totals: {
                        subTotal: expressData.shippingTotal || {
                          currencyCode,
                          value: 0,
                        },
                        taxTotal: {
                          value: 0,
                          currencyCode,
                        },
                      },
                    },
                  ]
                : undefined;

              const confirmInput = {
                paymentToken,
                paymentType,
                paymentProvider: PaymentProvider.STRIPE,
                isExpress: true,
                // Include shipping total if available
                ...(expressData?.shippingTotal
                  ? { shippingTotal: expressData.shippingTotal }
                  : {}),
                // Include calculated taxes if available
                ...(expressData?.calculatedTaxes
                  ? { calculatedTaxes: expressData.calculatedTaxes }
                  : {}),
                // Include calculated adjustments (discounts) if available
                ...(expressData?.calculatedAdjustments
                  ? { calculatedAdjustments: expressData.calculatedAdjustments }
                  : {}),
                // Include billing address if available
                ...(billing ? { billing } : {}),
                // Include shipping address if available
                ...(shipping ? { shipping } : {}),
                // Include shipping lines if available
                ...(shippingLines ? { shippingLines } : {}),
              };
              await confirmWithNextAction(paymentToken, paymentType, token =>
                confirmExpressCheckout.mutateAsync({
                  ...confirmInput,
                  paymentToken: token,
                })
              );
              if (event) {
                track({
                  eventId: eventIds.expressCheckoutCompleted,
                  type: TrackingEventType.EVENT,
                  properties: {
                    paymentType: event.expressPaymentType,
                    provider: 'stripe',
                  },
                });
              }
            } catch (err: unknown) {
              if (isCheckoutConfirmationBlockedError(err)) throw err;
              setCheckoutErrors(confirmationErrorCodes(err));
              setIsConfirmingCheckout(false);
              throw err; // Re-throw so caller can handle
            }
          } else {
            setCheckoutErrors(['TRANSACTION_PROCESSING_FAILED']);
          }
        }

        return { success: false, error: `Mode not supported: ${mode}` };
      } finally {
        isSubmittingRef.current = false;
        setIsProcessingPayment(false);
      }
    },
    [
      mode,
      pendingIntent,
      session?.id,
      stripe,
      elements,
      confirmCheckout.mutateAsync,
      flushCheckoutSync,
      buildPaymentRequestsFromOrder,
      confirmExpressCheckout.mutateAsync,
      setCheckoutErrors,
      setIsConfirmingCheckout,
      stripePaymentMethodParams,
    ]
  );

  return {
    handleSubmit,
    isProcessingPayment,
  };
}
