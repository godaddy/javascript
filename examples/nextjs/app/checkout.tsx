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
      squareConfig={{
        appId: process.env.NEXT_PUBLIC_SQUARE_APP_ID || '',
        locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || '',
      }}
      stripeConfig={{
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
      }}
      godaddyPaymentsConfig={{
        businessId: process.env.NEXT_PUBLIC_GODADDY_BUSINESS_ID || '',
        appId: process.env.NEXT_PUBLIC_GODADDY_APP_ID || '',
      }}
      paypalConfig={{
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
      }}
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
