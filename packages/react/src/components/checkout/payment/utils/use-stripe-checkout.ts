import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import type { StripeExpressCheckoutElementConfirmEvent } from '@stripe/stripe-js';
import { useCallback, useState } from 'react';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useBuildPaymentRequest } from '@/components/checkout/payment/utils/use-build-payment-request';
import {
  PaymentProvider,
  useConfirmCheckout,
} from '@/components/checkout/payment/utils/use-confirm-checkout';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';
import type {
  CalculatedAdjustments,
  CalculatedTaxes,
  ShippingMethod,
} from '@/types';
import { PaymentMethodType } from '@/types';

type UseStripeCheckoutOptions = {
  mode: 'card' | 'express';
  clientSecret?: string | null;
};

// Express checkout data to pass to confirmCheckout
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
  const { setCheckoutErrors } = useCheckoutContext();
  const { stripePaymentExpressRequest } = useBuildPaymentRequest();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleSubmit = useCallback(
    async (expressData?: StripeExpressCheckoutData) => {
      setIsProcessingPayment(true);
      try {
        if (!stripe || !elements) {
          return;
        }

        if (mode === 'card') {
          const cardElement = elements.getElement(CardElement);

          if (!cardElement) {
            return;
          }

          const { paymentMethod, error } = await stripe.createPaymentMethod({
            card: cardElement,
            type: 'card',
          });

          if (error) {
            setCheckoutErrors([error.code || 'TRANSACTION_PROCESSING_FAILED']);
            return;
          }

          if (paymentMethod) {
            try {
              await confirmCheckout.mutateAsync({
                paymentToken: paymentMethod.id,
                paymentType: PaymentMethodType.CREDIT_CARD,
                paymentProvider: PaymentProvider.STRIPE,
              });
            } catch (err: unknown) {
              if (err instanceof GraphQLErrorWithCodes) {
                setCheckoutErrors(err.codes);
              }
              // Other errors are silently ignored
            }
          } else {
            setCheckoutErrors(['TRANSACTION_PROCESSING_FAILED']);
          }
        }

        if (mode === 'express') {
          const { error, paymentMethod } = await stripe.createPaymentMethod({
            elements,
            params: stripePaymentExpressRequest,
          });

          if (error) {
            setCheckoutErrors([error.code || 'TRANSACTION_PROCESSING_FAILED']);
            return;
          }

          if (paymentMethod) {
            try {
              // Build the checkout body similar to godaddy.tsx
              const event = expressData?.event;
              const currencyCode =
                expressData?.shippingTotal?.currencyCode || 'USD';

              const walletType = paymentMethod.card?.wallet?.type;
              const paymentType =
                walletType || event?.expressPaymentType || 'card';

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

              await confirmCheckout.mutateAsync({
                paymentToken: paymentMethod.id,
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
              });
            } catch (err: unknown) {
              if (err instanceof GraphQLErrorWithCodes) {
                setCheckoutErrors(err.codes);
              }
              throw err; // Re-throw so caller can handle
            }
          } else {
            setCheckoutErrors(['TRANSACTION_PROCESSING_FAILED']);
          }
        }

        return { success: false, error: `Mode not supported: ${mode}` };
      } finally {
        setIsProcessingPayment(false);
      }
    },
    [mode, stripe, elements, confirmCheckout.mutateAsync, setCheckoutErrors]
  );

  return {
    handleSubmit,
    isProcessingPayment,
  };
}
