import { once } from 'node:events';
import express from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRuntimeCommerceConfiguration } from './lib/commerce/config';
import { getOrderStatus } from './lib/commerce/get-order-status';
import { createGoDaddyPaymentsRouter } from './router';

const clientFetch = globalThis.fetch;
const environment = {
  GODADDY_OAUTH_CLIENT_ID: 'client-1',
  GODADDY_OAUTH_CLIENT_SECRET: 'secret-1',
  GODADDY_STORE_ID: 'store-1',
  GODADDY_CHANNEL_ID: 'channel-1',
  GODADDY_CURRENCY_CODE: 'GBP',
};
const configuration = createRuntimeCommerceConfiguration({ environment });
const order = {
  id: 'completed-order',
  context: { storeId: 'store-1', channelId: 'channel-1' },
  statuses: { status: 'COMPLETED', paymentStatus: 'PAID', fulfillmentStatus: 'FULFILLED' },
  totals: { total: { value: 2500, currencyCode: 'GBP' } },
  createdAt: '2026-09-22T10:00:00Z',
  updatedAt: '2026-09-22T10:05:00Z',
  lineItems: [{ id: 'line-1', title: 'Mug', quantity: 1, notes: ['Private note'] }],
  billing: { email: 'private@example.com' },
  customerId: 'private-customer',
};
const summary = {
  id: 'completed-order',
  status: 'PAID',
  amount: 2500,
  currency: 'GBP',
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  lineItems: [{ id: 'line-1', name: 'Mug', quantity: 1 }],
};
let upstream: ReturnType<typeof vi.fn<typeof fetch>>;

beforeEach((): void => {
  upstream = vi.fn<typeof fetch>(async (input): Promise<Response> => {
    const url = String(input);
    if (url.endsWith('/v2/oauth2/token'))
      return Response.json({ access_token: 'order-token', expires_in: 3600 });
    if (url.includes('order-storefront-subgraph'))
      return Response.json({
        data: { orderById: null },
        errors: [{ message: 'Order not found', extensions: { code: 'INTERNAL_SERVER_ERROR' } }],
      });
    return Response.json({ order });
  });
  vi.stubGlobal('fetch', upstream);
});
afterEach((): void => {
  vi.unstubAllGlobals();
});

describe('authorized order lookup', () => {
  it('loads a completed order using an order-read token and the store-scoped REST endpoint', async (): Promise<void> => {
    await expect(getOrderStatus(order.id, configuration)).resolves.toEqual(summary);
    expect(upstream).toHaveBeenCalledTimes(2);
    const [tokenUrl, tokenInit] = upstream.mock.calls[0] ?? [];
    expect(String(tokenUrl)).toBe('https://api.godaddy.com/v2/oauth2/token');
    const grant = new URLSearchParams(String(tokenInit?.body));
    expect(grant.get('scope')).toBe('commerce.order:read');
    expect(grant.get('client_secret')).toBe('secret-1');
    const [orderUrl, orderInit] = upstream.mock.calls[1] ?? [];
    expect(String(orderUrl)).toBe(
      'https://api.godaddy.com/v1/commerce/stores/store-1/orders/completed-order',
    );
    expect(orderInit).toMatchObject({ method: 'GET', cache: 'no-store' });
    expect(new Headers(orderInit?.headers).get('Authorization')).toBe('Bearer order-token');
    expect(new Headers(orderInit?.headers).has('X-Client-ID')).toBe(false);
  });

  it('returns HTTP 200 after payment even though the storefront lookup rejects that order', async (): Promise<void> => {
    const app = express();
    app.use('/api/commerce', createGoDaddyPaymentsRouter(configuration));
    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    try {
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('Expected a listening TCP server');
      const response = await clientFetch(
        `http://127.0.0.1:${address.port}/api/commerce/order-status?orderId=${order.id}`,
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true, order: summary });
      expect(upstream.mock.calls.some(([url]) => String(url).includes('storefront'))).toBe(false);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });

  it('uses the host API origin and encodes store and order path segments', async (): Promise<void> => {
    const storeId = 'store/one';
    const orderId = 'order/with?reserved#characters';
    const config = createRuntimeCommerceConfiguration({
      apiBaseUrl: 'https://api.example.com',
      environment: { ...environment, GODADDY_STORE_ID: storeId },
    });
    upstream
      .mockResolvedValueOnce(Response.json({ access_token: 'order-token' }))
      .mockResolvedValueOnce(
        Response.json({ order: { ...order, id: orderId, context: { ...order.context, storeId } } }),
      );
    await expect(getOrderStatus(orderId, config)).resolves.toMatchObject({ id: orderId });
    expect(upstream.mock.calls.map(([url]) => String(url))).toEqual([
      'https://api.example.com/v2/oauth2/token',
      'https://api.example.com/v1/commerce/stores/store%2Fone/orders/order%2Fwith%3Freserved%23characters',
    ]);
  });

  it.each(['PENDING', 'AUTHORIZED', 'PAID', 'REFUNDED', undefined])(
    'uses payment status %s rather than inferring it from order completion',
    async (paymentStatus): Promise<void> => {
      upstream
        .mockResolvedValueOnce(Response.json({ access_token: 'order-token' }))
        .mockResolvedValueOnce(
          Response.json({ order: { ...order, statuses: { status: 'COMPLETED', paymentStatus } } }),
        );
      await expect(getOrderStatus(order.id, configuration)).resolves.toMatchObject({
        status: paymentStatus ?? 'unknown',
      });
    },
  );

  it.each([
    undefined,
    { ...order, id: 'another-order' },
    { ...order, context: { ...order.context, storeId: 'another-store' } },
    { ...order, context: { ...order.context, channelId: 'another-channel' } },
    { ...order, context: undefined },
  ])('rejects missing or mismatched order bindings', async (result): Promise<void> => {
    upstream
      .mockResolvedValueOnce(Response.json({ access_token: 'order-token' }))
      .mockResolvedValueOnce(Response.json({ order: result }));
    await expect(getOrderStatus(order.id, configuration)).rejects.toThrow('Order lookup');
  });

  it.each([401, 403, 404, 500])(
    'preserves an upstream order lookup failure (%i) without exposing its body',
    async (status): Promise<void> => {
      upstream
        .mockResolvedValueOnce(Response.json({ access_token: 'order-token' }))
        .mockResolvedValueOnce(new Response('Private upstream details', { status }));
      await expect(getOrderStatus(order.id, configuration)).rejects.toThrow(
        `Failed to load order: upstream returned ${status}`,
      );
    },
  );

  it('does not query orders when the order-read scope is denied', async (): Promise<void> => {
    upstream.mockResolvedValueOnce(new Response('Invalid scope', { status: 403 }));
    await expect(getOrderStatus(order.id, configuration)).rejects.toThrow('Failed to get access token: 403');
    expect(upstream).toHaveBeenCalledTimes(1);
  });

  it.each(['', ' ', '.', '..'])(
    'rejects invalid order ID %j before requesting credentials',
    async (id): Promise<void> => {
      await expect(getOrderStatus(id, configuration)).rejects.toThrow('a valid orderId is required');
      expect(upstream).not.toHaveBeenCalled();
    },
  );
});
