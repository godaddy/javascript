import type { AddressInfo } from 'node:net';
import type { Request, Response } from 'express';
import express from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCommerceCartScope } from './lib/commerce/cart-scope';
import { createCheckoutSession } from './lib/commerce/create-checkout-session';
import { GraphQLErrorWithCodes, gqlRequest } from './lib/commerce/gql';
import { getCartOrderQuery, orderStatusQuery } from './lib/commerce/order-subgraph';
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
const configuration = {
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

  it('does not query unsupported order status fields in either installation order', (): void => {
    for (const query of [getCartOrderQuery, orderStatusQuery]) {
      expect(query).not.toMatch(/\bstatuses\s*\{/);
    }
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
    vi.mocked(gqlRequest).mockResolvedValueOnce({ skuGroup: { id: 'product' } });
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
    expect(res.json).toHaveBeenCalledWith({ skuGroup: { id: 'product' } });
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
    await configHandler({} as Request, res as unknown as Response);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      error: expect.any(String),
      message: 'Missing channel',
    });
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
        vi.mocked(gqlRequest).mockResolvedValueOnce({});
        await handler(
          {
            headers: { 'x-commerce-scope': scope },
            params: { id: 'product-1' },
            query: {},
          } as unknown as Request,
          res as unknown as Response,
        );
        expect(res.json).toHaveBeenCalledWith({});
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
    const res = response();
    vi.mocked(gqlRequest).mockRejectedValueOnce(error);
    await readCart(
      { headers: {}, params: { id: 'cart-1' } } as unknown as Request,
      res as unknown as Response,
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to load cart', message: error.message });
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
});
