import { once } from 'node:events';
import express from 'express';
import { afterEach, expect, it, vi } from 'vitest';
import { createRuntimeCommerceConfiguration } from './lib/commerce/config';
import { createCommerceRouter } from './router';

const clientFetch = globalThis.fetch;
afterEach((): void => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('serves variant product details only on the configured channel without querying SKUGroup.status', async (): Promise<void> => {
  const upstream = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const { query, variables } = JSON.parse(String(init?.body)) as {
      query: string;
      variables: { id: string; attributeValues: string[]; channelId?: string };
    };
    if (/^\s+status\s*$/m.test(query)) {
      return Response.json({ errors: [{ message: 'Cannot query field "status" on type "SKUGroup".' }] });
    }
    expect(query).toContain(
      'activeSkuGroups: skuGroups(id: { in: [$id] }, channelId: { eq: $channelId }, status: { eq: "ACTIVE" }, first: 1)',
    );
    expect(['shirt', 'other-shirt', 'archived-shirt']).toContain(variables.id);
    const appliesChannelFilter = /channelId:\s*\{\s*eq:\s*\$channelId\s*\}/.test(query);
    const productChannel = variables.id === 'other-shirt' ? 'channel-2' : 'channel-1';
    const visible =
      variables.id !== 'archived-shirt' && (!appliesChannelFilter || variables.channelId === productChannel);
    const skus = [
      { id: 'shirt-red', label: 'Red shirt' },
      { id: 'shirt-blue', label: 'Blue shirt' },
    ];
    return Response.json({
      data: {
        activeSkuGroups: { edges: visible ? [{ node: { id: variables.id } }] : [] },
        skuGroup: {
          id: variables.id,
          label: 'Shirt',
          attributes: {
            edges: [
              {
                node: {
                  name: 'color',
                  label: 'Color',
                  values: {
                    edges: [
                      { node: { name: 'red', label: 'Red' } },
                      { node: { name: 'blue', label: 'Blue' } },
                    ],
                  },
                },
              },
            ],
          },
          skus: {
            edges: skus
              .filter(
                (sku) =>
                  variables.attributeValues.length === 0 ||
                  variables.attributeValues.includes(sku.id.slice(6)),
              )
              .map((node) => ({ node })),
          },
        },
      },
    });
  });
  vi.stubGlobal('fetch', upstream);
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
    const url = `http://127.0.0.1:${address.port}/api/commerce/products/shirt`;
    const product = await clientFetch(url);
    expect(product.status).toBe(200);
    expect(
      (await product.json()).skuGroup.skus.edges.map(({ node }: { node: { id: string } }) => node.id),
    ).toEqual(['shirt-red', 'shirt-blue']);
    const selected = await clientFetch(`${url}?attributeValues=blue`);
    expect(selected.status).toBe(200);
    expect((await selected.json()).skuGroup.skus.edges).toEqual([
      { node: { id: 'shirt-blue', label: 'Blue shirt' } },
    ]);
    const archived = await clientFetch(`${url.replace('/shirt', '/archived-shirt')}?attributeValues=blue`);
    expect(archived.status).toBe(404);
    expect(await archived.json()).toEqual({
      error: 'Product not found',
      code: 'not_found',
      requestId: expect.any(String),
    });
    const otherChannel = await clientFetch(`${url.replace('/shirt', '/other-shirt')}?channelId=channel-2`);
    expect(otherChannel.status).toBe(404);
    expect(await otherChannel.json()).toEqual({
      error: 'Product not found',
      code: 'not_found',
      requestId: expect.any(String),
    });
    expect(upstream).toHaveBeenCalledTimes(4);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

it('filters product lists by the current server channel with every catalog filter', async (): Promise<void> => {
  const environment = {
    GODADDY_OAUTH_CLIENT_ID: 'client-1',
    GODADDY_OAUTH_CLIENT_SECRET: 'secret-1',
    GODADDY_STORE_ID: 'store-1',
    GODADDY_CHANNEL_ID: 'channel-1',
    GODADDY_CURRENCY_CODE: 'USD',
  };
  const products = [
    { id: 'shirt', channelId: 'channel-1' },
    { id: 'other-shirt', channelId: 'channel-2' },
    { id: 'all-channels-shirt', channelId: null },
  ];
  const upstream = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const { query, variables } = JSON.parse(String(init?.body)) as {
      query: string;
      variables: { channelId?: string };
    };
    // Catalog products without custom channel assignments remain available on all channels.
    const appliesChannelFilter = /channelId:\s*\{\s*eq:\s*\$channelId\s*\}/.test(query);
    const visible = products.filter(
      (product) =>
        !appliesChannelFilter || product.channelId === null || product.channelId === variables.channelId,
    );
    return Response.json({ data: { skuGroups: { edges: visible.map(({ id }) => ({ node: { id } })) } } });
  });
  vi.stubGlobal('fetch', upstream);
  const app = express();
  app.use(
    '/api/commerce',
    createCommerceRouter({ configuration: createRuntimeCommerceConfiguration({ environment }) }),
  );
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Expected a listening TCP server');
    const url = `http://127.0.0.1:${address.port}/api/commerce/products`;
    const cases = [
      ['', { first: 24 }],
      ['?first=12&after=page-2', { first: 12, after: 'page-2' }],
      ['?searchQuery=shirt', { first: 24, label: { contains: 'shirt' } }],
      [
        '?productIds=shirt&productIds=other-shirt&productIds=all-channels-shirt&searchQuery=ignored',
        { first: 24, id: { in: ['shirt', 'other-shirt', 'all-channels-shirt'] } },
      ],
      [
        '?categoryIds=clothing&categoryIds=sale&searchQuery=ignored',
        { first: 24, listId: { in: ['clothing', 'sale'] } },
      ],
      ['?channelId=channel-2', { first: 24 }],
    ] as const;
    for (const [search, filters] of cases) {
      const response = await clientFetch(`${url}${search}`);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        skuGroups: { edges: [{ node: { id: 'shirt' } }, { node: { id: 'all-channels-shirt' } }] },
      });
      const request = JSON.parse(String(upstream.mock.lastCall?.[1]?.body));
      expect(request.variables).toEqual({ ...filters, channelId: 'channel-1' });
      expect(request.query).toContain('$channelId: String!');
    }
    environment.GODADDY_CHANNEL_ID = 'channel-2';
    const rebound = await clientFetch(url);
    expect(rebound.status).toBe(200);
    expect(await rebound.json()).toEqual({
      skuGroups: { edges: [{ node: { id: 'other-shirt' } }, { node: { id: 'all-channels-shirt' } }] },
    });
    expect(upstream).toHaveBeenCalledTimes(cases.length + 1);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
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
      expect(publicConfig).toEqual({
        cartScope: expect.any(String),
        currencyCode: 'USD',
      });
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
  ['Authentication token expired', 502, { error: 'Failed to load cart', code: 'upstream_error' }],
  ['Database unavailable', 502, { error: 'Failed to load cart', code: 'upstream_error' }],
] as const)(
  'handles the actual Apollo error envelope for %s',
  async (message, status, body): Promise<void> => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
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
      const json = (await response.json()) as { requestId?: string };
      const requestId = json.requestId;
      expect(json).toEqual(status === 200 ? body : { ...body, requestId: expect.any(String) });
      if (status === 502) {
        expect(consoleError).toHaveBeenCalledWith(
          'commerce-server: Failed to load cart',
          expect.objectContaining({
            requestId,
            error: expect.objectContaining({ message: expect.stringContaining(message) }),
          }),
        );
      }
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  },
);

it.each([
  ['extensions.http.status', { code: 'UNAUTHENTICATED', http: { status: 401 } }],
  ['extensions.status', { code: 'FORBIDDEN', status: 403 }],
])(
  'reports an auth failure in an HTTP 200 GraphQL body (%s) as upstream_unauthorized',
  async (_case, extensions): Promise<void> => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async (): Promise<Response> =>
          Response.json({ data: { orderById: null }, errors: [{ message: 'Unauthorized', extensions }] }),
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
      const response = await clientFetch(`http://127.0.0.1:${address.port}/api/commerce/cart/cart-1`);
      expect(response.status).toBe(502);
      expect(await response.json()).toEqual({
        error: 'Failed to load cart',
        code: 'upstream_unauthorized',
        requestId: expect.any(String),
      });
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  },
);
