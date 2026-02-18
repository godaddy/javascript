'use server';

import { createCheckoutSession } from '@godaddy/react/server';
import { redirect } from 'next/navigation';

export async function checkoutWithOrder(orderId: string) {
  const session = await createCheckoutSession(
    {
      returnUrl: `https://godaddy.com`,
      successUrl: `https://godaddy.com/success`,
      draftOrderId: orderId,
      storeId: process.env.NEXT_PUBLIC_GODADDY_STORE_ID || '',
      channelId: process.env.NEXT_PUBLIC_GODADDY_CHANNEL_ID || '',
      enableShippingAddressCollection: true,
      enableBillingAddressCollection: true,
      enableTaxCollection: true,
      shipping: {
        fulfillmentLocationId: 'default-location',
        originAddress: {
          addressLine1: '1600 Pennsylvania Ave NW',
          adminArea1: 'DC',
          adminArea3: 'Washington',
          countryCode: 'US',
          postalCode: '20500',
        },
      },
      taxes: {
        originAddress: {
          addressLine1: '1600 Pennsylvania Ave NW',
          adminArea1: 'DC',
          adminArea3: 'Washington',
          countryCode: 'US',
          postalCode: '20500',
        },
      },
      locations: [
        {
          id: 'default-location',
          isDefault: true,
          address: {
            addressLine1: '1600 Pennsylvania Ave NW',
            adminArea1: 'DC',
            adminArea3: 'Washington',
            countryCode: 'US',
            postalCode: '20500',
          },
        },
      ],
      paymentMethods: {
        card: {
          processor: 'godaddy',
          checkoutTypes: ['standard'],
        },
        ccavenue: {
          processor: 'ccavenue',
          checkoutTypes: ['standard'],
        },
        express: {
          processor: 'godaddy',
          checkoutTypes: ['express'],
        },
        paypal: {
          processor: 'paypal',
          checkoutTypes: ['standard'],
        },
        offline: {
          processor: 'offline',
          checkoutTypes: ['standard'],
        },
      },
    },
    {
      auth: {
        clientId: process.env.NEXT_PUBLIC_GODADDY_CLIENT_ID || '',
        clientSecret: process.env.GODADDY_CLIENT_SECRET || '',
      },
    }
  );

  if (!session) {
    throw new Error('Failed to create checkout session');
  }

  console.log({ session });

  if (!session.url) {
    throw new Error('No checkout URL returned');
  }

  redirect(session.url);
}
