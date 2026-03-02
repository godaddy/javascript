'use server';

import https from 'node:https';
import { createCheckoutSession } from '@godaddy/react/server';
import { redirect } from 'next/navigation';

export async function getSellingSellingPlans(
  storeId: string,
  options: { skuIds?: string[]; skuGroupIds?: string[] } = {}
) {
  const baseUrl = (
    process.env.SELLING_PLANS_API_URL?.trim() || 'https://localhost:8443'
  ).replace(/\/$/, '');
  const url = new URL(`${baseUrl}/api/v1/selling-plans/${storeId}/groups`);

  if (options.skuIds?.length) {
    for (const id of options.skuIds) {
      url.searchParams.append('skuIds', id);
    }
  }

  if (options.skuGroupIds?.length) {
    for (const id of options.skuGroupIds) {
      url.searchParams.append('skuGroupIds', id);
    }
  }

  const isLocalHttps =
    url.protocol === 'https:' &&
    (url.hostname === 'localhost' || url.hostname === '127.0.0.1');

  try {
    let res: Response;
    if (isLocalHttps && process.env.NODE_ENV === 'development') {
      const { body, status } = await new Promise<{ body: string; status: number }>(
        (resolve, reject) => {
          https
            .get(url.toString(), { rejectUnauthorized: false }, (r) => {
              let data = '';
              r.on('data', (chunk) => (data += chunk));
              r.on('end', () =>
                resolve({ body: data, status: r.statusCode ?? 0 })
              );
              r.on('error', reject);
            })
            .on('error', reject);
        }
      );
      res = new Response(body, {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      res = await fetch(url.toString(), {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
    }
    if (!res.ok) {
      throw new Error(
        `Selling plans API error: ${res.status} ${res.statusText}`
      );
    }
    return res.json();
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      return { groups: [] };
    }
    throw err;
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
