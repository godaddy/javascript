/**
 * Server-only order lookup using the authorized Commerce Orders REST API.
 * Unlike the storefront cart API, this endpoint includes completed orders.
 */
import { authorizationHeaders, getOAuthAccessToken } from './checkout-subgraph';
import { type CommerceConfiguration, createRuntimeCommerceConfiguration } from './config';
import type { Money } from './gql';

export interface CommerceOrderStatus {
  /** GoDaddy order id. */
  id: string;
  /** Payment status reported by Commerce, or 'unknown' when it is unavailable. */
  status: string;
  /** Total amount in the currency's smallest unit (cents for USD). */
  amount: number;
  /** ISO 4217 currency code (e.g. "USD"). */
  currency: string;
  /** ISO 8601 creation timestamp. */
  createdAt?: string;
  /** ISO 8601 last-updated timestamp. */
  updatedAt?: string;
  /** Line item summaries, excluding private order metadata. */
  lineItems?: unknown[];
}

interface OrderResponse {
  order?: {
    id: string;
    context: { storeId: string; channelId: string };
    statuses?: { paymentStatus?: string | null };
    totals?: { total?: Money | null };
    createdAt?: string;
    updatedAt?: string;
    lineItems?: Array<{ id: string; title: string; quantity: number }>;
  };
}

export async function getOrderStatus(
  orderId: string,
  configuration: CommerceConfiguration = createRuntimeCommerceConfiguration(),
): Promise<CommerceOrderStatus> {
  if (typeof orderId !== 'string' || !orderId.trim() || orderId === '.' || orderId === '..') {
    throw new Error('getOrderStatus: a valid orderId is required');
  }

  const { storeId, channelId, clientId, clientSecret, apiBaseUrl, currencyCode } = configuration.read();
  const token = await getOAuthAccessToken({
    clientId,
    clientSecret,
    apiBaseUrl,
    scope: 'commerce.order:read',
  });
  const response = await fetch(
    new URL(
      `/v1/commerce/stores/${encodeURIComponent(storeId)}/orders/${encodeURIComponent(orderId)}`,
      apiBaseUrl,
    ),
    {
      method: 'GET',
      headers: { ...authorizationHeaders({ accessToken: token.access_token }), Accept: 'application/json' },
      cache: 'no-store',
    },
  );
  if (!response.ok) throw new Error(`Failed to load order: upstream returned ${response.status}`);

  const data = (await response.json()) as OrderResponse;
  const order = data?.order;
  if (!order?.id || order.id !== orderId) throw new Error('Order lookup did not return the requested order');
  if (order.context?.storeId !== storeId || order.context?.channelId !== channelId) {
    throw new Error('Order lookup returned a different store or channel');
  }
  const total = order.totals?.total;

  return {
    id: order.id,
    status: order.statuses?.paymentStatus ?? 'unknown',
    amount: total?.value ?? 0,
    currency: total?.currencyCode ?? currencyCode,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    lineItems: (order.lineItems ?? []).map(({ id, title, quantity }) => ({ id, name: title, quantity })),
  };
}
