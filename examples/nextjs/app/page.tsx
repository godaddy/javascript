import { createCheckoutSession } from '@godaddy/react/server';
import { unstable_noStore } from 'next/cache';
import { notFound } from 'next/navigation';
import { CheckoutPage } from './checkout';

export const dynamic = 'force-dynamic';

export default async function Home() {
  unstable_noStore();
  const session = await createCheckoutSession(
    {
      returnUrl: 'https://godaddy.com',
      successUrl: 'https://godaddy.com/success',
      draftOrderId: process.env.NEXT_PUBLIC_GODADDY_DRAFT_ORDER_ID || '',
      storeId: process.env.NEXT_PUBLIC_GODADDY_STORE_ID || '',
      channelId: process.env.NEXT_PUBLIC_GODADDY_CHANNEL_ID || '',
      enableLocalPickup: true,
      enableShippingAddressCollection: true,
      enableBillingAddressCollection: true,
      enablePhoneCollection: true,
      enableTaxCollection: true,
      enableNotesCollection: true,
      enablePromotionCodes: true,
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
        ach: {
          processor: 'godaddy',
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
      operatingHours: {
        default: {
          timeZone: 'America/New_York', // CDT timezone
          leadTime: 60, // 60 minutes lead time
          pickupWindowInDays: 7,
          hours: {
            monday: { enabled: true, openTime: '09:00', closeTime: '17:00' },
            tuesday: { enabled: true, openTime: '09:00', closeTime: '17:00' },
            wednesday: { enabled: false, openTime: null, closeTime: null },
            thursday: { enabled: true, openTime: '09:00', closeTime: '17:00' },
            friday: { enabled: true, openTime: '09:00', closeTime: '18:00' },
            saturday: { enabled: true, openTime: '10:00', closeTime: '16:00' },
            sunday: { enabled: true, openTime: '12:00', closeTime: '15:00' },
          },
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
    throw notFound();
  }

  return <CheckoutPage session={session} />;
}
