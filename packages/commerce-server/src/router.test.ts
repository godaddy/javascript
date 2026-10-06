import type { AddressInfo } from 'node:net';
import type { Request, Response } from 'express';
import express from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCommerceCartScope } from './lib/commerce/cart-scope';
import type { CommerceConfiguration } from './lib/commerce/config';
import { createCheckoutSession } from './lib/commerce/create-checkout-session';
import { GraphQLErrorWithCodes, gqlRequest } from './lib/commerce/gql';
import { getCartOrderQuery } from './lib/commerce/order-subgraph';
import { createCommerceCatalogRouter, createGoDaddyPaymentsRouter } from './router';
import applyDiscount from './server/api/commerce/cart/[id]/discounts/POST';
import readCart from './server/api/commerce/cart/[id]/GET';
import deleteItem from './server/api/commerce/cart/[id]/items/[itemId]/DELETE';
import updateItem from './server/api/commerce/cart/[id]/items/[itemId]/PATCH';
import addItem from './server/api/commerce/cart/[id]/items/POST';
import createCart from './server/api/commerce/cart/POST';
import checkout from './server/api/commerce/checkout/POST';
import configHandler from './server/api/commerce/config/GET';
import readProduct from './server/api/commerce/products/[id]/GET';
import readProducts from './server/api/commerce/products/GET';
import readSku from './server/api/commerce/skus/[id]/GET';

vi.mock('./lib/commerce/gql', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./lib/commerce/gql')>()),
  gqlRequest: vi.fn(),
  storefrontHeaders: vi.fn(() => ({})),
}));
vi.mock('./lib/commerce/create-checkout-session', () => ({
  createCheckoutSession: vi.fn(),
}));

const binding = {
  apiBaseUrl: 'https://api.godaddy.com',
  storeId: 'store-1',
  channelId: 'channel-1',
  currencyCode: 'USD',
  clientId: 'client-1',
  clientSecret: 'server-only-secret',
};
const configuration: CommerceConfiguration = {
  read: (): typeof binding => binding,
  readCheckout: (): { enablePromotionCodes: false; enableTaxCollection: false; enableShipping: false } => ({
    enablePromotionCodes: false,
    enableTaxCollection: false,
    enableShipping: false,
  }),
};

function response() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
    setHeader: vi.fn(),
    locals: { commerceConfiguration: configuration },
  };
  res.status.mockReturnValue(res);
  return res;
}

describe('Commerce scoped routes', () => {
  beforeEach((): void => {
    vi.clearAllMocks();
  });

  afterEach((): void => {
    vi.restoreAllMocks();
  });

  it('does not query unsupported status fields on the storefront cart API', (): void => {
    expect(getCartOrderQuery).not.toMatch(/\bstatuses\s*\{/);
  });

  it('uses currency as part of the persisted cart binding', (): void => {
    expect(getCommerceCartScope(binding)).not.toBe(getCommerceCartScope({ ...binding, currencyCode: 'GBP' }));
  });

  it.each([readCart, addItem, updateItem, deleteItem, applyDiscount, readProduct, readSku])(
    'rejects array route IDs before an upstream request',
    async (handler): Promise<void> => {
      const res: ReturnType<typeof response> = response();
      await handler(
        {
          params: { id: ['one', 'two'], itemId: 'item' },
          headers: {},
          query: {},
          body: { skuId: 'sku', name: 'Product', quantity: 1, discountCodes: ['TEST'] },
        } as unknown as Request,
        res as unknown as Response,
      );
      expect(res.status).toHaveBeenCalledWith(400);
      expect(gqlRequest).not.toHaveBeenCalled();
    },
  );

  it('includes selected SKU data and preserves attribute-value name filters', async (): Promise<void> => {
    const res: ReturnType<typeof response> = response();
    vi.mocked(gqlRequest).mockResolvedValueOnce({
      activeSkuGroups: { edges: [{ node: { id: 'product' } }] },
      skuGroup: { id: 'product' },
    });
    await readProduct(
      {
        params: { id: 'product' },
        query: { attributeValues: ['red', 'large'] },
      } as unknown as Request,
      res as unknown as Response,
    );
    expect(gqlRequest).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { id: 'product', attributeValues: ['red', 'large'] } }),
    );
    const query: string = vi.mocked(gqlRequest).mock.calls[0]?.[0].query ?? '';
    expect(query).toContain('prices(first: 10)');
    expect(query).toContain('inventoryCounts');
    expect(query).toContain('pageInfo { hasNextPage }');
    expect(query).toContain(
      'activeSkuGroups: skuGroups(id: { in: [$id] }, status: { eq: "ACTIVE" }, first: 1)',
    );
    expect(query).toMatch(/skuGroup\(id: \$id\) \{\s+id\s+name/);
    expect(query).not.toMatch(/^\s+status\s*$/m);
    expect(query).toContain('attributes(first: 50, orderBy: { position: ASC })');
    expect(query).toContain('values(first: 50, orderBy: { position: ASC })');
    expect(query).toContain('status: { eq: "ACTIVE" }');
    expect(res.json).toHaveBeenCalledWith({ skuGroup: { id: 'product' } });
  });

  it('loads only active catalog products and active card SKUs', async (): Promise<void> => {
    const res: ReturnType<typeof response> = response();
    vi.mocked(gqlRequest).mockResolvedValueOnce({ skuGroups: { edges: [] } });
    await readProducts({ query: {} } as unknown as Request, res as unknown as Response);
    const query: string = vi.mocked(gqlRequest).mock.calls[0]?.[0].query ?? '';
    expect(query).toContain('status: { eq: "ACTIVE" }');
    expect(query).toContain('skus(first: 2, status: { eq: "ACTIVE" })');
    expect(query).toContain('priceRange(status: { eq: "ACTIVE" })');
  });

  it.each([readProducts, readProduct, readSku])(
    'keeps catalog queries within the upstream depth limit of 10',
    async (handler: typeof readProducts): Promise<void> => {
      const res: ReturnType<typeof response> = response();
      vi.mocked(gqlRequest).mockResolvedValueOnce({});
      await handler(
        { params: { id: 'product' }, query: {} } as unknown as Request,
        res as unknown as Response,
      );
      const query: string = vi.mocked(gqlRequest).mock.calls[0]?.[0].query ?? '';
      // These queries are inline selections. Exclude arguments from brace depth;
      // fragments require expansion, so reject them rather than undercounting.
      expect(query).not.toContain('...');
      const selections: string = query.replace(/#[^\n]*|"(?:\\.|[^"\\])*"|\([^()]*\)/g, '');
      let depth: number = 0;
      let maximum: number = 0;
      for (const brace of selections.match(/[{}]/g) ?? []) {
        depth += brace === '{' ? 1 : -1;
        maximum = Math.max(maximum, depth);
      }
      expect(depth).toBe(0);
      expect(maximum).toBeGreaterThan(0);
      expect(maximum).toBeLessThanOrEqual(10);
    },
  );

  it('returns only public binding data and disables caching', async (): Promise<void> => {
    const res = response();
    await configHandler({} as Request, res as unknown as Response);
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    expect(res.json).toHaveBeenCalledWith({
      cartScope: getCommerceCartScope(binding),
      currencyCode: 'USD',
    });
  });

  it('fails visibly on an incomplete binding without a fallback currency', async (): Promise<void> => {
    const res = response();
    res.locals.commerceConfiguration = {
      ...configuration,
      read: (): never => {
        throw new Error('Missing channel');
      },
    };
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    await configHandler({} as Request, res as unknown as Response);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Commerce configuration is unavailable. Complete the store connection before continuing.',
      code: 'not_configured',
      requestId: expect.any(String),
    });
    const [, context] = consoleError.mock.calls[0] ?? [];
    expect((context as { error: Error }).error.cause).toEqual(new Error('Missing channel'));
  });

  it.each([
    ['create', createCart],
    ['read', readCart],
    ['add', addItem],
    ['update', updateItem],
    ['remove', deleteItem],
    ['discount', applyDiscount],
    ['checkout', checkout],
    ['products', readProducts],
    ['product', readProduct],
    ['sku', readSku],
  ] as const)('blocks a stale binding before upstream %s calls', async (_name, handler): Promise<void> => {
    const res = response();
    const req = {
      headers: { 'x-commerce-scope': 'old-binding' },
      query: {},
      params: { id: 'cart-1', itemId: 'item-1' },
      body: {
        skuId: 'sku-1',
        name: 'Product',
        quantity: 1,
        discountCodes: ['PROMO'],
        returnUrl: 'https://store.example/shop',
        successUrl: 'https://store.example/return',
      },
    } as unknown as Request;
    await handler(req, res as unknown as Response);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(gqlRequest).not.toHaveBeenCalled();
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it.each([readProducts, readProduct, readSku])(
    'accepts current and omitted catalog scopes',
    async (handler): Promise<void> => {
      for (const scope of [undefined, getCommerceCartScope(binding)]) {
        const res = response();
        const product = { skuGroup: { id: 'product-1' } };
        vi.mocked(gqlRequest).mockResolvedValueOnce(
          handler === readProduct
            ? { ...product, activeSkuGroups: { edges: [{ node: { id: 'product-1' } }] } }
            : {},
        );
        await handler(
          {
            headers: { 'x-commerce-scope': scope },
            params: { id: 'product-1' },
            query: {},
          } as unknown as Request,
          res as unknown as Response,
        );
        expect(res.json).toHaveBeenCalledWith(handler === readProduct ? product : {});
        expect(res.status).not.toHaveBeenCalled();
      }
      expect(gqlRequest).toHaveBeenCalledTimes(2);
    },
  );

  it('updates only the URL cart/item and forwards only supported body fields', async (): Promise<void> => {
    const res = response();
    const fields = {
      name: 'Updated product',
      quantity: 2,
      fulfillmentMode: 'NONE',
      status: 'DRAFT',
      type: 'PRODUCT',
      details: { sku: 'sku-1' },
    };
    const cart = { id: 'cart-1', lineItems: [{ id: 'item-1', ...fields }] };
    vi.mocked(gqlRequest)
      .mockResolvedValueOnce({ updateLineItemById: { id: 'item-1' } })
      .mockResolvedValueOnce({ orderById: cart });
    await updateItem(
      {
        headers: {},
        params: { id: 'cart-1', itemId: 'item-1' },
        body: { ...fields, id: 'other-item', orderId: 'other-cart', unitAmount: { value: 1 } },
      } as unknown as Request,
      res as unknown as Response,
    );
    expect(vi.mocked(gqlRequest).mock.calls[0]?.[0].variables).toEqual({
      input: { id: 'item-1', orderId: 'cart-1', ...fields },
    });
    expect(vi.mocked(gqlRequest).mock.calls[1]?.[0].variables).toEqual({ id: 'cart-1' });
    expect(res.json).toHaveBeenCalledWith({ cart });
  });

  it.each([
    new GraphQLErrorWithCodes([{ code: 'UNAUTHENTICATED', message: 'Authentication token expired' }], 401),
    new GraphQLErrorWithCodes([
      { code: 'UNAUTHENTICATED', message: 'Authentication token expired', status: 401 },
    ]),
    new GraphQLErrorWithCodes([{ message: 'Session expired' }]),
    new GraphQLErrorWithCodes([{ code: 'INTERNAL_SERVER_ERROR', message: 'Authentication token expired' }]),
    new GraphQLErrorWithCodes([{ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' }]),
    new GraphQLErrorWithCodes([{ code: 'UNAUTHENTICATED', message: 'Order not found' }]),
    new GraphQLErrorWithCodes([{ code: 'NOT_FOUND', message: 'Store not found' }]),
    new GraphQLErrorWithCodes([{ message: 'GraphQL endpoint not found', status: 404 }], 404),
    new GraphQLErrorWithCodes([{ code: 'ORDER_EXPIRED', message: 'Order expired' }], 503),
    new GraphQLErrorWithCodes([
      { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
      { code: 'FORBIDDEN', message: 'Access denied', status: 403 },
    ]),
  ])('preserves the cart on unrelated upstream failures: %s', async (error): Promise<void> => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = response();
    vi.mocked(gqlRequest).mockRejectedValueOnce(error);
    await readCart(
      { headers: {}, params: { id: 'cart-1' } } as unknown as Request,
      res as unknown as Response,
    );
    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Failed to load cart',
      code: expect.stringMatching(/^upstream_(?:error|unauthorized)$/),
      requestId: expect.any(String),
    });
    expect(consoleError).toHaveBeenCalledWith(
      'commerce-server: Failed to load cart',
      expect.objectContaining({ httpStatus: 502, error }),
    );
  });

  it.each([
    new GraphQLErrorWithCodes([{ code: 'ORDER_NOT_FOUND' }], 404),
    new GraphQLErrorWithCodes([{ code: 'INTERNAL_SERVER_ERROR', message: 'Order not found' }]),
    new GraphQLErrorWithCodes([{ code: 'CART_EXPIRED' }], 410),
    new GraphQLErrorWithCodes([{ code: 'DRAFT_ORDER_NOT_FOUND' }]),
    new GraphQLErrorWithCodes([{ code: 'NOT_FOUND', message: 'Order not found: cart-1' }]),
    new GraphQLErrorWithCodes([{ message: 'Cart has expired' }]),
  ])('clears a missing or expired cart: %s', async (error): Promise<void> => {
    const res = response();
    vi.mocked(gqlRequest).mockRejectedValueOnce(error);
    await readCart(
      { headers: {}, params: { id: 'cart-1' } } as unknown as Request,
      res as unknown as Response,
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ cart: null });
  });

  it.each([undefined, getCommerceCartScope(binding)])(
    'preserves cart creation with scope %s',
    async (scope): Promise<void> => {
      vi.mocked(gqlRequest)
        .mockResolvedValueOnce({ addDraftOrder: { id: 'cart-1' } })
        .mockResolvedValueOnce({ addLineItemBySkuId: { id: 'item-1' } })
        .mockResolvedValueOnce({
          orderById: { id: 'cart-1', lineItems: [{ skuId: 'sku-1', quantity: 1 }] },
        });
      const res = response();
      await createCart(
        {
          headers: { 'x-commerce-scope': scope },
          body: { lineItems: [{ skuId: 'sku-1', name: 'Product', quantity: 1 }] },
        } as unknown as Request,
        res as unknown as Response,
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(gqlRequest).toHaveBeenCalledTimes(3);
      expect(res.json).toHaveBeenCalledWith({
        cart: { id: 'cart-1', lineItems: [{ skuId: 'sku-1', quantity: 1 }] },
      });
    },
  );

  const scopedRequest = {
    headers: {},
    query: {},
    params: { id: 'id-1', itemId: 'item-1' },
    body: {
      skuId: 'sku-1',
      name: 'Product',
      quantity: 1,
      discountCodes: ['PROMO'],
      lineItems: [{ skuId: 'sku-1', name: 'Product', quantity: 1 }],
    },
  } as unknown as Request;

  it.each([
    ['products', readProducts, 'Failed to load products'],
    ['product', readProduct, 'Failed to load product'],
    ['sku', readSku, 'Failed to load sku'],
    ['create cart', createCart, 'Failed to create cart'],
    ['read cart', readCart, 'Failed to load cart'],
    ['add item', addItem, 'Failed to add line item'],
    ['update item', updateItem, 'Failed to update line item'],
    ['delete item', deleteItem, 'Failed to delete line item'],
    ['discounts', applyDiscount, 'Failed to apply discount codes'],
    ['checkout', checkout, 'Failed to create checkout session'],
  ] as const)(
    'returns a generic 500 and logs the detail of an unexpected error for %s',
    async (_name, handler, label): Promise<void> => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const failure = new Error('secret internal detail');
      vi.mocked(gqlRequest).mockRejectedValue(failure);
      vi.mocked(createCheckoutSession).mockRejectedValue(failure);
      const res = response();
      (res.locals as Record<string, unknown>).commerceCheckoutReturnUrlValidator = (
        returnUrl?: string,
        successUrl?: string,
      ) => ({ returnUrl, successUrl });
      const req = {
        ...scopedRequest,
        body: {
          ...(scopedRequest.body as object),
          ...(handler === checkout ? { lineItems: undefined, skuId: 'sku-1' } : {}),
        },
      } as unknown as Request;
      await handler(req, res as unknown as Response);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({
        error: label,
        code: 'internal_error',
        requestId: expect.any(String),
      });
      expect(consoleError).toHaveBeenCalledWith(
        `commerce-server: ${label}`,
        expect.objectContaining({ httpStatus: 500, code: 'internal_error', error: failure }),
      );
    },
  );

  it.each([
    ['products', readProducts, 'Failed to load products'],
    ['product', readProduct, 'Failed to load product'],
    ['sku', readSku, 'Failed to load sku'],
    ['create cart', createCart, 'Failed to create cart'],
    ['read cart', readCart, 'Failed to load cart'],
    ['add item', addItem, 'Failed to add line item'],
    ['update item', updateItem, 'Failed to update line item'],
    ['delete item', deleteItem, 'Failed to delete line item'],
    ['discounts', applyDiscount, 'Failed to apply discount codes'],
    ['checkout', checkout, 'Failed to create checkout session'],
  ] as const)(
    'returns 502 without upstream detail for an upstream failure in %s',
    async (_name, handler, label): Promise<void> => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const failure = new GraphQLErrorWithCodes(
        [{ message: 'secret-upstream-detail', code: 'INTERNAL_SERVER_ERROR' }],
        500,
      );
      vi.mocked(gqlRequest).mockRejectedValue(failure);
      vi.mocked(createCheckoutSession).mockRejectedValue(failure);
      const res = response();
      (res.locals as Record<string, unknown>).commerceCheckoutReturnUrlValidator = (
        returnUrl?: string,
        successUrl?: string,
      ) => ({ returnUrl, successUrl });
      const req = {
        ...scopedRequest,
        body: {
          ...(scopedRequest.body as object),
          ...(handler === checkout ? { lineItems: undefined, skuId: 'sku-1' } : {}),
        },
      } as unknown as Request;
      await handler(req, res as unknown as Response);
      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith({
        error: label,
        code: 'upstream_error',
        requestId: expect.any(String),
      });
      expect(JSON.stringify(vi.mocked(res.json).mock.calls)).not.toContain('secret-upstream-detail');
      expect(consoleError).toHaveBeenCalledWith(
        `commerce-server: ${label}`,
        expect.objectContaining({
          httpStatus: 502,
          details: expect.objectContaining({ upstreamStatus: 500, upstreamCodes: ['INTERNAL_SERVER_ERROR'] }),
        }),
      );
    },
  );

  it.each([
    ['add item', addItem],
    ['update item', updateItem],
    ['delete item', deleteItem],
    ['discounts', applyDiscount],
  ] as const)(
    'returns 404 when %s targets a missing or completed cart',
    async (_name, handler): Promise<void> => {
      vi.mocked(gqlRequest).mockRejectedValueOnce(
        new GraphQLErrorWithCodes([{ code: 'INTERNAL_SERVER_ERROR', message: 'Order not found' }]),
      );
      const res = response();
      await handler(scopedRequest, res as unknown as Response);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Cart not found',
        code: 'not_found',
        requestId: expect.any(String),
      });
    },
  );

  // The cart-not-found rule only applies to routes acting on an existing saved cart.
  it.each([
    ['products', readProducts, []],
    ['create cart (adding the first item)', createCart, [{ addDraftOrder: { id: 'cart-new' } }]],
  ] as const)(
    'returns 502, not cart not found, when %s receives "Order not found"',
    async (_name, handler, before): Promise<void> => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      for (const result of before) vi.mocked(gqlRequest).mockResolvedValueOnce(result);
      vi.mocked(gqlRequest).mockRejectedValueOnce(
        new GraphQLErrorWithCodes([{ code: 'INTERNAL_SERVER_ERROR', message: 'Order not found' }]),
      );
      const res = response();
      await handler(scopedRequest, res as unknown as Response);
      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'upstream_error' }));
    },
  );

  it('reports a mixed not-found and embedded 403 as upstream_unauthorized without clearing the cart', async (): Promise<void> => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(gqlRequest).mockRejectedValueOnce(
      new GraphQLErrorWithCodes([
        { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
        { code: 'FORBIDDEN', message: 'Access denied', status: 403 },
      ]),
    );
    const res = response();
    await readCart(
      { headers: {}, params: { id: 'cart-1' } } as unknown as Request,
      res as unknown as Response,
    );
    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'upstream_unauthorized' }));
  });

  it('reports an upstream 401 as upstream_unauthorized, not a caller authentication failure', async (): Promise<void> => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(gqlRequest).mockRejectedValueOnce(
      new GraphQLErrorWithCodes([{ code: 'UNAUTHENTICATED', message: 'Bad client' }], 401),
    );
    const res = response();
    await readProducts(scopedRequest, res as unknown as Response);
    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'upstream_unauthorized' }));
  });
});

describe('Commerce router mounting', (): void => {
  it('mounts the catalog contract below the host path', async (): Promise<void> => {
    const app = express();
    app.use('/api/commerce', createCommerceCatalogRouter(configuration));
    const server = app.listen(0);
    try {
      const address = server.address() as AddressInfo;
      const result = await fetch(`http://127.0.0.1:${address.port}/api/commerce/config`);
      expect(result.status).toBe(200);
      await expect(result.json()).resolves.toEqual({
        cartScope: getCommerceCartScope(binding),
        currencyCode: 'USD',
      });
    } finally {
      await new Promise<void>((resolve, reject): void => {
        server.close((error?: Error): void => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it('does not install catalog routes in the payments-only preset', async (): Promise<void> => {
    const app = express();
    app.use('/api/commerce', createGoDaddyPaymentsRouter(configuration));
    const server = app.listen(0);
    try {
      const address = server.address() as AddressInfo;
      const result = await fetch(`http://127.0.0.1:${address.port}/api/commerce/config`);
      expect(result.status).toBe(404);
    } finally {
      await new Promise<void>((resolve, reject): void => {
        server.close((error?: Error): void => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  async function requestThroughRouter(
    router: express.Router,
    path: string,
    headers: Record<string, string> = {},
  ): Promise<globalThis.Response> {
    const app = express();
    app.use('/api/commerce', router);
    const server = app.listen(0);
    try {
      const address = server.address() as AddressInfo;
      return await fetch(`http://127.0.0.1:${address.port}/api/commerce${path}`, { headers });
    } finally {
      await new Promise<void>((resolve, reject): void => {
        server.close((error?: Error): void => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  }

  const failingConfiguration: CommerceConfiguration = {
    ...configuration,
    read: (): never => {
      throw new Error('secret config detail');
    },
  };

  it('logs failures through the host logger with the response request id', async (): Promise<void> => {
    const logger = { error: vi.fn() };
    const result = await requestThroughRouter(
      createCommerceCatalogRouter(failingConfiguration, { logger }),
      '/products',
    );
    const body = (await result.json()) as { requestId: string };
    expect(result.status).toBe(503);
    expect(JSON.stringify(body)).not.toContain('secret config detail');
    expect(logger.error).toHaveBeenCalledWith(
      'commerce-server: Failed to load products',
      expect.objectContaining({ requestId: body.requestId, httpStatus: 503, code: 'not_configured' }),
    );
  });

  it('still sends the standard failure body when the host logger throws', async (): Promise<void> => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const loggerError = new Error('logger down');
    const logger = {
      error: (): never => {
        throw loggerError;
      },
    };
    const result = await requestThroughRouter(
      createCommerceCatalogRouter(failingConfiguration, { logger }),
      '/products',
    );
    expect(result.status).toBe(503);
    await expect(result.json()).resolves.toEqual({
      error: 'Commerce configuration is unavailable. Complete the store connection before continuing.',
      code: 'not_configured',
      requestId: expect.any(String),
    });
    expect(consoleError).toHaveBeenCalledWith(
      'commerce-server: Failed to load products (host logger failed)',
      expect.objectContaining({ httpStatus: 503, loggerError }),
    );
  });

  it('falls back to a generated id when getRequestId throws', async (): Promise<void> => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await requestThroughRouter(
      createCommerceCatalogRouter(failingConfiguration, {
        getRequestId: (req): string => (req.get('x-request-id') as string).trim(),
      }),
      '/config',
    );
    expect(result.status).toBe(503);
    const { requestId } = (await result.json()) as { requestId: string };
    expect(requestId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('does not resolve a request id for a successful request', async (): Promise<void> => {
    const getRequestId = vi.fn((): string => 'edge-123');
    const result = await requestThroughRouter(
      createCommerceCatalogRouter(configuration, { getRequestId }),
      '/config',
    );
    expect(result.status).toBe(200);
    expect(getRequestId).not.toHaveBeenCalled();
  });

  it.each([
    ['a valid host id', 'edge-123', 'edge-123'],
    ['an id with unsafe characters', 'id with spaces; level=error', undefined],
  ])('uses %s from getRequestId when it is safe', async (_case, supplied, expected): Promise<void> => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await requestThroughRouter(
      createCommerceCatalogRouter(failingConfiguration, {
        getRequestId: (req) => req.get('x-request-id'),
      }),
      '/config',
      { 'x-request-id': supplied },
    );
    const { requestId } = (await result.json()) as { requestId: string };
    if (expected) expect(requestId).toBe(expected);
    else expect(requestId).toMatch(/^[0-9a-f-]{36}$/);
  });
});
