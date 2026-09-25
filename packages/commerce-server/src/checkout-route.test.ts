import { once } from 'node:events';
import type { Server } from 'node:http';
import express from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRuntimeCommerceConfiguration } from './lib/commerce/config';
import { createCheckoutSession } from './lib/commerce/create-checkout-session';
import { createCommerceRouter, createGoDaddyPaymentsRouter } from './router';

vi.mock('./lib/commerce/create-checkout-session', () => ({ createCheckoutSession: vi.fn() }));
const policy = {
  returnUrls: ['https://shop.example.com/shop'],
  successUrls: [
    'https://shop.example.com/checkout/success',
    'https://shop.example.com/receipt?campaign=spring',
  ],
};
const valid = {
  draftOrderId: 'cart-1',
  returnUrl: policy.returnUrls[0],
  successUrl: `${policy.successUrls[0]}?orderId=cart-1`,
};
let server: Server;
let base: string;

beforeAll(async (): Promise<void> => {
  const configuration = createRuntimeCommerceConfiguration({ environment: {} });
  const app = express();
  app.use(express.json());
  app.use('/configured', createCommerceRouter({ configuration, checkoutReturnUrls: policy }));
  app.use('/missing', createCommerceRouter({ configuration }));
  app.use('/payments', createGoDaddyPaymentsRouter(configuration, policy));
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Expected a listening TCP server');
  base = `http://127.0.0.1:${address.port}`;
});
afterAll(async (): Promise<void> => {
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});
beforeEach((): void => {
  vi.clearAllMocks();
  vi.mocked(createCheckoutSession).mockResolvedValue({
    id: 'session-1',
    url: 'https://checkout.example.com/session-1',
    draftOrderId: 'cart-1',
    storeId: 'store-1',
    channelId: 'channel-1',
    businessId: null,
    storeName: null,
    sourceApp: null,
  });
});

function post(body: unknown, route = '/configured'): Promise<Response> {
  return fetch(`${base}${route}/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://attacker.example.com',
      'X-Forwarded-Host': 'attacker.example.com',
    },
    body: JSON.stringify(body),
  });
}

describe('public checkout boundary', () => {
  it.each(['/configured', '/payments'])(
    'allows catalog checkout with a configured destination through %s',
    async (route): Promise<void> => {
      const response = await post(valid, route);
      expect(response.status).toBe(200);
      expect(createCheckoutSession).toHaveBeenCalledWith(expect.objectContaining(valid), expect.anything());
    },
  );

  it('allows SKU checkout and preserves configured query parameters', async (): Promise<void> => {
    const body = {
      skuId: 'sku-1',
      quantity: 2,
      returnUrl: valid.returnUrl,
      successUrl: 'https://shop.example.com/receipt?orderId=cart-1&campaign=spring',
    };
    expect((await post(body)).status).toBe(200);
    expect(createCheckoutSession).toHaveBeenCalledWith(expect.objectContaining(body), expect.anything());
  });

  it.each([false, true])(
    'rejects browser-supplied non-catalog prices (with catalog source: %s)',
    async (includeCart): Promise<void> => {
      const response = await post({
        ...valid,
        draftOrderId: includeCart ? 'cart-1' : undefined,
        lineItemData: { name: 'Fixed deposit', priceData: { unitAmount: 1, currencyCode: 'USD' } },
      });
      expect(response.status).toBe(400);
      expect(createCheckoutSession).not.toHaveBeenCalled();
    },
  );

  it('fails closed when the host has not configured return destinations', async (): Promise<void> => {
    expect((await post(valid, '/missing')).status).toBe(503);
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it.each([
    ['returnUrl', 'https://attacker.example.com/shop'],
    ['successUrl', 'https://attacker.example.com/checkout/success'],
    ['successUrl', 'https://shop.example.com.attacker.example.com/checkout/success'],
    ['successUrl', 'https://shop.example.com@attacker.example.com/checkout/success'],
    ['successUrl', 'https://user:password@shop.example.com/checkout/success'],
    ['successUrl', 'https://shop.example.com/checkout/success/extra'],
    ['successUrl', 'https://shop.example.com/redirect?next=https://attacker.example.com'],
    ['successUrl', 'https://shop.example.com/checkout/success?next=https://attacker.example.com'],
    ['successUrl', 'https://shop.example.com/checkout/success?orderId=one&orderId=two'],
    ['successUrl', 'https://shop.example.com/receipt?campaign=other'],
    ['successUrl', 'https://shop.example.com/checkout/success#https://attacker.example.com'],
    ['successUrl', 'https://shop.example.com:8443/checkout/success'],
    ['successUrl', 'https://shop.example.com/shop'],
    ['returnUrl', 'https://shop.example.com/checkout/success'],
    ['successUrl', '//shop.example.com/checkout/success'],
    ['successUrl', '/checkout/success'],
    ['successUrl', 'http://shop.example.com/checkout/success'],
    ['successUrl', 'javascript:alert(1)'],
    ['successUrl', 'https://shop.example.com/checkout/success\n'],
    ['successUrl', 'https://shop.example.com\\@attacker.example.com/checkout/success'],
    ['successUrl', {}],
    ['successUrl', null],
    ['successUrl', ['https://shop.example.com/checkout/success']],
  ])('rejects unapproved %s: %j before creating checkout', async (field, value): Promise<void> => {
    expect((await post({ ...valid, [field]: value })).status).toBe(400);
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it.each([
    'http://shop.example.com/shop',
    '//shop.example.com/shop',
    'https://user@shop.example.com/shop',
    'https://shop.example.com/shop#fragment',
  ])('rejects invalid host destination configuration %s at mount time', (url): void => {
    expect(() =>
      createCommerceRouter({ checkoutReturnUrls: { returnUrls: [url], successUrls: [] } }),
    ).toThrow('Checkout return destinations');
  });
});
