'use client';

import type { CheckoutFormSchema, CheckoutSession } from '@godaddy/react';
import { Checkout } from '@godaddy/react';
import { z } from 'zod';

/* Override the checkout form schema to make shippingPhone required */
const customSchema: CheckoutFormSchema = {
  shippingPhone: z.string().min(1, 'Phone number is required'),
};

export function CheckoutPage({ session }: { session: CheckoutSession }) {
  return (
    <Checkout
      session={session}
      checkoutFormSchema={customSchema}
      squareConfig={
        process.env.NEXT_PUBLIC_SQUARE_APP_ID &&
        process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID
          ? {
              appId: process.env.NEXT_PUBLIC_SQUARE_APP_ID,
              locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
            }
          : undefined
      }
      stripeConfig={
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
          ? {
              publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
            }
          : undefined
      }
      mercadoPagoConfig={
        process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
          ? {
              publicKey: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY,
              country:
                (process.env.NEXT_PUBLIC_MERCADOPAGO_COUNTRY as
                  | 'AR'
                  | 'BR'
                  | 'CO'
                  | 'CL'
                  | 'PE'
                  | 'MX') || 'AR',
            }
          : undefined
      }
      godaddyPaymentsConfig={
        process.env.NEXT_PUBLIC_GODADDY_APP_ID
          ? {
              businessId: process.env.NEXT_PUBLIC_GODADDY_BUSINESS_ID || '',
              appId: process.env.NEXT_PUBLIC_GODADDY_APP_ID,
            }
          : undefined
      }
      paypalConfig={
        process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
          ? {
              clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
            }
          : undefined
      }
      ccavenueConfig={
        process.env.NEXT_PUBLIC_CCAVENUE_ACCESS_CODE_ID &&
        process.env.NEXT_PUBLIC_CCAVENUE_REDIRECT_URL
          ? {
              accessCodeId:
                process.env.NEXT_PUBLIC_CCAVENUE_ACCESS_CODE_ID,
              redirectURL: process.env.NEXT_PUBLIC_CCAVENUE_REDIRECT_URL,
            }
          : undefined
      }
    />
  );
}
