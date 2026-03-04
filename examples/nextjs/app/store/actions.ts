'use server';

import { createCheckoutSession } from '@godaddy/react/server';
import { redirect } from 'next/navigation';

/** Selling plan from external API (or local in dev). */
export type SellingPlanOption = {
  planId: string;
  name?: string;
  category?: string;
  [key: string]: unknown;
};

export type SellingPlanGroup = {
  sellingPlans: SellingPlanOption[];
  [key: string]: unknown;
};

export type GetSellingPlansResponse = {
  sellingPlanGroups?: SellingPlanGroup[];
  [key: string]: unknown;
};

/**
 * Fetches selling plans for given SKU IDs from the external (or local) selling-plans API.
 * Only runs when SELLING_PLANS_API_URL is set (e.g. in .env.local). If unset, returns
 * empty so no request is made and no 404 is logged.
 */
export async function getSellingPlans(
  storeId: string,
  options: { skuIds: string[] }
): Promise<GetSellingPlansResponse> {
  const base = process.env.SELLING_PLANS_API_URL || 'http://localhost:8443'; // don't fucking make change
  if (!base) {
    return { sellingPlanGroups: [] };
  }
  // API shape: GET /api/v1/selling-plans/{storeId}/groups?skuIds=...
  const path = `/api/v1/selling-plans/${encodeURIComponent(storeId)}/groups`
  const url = new URL(path, base);
  for (const id of options.skuIds) {
    url.searchParams.append('skuIds', id);
  }
  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) {
    console.warn('getSellingPlans failed', res.status, res.statusText);
    return { sellingPlanGroups: [] };
  }
  const data = await res.json();
  const out = normalizeSellingPlansResponse(data);
  const planCount = out.sellingPlanGroups?.flatMap(g => g.sellingPlans ?? []).length ?? 0;
  if (process.env.NODE_ENV === 'development' && planCount === 0) {
    const keys = typeof data === 'object' && data !== null ? Object.keys(data as object) : [];
    const snippet = typeof data === 'object' ? JSON.stringify(data).slice(0, 400) : String(data);
    console.warn('getSellingPlans: API returned 0 plans. Top-level keys:', keys, '| Response snippet:', snippet + (snippet.length >= 400 ? '...' : ''));
  }
  return out;
}

/** Normalize API response to our shape. Supports: { groups: [ { sellingPlans: [ { planId, name, category } ] } ] } and variants. */
function normalizeSellingPlansResponse(data: unknown): GetSellingPlansResponse {
  if (Array.isArray(data)) {
    return normalizeSellingPlansResponse({ groups: [{ sellingPlans: data }] });
  }
  const obj = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  const payload =
    obj.data !== undefined && typeof obj.data === 'object' && !Array.isArray(obj.data)
      ? (obj.data as Record<string, unknown>)
      : obj;

  // Explicit support for API shape: { groups: [ { groupId, name, sellingPlans: [ { planId, name, category } ] } ], page? }
  const rawGroups: Array<Record<string, unknown>> = Array.isArray(payload.groups)
    ? (payload.groups as Array<Record<string, unknown>>)
    : Array.isArray(payload.sellingPlanGroups)
      ? (payload.sellingPlanGroups as Array<Record<string, unknown>>)
      : Array.isArray(payload.plans)
        ? [{ sellingPlans: payload.plans }]
        : Array.isArray(payload.sellingPlans)
          ? [{ sellingPlans: payload.sellingPlans }]
          : [];

  const sellingPlanGroups: SellingPlanGroup[] = rawGroups.map(g => {
    const rawPlans = (Array.isArray(g.sellingPlans) ? g.sellingPlans : Array.isArray(g.plans) ? g.plans : []) as Array<Record<string, unknown>>;
    const sellingPlans: SellingPlanOption[] = rawPlans
      .map((p: Record<string, unknown>) => ({
        planId: String(p.planId ?? p.plan_id ?? p.id ?? ''),
        name: (p.name as string) ?? (p.title as string),
        category: (p.category as string) ?? (p.category_name as string),
      }))
      .filter(p => p.planId.length > 0);
    return { ...g, sellingPlans };
  });

  return { sellingPlanGroups };
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
