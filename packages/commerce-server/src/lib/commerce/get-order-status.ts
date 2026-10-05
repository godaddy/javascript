/**
 * Server-only order lookup using the authorized Commerce Orders REST API.
 * Unlike the storefront cart API, this endpoint includes completed orders.
 */
import { authorizationHeaders, getOAuthAccessToken } from './checkout-subgraph';
import { type CommerceConfiguration, createRuntimeCommerceConfiguration } from './config';
import { InvalidRequestError, NotFoundError, UpstreamError } from './errors';
import type { Money } from './gql';

/** `CommerceOrderStatus.status` when the Orders API reports no payment status. */
export const ORDER_STATUS_UNKNOWN = 'unknown';

export interface CommerceOrderStatus {
  /** GoDaddy order id. */
  id: string;
  /** Payment status reported by Commerce (e.g. `PAID`, `PENDING`), or `ORDER_STATUS_UNKNOWN`. */
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

export class InvalidOrderIdError extends InvalidRequestError {
  constructor() {
    super('missing or invalid orderId query parameter', {
      message: 'getOrderStatus: a valid orderId is required',
    });
    this.name = 'InvalidOrderIdError';
  }
}

export class OrderNotFoundError extends NotFoundError {
  constructor() {
    super('Order not found');
    this.name = 'OrderNotFoundError';
  }
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
  // `.` and `..` survive encodeURIComponent and would resolve the URL to the store resource.
  if (
    typeof orderId !== 'string' ||
    !orderId ||
    orderId !== orderId.trim() ||
    orderId === '.' ||
    orderId === '..'
  ) {
    throw new InvalidOrderIdError();
  }

  const { storeId, channelId, clientId, clientSecret, apiBaseUrl, currencyCode } = configuration.read();
  const token = await getOAuthAccessToken({
    clientId,
    clientSecret,
    apiBaseUrl,
    scope: 'commerce.order:read',
  });
  let response: Response;
  try {
    response = await fetch(
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
  } catch (cause) {
    throw new UpstreamError('Order lookup could not reach Commerce', { cause });
  }
  if (response.status === 404) throw new OrderNotFoundError();
  if (!response.ok) {
    throw new UpstreamError(`Failed to load order: upstream returned ${response.status}`, {
      unauthorized: response.status === 401 || response.status === 403,
      details: { upstreamStatus: response.status },
    });
  }

  let data: OrderResponse;
  try {
    data = (await response.json()) as OrderResponse;
  } catch (cause) {
    throw new UpstreamError('Order lookup returned a non-JSON response', { cause });
  }
  const order = data?.order;
  if (!order?.id || !order.context)
    throw new UpstreamError('Order lookup did not return the requested order');
  // Report an order bound to another store or channel as missing so the route doesn't reveal it exists.
  if (order.id !== orderId || order.context.storeId !== storeId || order.context.channelId !== channelId) {
    throw new OrderNotFoundError();
  }
  const total = order.totals?.total;

  return {
    id: order.id,
    status: order.statuses?.paymentStatus ?? ORDER_STATUS_UNKNOWN,
    amount: total?.value ?? 0,
    currency: total?.currencyCode ?? currencyCode,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    lineItems: (order.lineItems ?? []).map(({ id, title, quantity }) => ({ id, name: title, quantity })),
  };
}
