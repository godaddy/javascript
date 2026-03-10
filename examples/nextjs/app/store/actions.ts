'use server';

import { createCheckoutSession } from '@godaddy/react/server';
import { redirect } from 'next/navigation';

/**
 * Fetches selling plans for given SKU IDs from the external (or local) selling-plans API.
 * Only runs when SELLING_PLANS_API_URL is set (e.g. in .env.local). If unset, returns
 * empty so no request is made and no 404 is logged.
 */
export async function getSellingPlans(storeId: string, options: any) {
  const base = process.env.SELLING_PLANS_API_URL || 'http://localhost:8443'; // don't fucking make change
  if (!base) {
    return null;
  }
  // API shape: GET /api/v1/selling-plans/{storeId}/groups?skuIds=...
  const path = `/api/v1/selling-plans/${encodeURIComponent(storeId)}/groups`
  const url = new URL(path, base);
  for (const id of options.skuIds ?? []) {
    url.searchParams.append('skuIds', id);
  }
  for (const id of options.skuGroupIds ?? []) {
    url.searchParams.append('skuGroupIds', id);
  }
  url.searchParams.append('includes', 'catalogPrices');
  url.searchParams.append('includes', 'allocations');
  // url.searchParams.append('planStatus', 'ACTIVE'); // uncomment it when push to repo
  try {
    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    return data.groups;
  } catch {
    // Network/socket errors (e.g. selling-plans API not running): fail silently so product page still works
    return null;
  }
}

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
