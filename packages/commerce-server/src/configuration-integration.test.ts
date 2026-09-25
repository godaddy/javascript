import { once } from 'node:events';
import express from 'express';
import { afterEach, expect, it, vi } from 'vitest';
import { createRuntimeCommerceConfiguration } from './lib/commerce/config';
import { createCommerceRouter } from './router';

const clientFetch = globalThis.fetch;
afterEach((): void => {
  vi.unstubAllGlobals();
});

it.each([undefined, 'https://api.example.com', 'https://api.example.com:8443'])(
  'uses host configuration throughout the router with API override %s',
  async (apiBaseUrl): Promise<void> => {
    const origin = apiBaseUrl ?? 'https://api.godaddy.com';
    const owner = apiBaseUrl ? 'merchant-orders' : undefined;
    const sourceApp = apiBaseUrl ? 'merchant-site' : undefined;
    const upstream = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = String(input);
      if (url.endsWith('/v2/oauth2/token')) {
        expect(new URLSearchParams(String(init?.body)).get('client_secret')).toBe('secret-1');
        return Response.json({ access_token: 'token', expires_in: 3600 });
      }
      if (url.includes('/orders/')) {
        expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer token');
        return Response.json({
          order: {
            id: 'cart-1',
            context: { storeId: 'store-1', channelId: 'channel-1' },
            statuses: { paymentStatus: 'PAID' },
          },
        });
      }
      const body = JSON.parse(String(init?.body));
      if (body.query.includes('AddCartOrder')) {
        expect(body.variables.input.context).toEqual({
          storeId: 'store-1',
          channelId: 'channel-1',
          ...(owner ? { owner } : {}),
        });
        return Response.json({ data: { addDraftOrder: { id: 'cart-1' } } });
      }
      if (body.query.includes('CreateCheckoutSession')) {
        expect(body.variables.input.sourceApp).toBe(sourceApp);
        expect(body.variables.input.owner).toBe(owner);
        return Response.json({
          data: {
            createCheckoutSession: {
              id: 'session-1',
              url: 'https://checkout.example.com/session-1',
              storeId: 'store-1',
              channelId: 'channel-1',
              paymentMethods: { card: { processor: 'godaddy' } },
            },
          },
        });
      }
      if (url.includes('catalog-subgraph')) return Response.json({ data: { skuGroups: { edges: [] } } });
      return Response.json({ data: { orderById: { id: 'cart-1' } } });
    });
    vi.stubGlobal('fetch', upstream);
    const configuration = createRuntimeCommerceConfiguration({
      apiBaseUrl,
      owner,
      sourceApp,
      environment: {
        GODADDY_OAUTH_CLIENT_ID: 'client-1',
        GODADDY_OAUTH_CLIENT_SECRET: 'secret-1',
        GODADDY_STORE_ID: 'store-1',
        GODADDY_CHANNEL_ID: 'channel-1',
        GODADDY_CURRENCY_CODE: 'USD',
      },
    });
    const app = express();
    app.use(express.json());
    app.use(
      '/api/commerce',
      createCommerceRouter({
        configuration,
        checkoutReturnUrls: {
          returnUrls: ['https://example.com/cart'],
          successUrls: ['https://example.com/success'],
        },
      }),
    );
    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    try {
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('Expected a listening TCP server');
      const base = `http://127.0.0.1:${address.port}/api/commerce`;
      const configResponse = await clientFetch(`${base}/config`);
      const publicConfig = await configResponse.json();
      expect(publicConfig).toEqual({ cartScope: expect.any(String), currencyCode: 'USD' });
      const headers = { 'Content-Type': 'application/json', 'X-Commerce-Scope': publicConfig.cartScope };
      expect((await clientFetch(`${base}/products`, { headers })).status).toBe(200);
      expect(
        (
          await clientFetch(`${base}/cart`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ owner: 'untrusted-owner' }),
          })
        ).status,
      ).toBe(201);
      expect(
        (
          await clientFetch(`${base}/checkout`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              draftOrderId: 'cart-1',
              returnUrl: 'https://example.com/cart',
              successUrl: 'https://example.com/success',
              apiBaseUrl: 'https://untrusted.example.com',
              sourceApp: 'untrusted-source',
              owner: 'untrusted-owner',
            }),
          })
        ).status,
      ).toBe(200);
      expect((await clientFetch(`${base}/order-status?orderId=cart-1`, { headers })).status).toBe(200);
      expect(upstream.mock.calls.map(([url]) => String(url))).toEqual([
        `${origin}/v2/commerce/stores/store-1/catalog-subgraph/storefront`,
        `${origin}/v1/commerce/order-storefront-subgraph`,
        `${origin}/v1/commerce/order-storefront-subgraph`,
        `${origin}/v2/oauth2/token`,
        `https://checkout.commerce.${new URL(origin).host}`,
        `${origin}/v2/oauth2/token`,
        `${origin}/v1/commerce/stores/store-1/orders/cart-1`,
      ]);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  },
);

it.each([
  ['Order not found', 200, { cart: null }],
  [
    'Authentication token expired',
    500,
    { error: 'Failed to load cart', message: 'Authentication token expired' },
  ],
  ['Database unavailable', 500, { error: 'Failed to load cart', message: 'Database unavailable' }],
] as const)(
  'handles the actual Apollo error envelope for %s',
  async (message, status, body): Promise<void> => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async (): Promise<Response> =>
          Response.json({
            data: { orderById: null },
            errors: [{ message, extensions: { code: 'INTERNAL_SERVER_ERROR' } }],
          }),
      ),
    );
    const app = express();
    app.use(
      '/api/commerce',
      createCommerceRouter({
        configuration: createRuntimeCommerceConfiguration({
          environment: {
            GODADDY_OAUTH_CLIENT_ID: 'client-1',
            GODADDY_OAUTH_CLIENT_SECRET: 'secret-1',
            GODADDY_STORE_ID: 'store-1',
            GODADDY_CHANNEL_ID: 'channel-1',
            GODADDY_CURRENCY_CODE: 'USD',
          },
        }),
      }),
    );
    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    try {
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('Expected a listening TCP server');
      const response = await clientFetch(`http://127.0.0.1:${address.port}/api/commerce/cart/completed-cart`);
      expect(response.status).toBe(status);
      expect(await response.json()).toEqual(body);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  },
);
