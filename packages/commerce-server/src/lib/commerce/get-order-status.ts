/**
 * Server-side `getOrderStatus` orchestrator.
 *
 * Queries the GoDaddy order storefront subgraph for the status of a draft
 * order and normalises the result into a flat shape suitable for both the
 * `/api/commerce/order-status` HTTP route and any in-process server caller
 * (e.g. `GoDaddyCommerceProvider`).
 *
 * Uses storefront headers (`X-Store-ID` / `X-Client-ID`) — the same auth
 * path as the cart GET routes. No OAuth Bearer token is required.
 *
 * Server-only. Reads `clientId` and `storeId` from `readCommerceConfig()`.
 * Do not import this file from browser code.
 */

import { type CommerceConfiguration, createRuntimeCommerceConfiguration } from './config';
import { gqlRequest, storefrontHeaders } from './gql';
import {
  type GetOrderStatusResult,
  type GetOrderStatusVariables,
  orderStatusQuery,
  orderStorefrontEndpoint,
} from './order-subgraph';

export interface CommerceOrderStatus {
  /** GoDaddy draft order id. */
  id: string;
  /** The order storefront API does not expose payment status; this is 'unknown'. */
  status: string;
  /** Total amount in the currency's smallest unit (cents for USD). */
  amount: number;
  /** ISO 4217 currency code (e.g. "USD"). */
  currency: string;
  /** ISO 8601 creation timestamp. */
  createdAt?: string;
  /** ISO 8601 last-updated timestamp. */
  updatedAt?: string;
  /** Line items on the order. */
  lineItems?: unknown[];
}

export async function getOrderStatus(
  orderId: string,
  configuration: CommerceConfiguration = createRuntimeCommerceConfiguration(),
): Promise<CommerceOrderStatus> {
  if (!orderId) {
    throw new Error('getOrderStatus: orderId is required');
  }

  const { storeId, clientId, apiBaseUrl } = configuration.read();

  const data = await gqlRequest<GetOrderStatusResult, GetOrderStatusVariables>({
    endpoint: orderStorefrontEndpoint({ apiBaseUrl }),
    query: orderStatusQuery,
    variables: { id: orderId },
    headers: storefrontHeaders({ storeId, clientId }),
  });

  const order = data.orderById;
  if (!order?.id) {
    throw new Error(`Order not found: ${orderId}`);
  }

  const total = order.totals?.total;

  return {
    id: order.id,
    status: 'unknown',
    amount: total?.value ?? 0,
    currency: total?.currencyCode ?? 'USD',
    createdAt: order.createdAt ?? undefined,
    updatedAt: order.updatedAt ?? undefined,
    lineItems: (order.lineItems ?? []) as unknown[],
  };
}
