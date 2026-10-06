import { once } from 'node:events';
import express from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRuntimeCommerceConfiguration } from './lib/commerce/config';
import { getOrderStatus, InvalidOrderIdError, OrderNotFoundError } from './lib/commerce/get-order-status';
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
// Bodies the Orders API's REST error handler sends for a missing order and an undecodable ID.
const ordersApiNotFound = (): Response =>
  Response.json(
    { code: 'NOT_FOUND', message: 'Order not found. Possible reasons: invalid orderId, storeID mismatch.' },
    { status: 404 },
  );
const ordersApiInvalidId = (): Response =>
  Response.json(
    { code: 'VALIDATION_FAILED', message: 'Invalid global ID: completed-order' },
    { status: 422 },
  );
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
  vi.restoreAllMocks();
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
    { ...order, context: undefined },
    { ...order, context: {} },
    { ...order, context: { channelId: order.context.channelId } },
    { ...order, context: { storeId: order.context.storeId } },
    { ...order, context: { ...order.context, storeId: '' } },
    { ...order, id: undefined },
    { ...order, id: 42 },
    { ...order, id: 'another-order' },
  ])('rejects an incomplete or mismatched order response', async (result): Promise<void> => {
    upstream
      .mockResolvedValueOnce(Response.json({ access_token: 'order-token' }))
      .mockResolvedValueOnce(Response.json({ order: result }));
    const lookup = getOrderStatus(order.id, configuration);
    await expect(lookup).rejects.toThrow('Order lookup did not return the requested order');
    await expect(lookup).rejects.not.toBeInstanceOf(OrderNotFoundError);
  });

  it.each([
    { ...order, context: { ...order.context, storeId: 'another-store' } },
    { ...order, context: { ...order.context, channelId: 'another-channel' } },
  ])('reports an order bound to another store or channel as not found', async (result): Promise<void> => {
    upstream
      .mockResolvedValueOnce(Response.json({ access_token: 'order-token' }))
      .mockResolvedValueOnce(Response.json({ order: result }));
    await expect(getOrderStatus(order.id, configuration)).rejects.toBeInstanceOf(OrderNotFoundError);
  });

  it('reports an Orders API NOT_FOUND as not found without exposing its body', async (): Promise<void> => {
    upstream
      .mockResolvedValueOnce(Response.json({ access_token: 'order-token' }))
      .mockResolvedValueOnce(ordersApiNotFound());
    const lookup = getOrderStatus(order.id, configuration);
    await expect(lookup).rejects.toBeInstanceOf(OrderNotFoundError);
    await expect(lookup).rejects.toThrow(/^Order not found$/);
  });

  it('reports an Orders API VALIDATION_FAILED for the order ID as an invalid order ID', async (): Promise<void> => {
    upstream
      .mockResolvedValueOnce(Response.json({ access_token: 'order-token' }))
      .mockResolvedValueOnce(ordersApiInvalidId());
    await expect(getOrderStatus(order.id, configuration)).rejects.toBeInstanceOf(InvalidOrderIdError);
  });

  it.each([
    ['an HTML 404 from an unrouted path', new Response('<pre>Cannot GET /v1/x</pre>', { status: 404 })],
    ['a JSON 404 without a code', Response.json({ message: 'Not Found' }, { status: 404 })],
    ['a 404 with another code', Response.json({ code: 'ROUTE_NOT_FOUND' }, { status: 404 })],
    ['a 422 with another code', Response.json({ code: 'CONFLICT' }, { status: 422 })],
    ['a non-JSON 422', new Response('Unprocessable', { status: 422 })],
  ])('treats %s as an upstream failure', async (_case, failure): Promise<void> => {
    upstream
      .mockResolvedValueOnce(Response.json({ access_token: 'order-token' }))
      .mockResolvedValueOnce(failure);
    const lookup = getOrderStatus(order.id, configuration);
    await expect(lookup).rejects.toThrow(`Failed to load order: upstream returned ${failure.status}`);
    await expect(lookup).rejects.not.toBeInstanceOf(OrderNotFoundError);
    await expect(lookup).rejects.not.toBeInstanceOf(InvalidOrderIdError);
  });

  it.each([401, 403, 500])(
    'preserves an upstream order lookup failure (%i) without exposing its body',
    async (status): Promise<void> => {
      const cancel = vi.spyOn(ReadableStream.prototype, 'cancel');
      upstream
        .mockResolvedValueOnce(Response.json({ access_token: 'order-token' }))
        .mockResolvedValueOnce(new Response('Private upstream details', { status }));
      await expect(getOrderStatus(order.id, configuration)).rejects.toThrow(
        `Failed to load order: upstream returned ${status}`,
      );
      expect(cancel).toHaveBeenCalledTimes(1);
    },
  );

  it('does not query orders when the order-read scope is denied', async (): Promise<void> => {
    upstream.mockResolvedValueOnce(new Response('Invalid scope', { status: 403 }));
    await expect(getOrderStatus(order.id, configuration)).rejects.toThrow('Failed to get access token: 403');
    expect(upstream).toHaveBeenCalledTimes(1);
  });

  it.each(['', ' ', '.', '..', ' completed-order', 'completed-order\n'])(
    'rejects invalid order ID %j before requesting credentials',
    async (id): Promise<void> => {
      const lookup = getOrderStatus(id, configuration);
      await expect(lookup).rejects.toBeInstanceOf(InvalidOrderIdError);
      await expect(lookup).rejects.toThrow('a valid orderId is required');
      expect(upstream).not.toHaveBeenCalled();
    },
  );
});

describe('order-status route', () => {
  async function requestOrderStatus(query: string): Promise<{ status: number; body: unknown }> {
    const app = express();
    app.use('/api/commerce', createGoDaddyPaymentsRouter(configuration));
    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    try {
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('Expected a listening TCP server');
      const response = await clientFetch(
        `http://127.0.0.1:${address.port}/api/commerce/order-status${query}`,
      );
      const body = (await response.json()) as Record<string, unknown>;
      expect(body.requestId).toEqual(expect.any(String));
      const { requestId: _requestId, ...stable } = body;
      return { status: response.status, body: stable };
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  }

  it.each([
    '',
    '?orderId=',
    '?orderId=%20',
    '?orderId=.',
    '?orderId=..',
    '?orderId=%20cart-1',
    '?orderId=a&orderId=b',
  ])(
    'returns 400 for invalid order ID query %j without an upstream request',
    async (query): Promise<void> => {
      await expect(requestOrderStatus(query)).resolves.toEqual({
        status: 400,
        body: {
          success: false,
          error: 'missing or invalid orderId query parameter',
          code: 'invalid_request',
        },
      });
      expect(upstream).not.toHaveBeenCalled();
    },
  );

  it('returns 400 when the Orders API rejects the order ID format', async (): Promise<void> => {
    upstream
      .mockResolvedValueOnce(Response.json({ access_token: 'order-token' }))
      .mockResolvedValueOnce(ordersApiInvalidId());
    await expect(requestOrderStatus(`?orderId=${order.id}`)).resolves.toEqual({
      status: 400,
      body: { success: false, error: 'missing or invalid orderId query parameter', code: 'invalid_request' },
    });
  });

  it.each([
    ['an Orders API NOT_FOUND', ordersApiNotFound()],
    [
      'another store',
      Response.json({ order: { ...order, context: { ...order.context, storeId: 'another-store' } } }),
    ],
  ])('returns 404 for %s', async (_case, orderResponse): Promise<void> => {
    upstream
      .mockResolvedValueOnce(Response.json({ access_token: 'order-token' }))
      .mockResolvedValueOnce(orderResponse);
    await expect(requestOrderStatus(`?orderId=${order.id}`)).resolves.toEqual({
      status: 404,
      body: { success: false, error: 'Order not found', code: 'not_found' },
    });
  });

  it.each([
    [
      'a token denied the order-read scope',
      'upstream_unauthorized',
      [new Response('Invalid scope', { status: 403 })],
    ],
    [
      'an upstream 500',
      'upstream_error',
      [
        Response.json({ access_token: 'order-token' }),
        new Response('Private upstream details', { status: 500 }),
      ],
    ],
    [
      'an incomplete order',
      'upstream_error',
      [Response.json({ access_token: 'order-token' }), Response.json({})],
    ],
    [
      'an order missing its store binding',
      'upstream_error',
      [
        Response.json({ access_token: 'order-token' }),
        Response.json({ order: { ...order, context: { channelId: order.context.channelId } } }),
      ],
    ],
    [
      'a 404 from an unrouted path',
      'upstream_error',
      [
        Response.json({ access_token: 'order-token' }),
        new Response('<pre>Cannot GET /v1/x</pre>', { status: 404 }),
      ],
    ],
    [
      'a different order ID',
      'upstream_error',
      [
        Response.json({ access_token: 'order-token' }),
        Response.json({ order: { ...order, id: 'another-order' } }),
      ],
    ],
  ])(
    'returns a generic 502 for %s and logs the detail server-side',
    async (_case, code, responses): Promise<void> => {
      const log = vi.spyOn(console, 'error').mockImplementation((): void => {});
      for (const response of responses) upstream.mockResolvedValueOnce(response);
      const result = await requestOrderStatus(`?orderId=${order.id}`);
      expect(result).toEqual({
        status: 502,
        body: { success: false, error: 'Failed to get order status', code },
      });
      expect(log).toHaveBeenCalledWith(
        'commerce-server: Failed to get order status',
        expect.objectContaining({ httpStatus: 502, code, error: expect.any(Error) }),
      );
    },
  );

  it('returns 503 when Commerce is not configured', async (): Promise<void> => {
    const log = vi.spyOn(console, 'error').mockImplementation((): void => {});
    vi.stubEnv('GODADDY_STORE_ID', '');
    const app = express();
    app.use(
      '/api/commerce',
      createGoDaddyPaymentsRouter(createRuntimeCommerceConfiguration({ environment: {} })),
    );
    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    try {
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('Expected a listening TCP server');
      const response = await clientFetch(
        `http://127.0.0.1:${address.port}/api/commerce/order-status?orderId=o-1`,
      );
      expect(response.status).toBe(503);
      expect(await response.json()).toMatchObject({ success: false, code: 'not_configured' });
      expect(upstream).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllEnvs();
      log.mockRestore();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });
});
