import * as api from '@godaddy/react/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CommerceClient } from './client';
import type { Cart, CommerceConfig, Session } from './types';

vi.mock('@godaddy/react/client', () => ({
  getCartOrder: vi.fn(),
  getSku: vi.fn(),
  createCartOrder: vi.fn(),
  addCartLineItem: vi.fn(),
  updateCartLineItem: vi.fn(),
  deleteCartLineItem: vi.fn(),
  applyCartDiscountCodes: vi.fn(),
  createCheckoutSession: vi.fn(),
}));

const config: CommerceConfig = {
  clientId: 'client',
  storeId: 'store',
  channelId: 'channel',
  getAccessToken: async () => 'oauth-token',
};
let order: Cart;
let writes: string[];
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const makeOrder = (): Cart =>
  ({
    id: 'cart-1',
    context: { storeId: 'store', channelId: 'channel' },
    lineItems: [],
    totals: { total: { value: 0, currencyCode: 'USD' } },
  }) as unknown as Cart;
const makeSession = (): Session =>
  ({
    id: 'session-1',
    token: 'session-token',
    url: 'https://checkout.example/session-1',
    storeId: 'store',
    channelId: 'channel',
    draftOrder: { id: 'cart-1' },
  }) as unknown as Session;

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  writes = [];
  order = makeOrder();
  vi.mocked(api.getCartOrder).mockImplementation(async () => ({
    orderById: copy(order),
  }));
  vi.mocked(api.getSku).mockImplementation(
    async ({ id }) =>
      ({
        sku: {
          id,
          name: id,
          prices: {
            edges: [{ node: { value: { currencyCode: 'USD', value: 1250 } } }],
          },
        },
      }) as Awaited<ReturnType<typeof api.getSku>>
  );
  vi.mocked(api.createCartOrder).mockImplementation(async () => {
    writes.push('create');
    return { addDraftOrder: copy(order) } as Awaited<
      ReturnType<typeof api.createCartOrder>
    >;
  });
  vi.mocked(api.addCartLineItem).mockImplementation(async input => {
    writes.push(`add:${input.skuId}`);
    order.lineItems = [
      ...(order.lineItems || []),
      {
        id: `line-${input.skuId}`,
        skuId: input.skuId,
        name: input.name,
        quantity: input.quantity,
      } as NonNullable<Cart['lineItems']>[number],
    ];
    return { addLineItemBySkuId: null };
  });
  vi.mocked(api.updateCartLineItem).mockImplementation(async input => {
    writes.push(`quantity:${input.quantity}`);
    order.lineItems = (order.lineItems || []).map(line =>
      line.id === input.id
        ? { ...line, quantity: input.quantity ?? line.quantity }
        : line
    );
    return { updateLineItemById: null };
  });
  vi.mocked(api.deleteCartLineItem).mockImplementation(async input => {
    order.lineItems = (order.lineItems || []).filter(
      line => line.id !== input.id
    );
    return { deleteLineItemById: true };
  });
  vi.mocked(api.createCheckoutSession).mockImplementation(async () => {
    writes.push('checkout');
    return makeSession();
  });
});

describe('managed cart lifecycle', () => {
  it('rejects a different concurrent purchase instead of returning the wrong checkout', async () => {
    const client = new CommerceClient(config);
    const first = client.buyNow('sku-a');
    await expect(client.buyNow('sku-b')).rejects.toThrow('Another purchase');
    await first;
    expect(api.createCheckoutSession).toHaveBeenCalledTimes(1);
    expect(api.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ lineItems: [{ skuId: 'sku-a', quantity: 1 }] }),
      expect.anything()
    );
    client.dispose();
  });

  it('serializes simultaneous first adds, creates one cart, and persists only its reference', async () => {
    const client = new CommerceClient(config);
    await Promise.all([client.addItem('sku-a', 2), client.addItem('sku-b')]);
    expect(writes).toEqual(['create', 'add:sku-a', 'add:sku-b']);
    expect(client.getSnapshot().cart?.lineItems).toHaveLength(2);
    expect(localStorage.getItem(client.storageKey)).toBe('cart-1');
    expect(localStorage.length).toBe(1);
    expect(api.createCartOrder).toHaveBeenCalledTimes(1);
    expect(vi.mocked(api.createCartOrder).mock.calls[0][0]).not.toHaveProperty(
      'lineItems'
    );
    expect(api.addCartLineItem).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        orderId: 'cart-1',
        skuId: 'sku-a',
        quantity: 2,
      }),
      'store',
      'client',
      'api.godaddy.com'
    );
    expect(api.addCartLineItem).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        orderId: 'cart-1',
        skuId: 'sku-b',
        quantity: 1,
      }),
      'store',
      'client',
      'api.godaddy.com'
    );
    expect(api.createCartOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        context: { storeId: 'store', channelId: 'channel' },
        totals: expect.objectContaining({
          total: { value: 0, currencyCode: 'USD' },
        }),
      }),
      'store',
      'client',
      'api.godaddy.com'
    );
    expect(api.addCartLineItem).toHaveBeenCalledWith(
      expect.not.objectContaining({
        price: expect.anything(),
        totals: expect.anything(),
      }),
      'store',
      'client',
      'api.godaddy.com'
    );
    client.dispose();
  });

  it('rehydrates server state after reload and merges identical SKU additions', async () => {
    const first = new CommerceClient(config);
    await first.addItem('sku-a', 2);
    first.dispose();
    const next = new CommerceClient(config);
    await next.addItem('sku-a');
    expect(api.createCartOrder).toHaveBeenCalledTimes(1);
    expect(next.getSnapshot().cart?.lineItems?.[0].quantity).toBe(3);
    await next.setQuantity('line-sku-a', 0);
    expect(next.getSnapshot().cart?.lineItems).toEqual([]);
    next.dispose();
  });

  it('preserves a created cart when adding its first item fails and does not retry the write', async () => {
    const client = new CommerceClient(config);
    vi.mocked(api.addCartLineItem).mockRejectedValueOnce(
      new Error('network failure')
    );
    await expect(client.addItem('sku-a')).rejects.toThrow('network failure');
    expect(localStorage.getItem(client.storageKey)).toBe('cart-1');
    expect(client.getSnapshot().status).toBe('error');
    await client.addItem('sku-b');
    expect(api.createCartOrder).toHaveBeenCalledTimes(1);
    expect(api.addCartLineItem).toHaveBeenCalledTimes(2);
    expect(client.getSnapshot().cart?.lineItems?.[0].skuId).toBe('sku-b');
    client.dispose();
  });

  it('clears a missing saved cart but preserves it after a network failure', async () => {
    const client = new CommerceClient(config);
    localStorage.setItem(client.storageKey, 'expired');
    vi.mocked(api.getCartOrder).mockRejectedValueOnce(new Error('offline'));
    await expect(client.ready()).rejects.toThrow('offline');
    expect(localStorage.getItem(client.storageKey)).toBe('expired');
    vi.mocked(api.getCartOrder).mockResolvedValueOnce({ orderById: null });
    await client.ready();
    expect(localStorage.getItem(client.storageKey)).toBeNull();
    client.dispose();
  });

  it('rejects a cart from another channel and uses different keys for different storefronts', async () => {
    const client = new CommerceClient(config);
    const other = new CommerceClient({ ...config, channelId: 'other' });
    expect(client.storageKey).not.toBe(other.storageKey);
    localStorage.setItem(client.storageKey, order.id);
    order.context = { storeId: 'store', channelId: 'other' };
    await expect(client.ready()).rejects.toThrow('different storefront');
    expect(client.getSnapshot().cart).toBeNull();
    expect(localStorage.getItem(client.storageKey)).toBeNull();
    client.dispose();
    other.dispose();
  });

  it('works in memory when storage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const client = new CommerceClient(config);
    await client.addItem('sku-a');
    await client.addItem('sku-b');
    expect(api.createCartOrder).toHaveBeenCalledTimes(1);
    expect(client.getSnapshot().cart?.lineItems).toHaveLength(2);
    client.dispose();
  });

  it('rejects invalid quantities before making requests', () => {
    const client = new CommerceClient(config);
    for (const count of [0, -1, 1.5, NaN, Infinity])
      expect(() => client.addItem('sku-a', count)).toThrow('Quantity');
    expect(api.createCartOrder).not.toHaveBeenCalled();
  });
});

describe('checkout handoff', () => {
  it('waits for queued cart mutations, shares duplicate checkout requests, and sends the draft ID only', async () => {
    const client = new CommerceClient(config);
    const add = client.addItem('sku-a');
    const first = client.checkout();
    const second = client.checkout();
    expect(first).toBe(second);
    await Promise.all([add, first, second]);
    expect(writes).toEqual(['create', 'add:sku-a', 'checkout']);
    const [input, auth] = vi.mocked(api.createCheckoutSession).mock.calls[0];
    expect(input.draftOrderId).toBe('cart-1');
    expect(input.lineItems).toBeUndefined();
    expect(auth).toEqual({
      accessToken: 'oauth-token',
      apiHost: 'api.godaddy.com',
    });
    await expect(client.addItem('sku-b')).rejects.toThrow(
      'Close the current checkout'
    );
    client.closeCheckout();
    expect(client.getSnapshot().cart?.lineItems).toHaveLength(1);
    client.dispose();
  });

  it('buy-now preserves the shopping cart through the hosted handoff', async () => {
    const client = new CommerceClient(config);
    await client.addItem('sku-a');
    await client.buyNow('sku-b', 2);
    expect(
      vi.mocked(api.createCheckoutSession).mock.calls[0][0].lineItems
    ).toEqual([{ skuId: 'sku-b', quantity: 2 }]);
    client.closeCheckout();
    expect(client.getSnapshot().cart?.lineItems?.[0].skuId).toBe('sku-a');
    expect(localStorage.getItem(client.storageKey)).toBe('cart-1');
    client.dispose();
  });

  it('preserves the saved cart when releasing a hosted checkout session', async () => {
    const client = new CommerceClient(config);
    await client.addItem('sku-a');
    await client.checkout();
    client.closeCheckout();
    expect(localStorage.getItem(client.storageKey)).toBe('cart-1');
    expect(client.getSnapshot().cart?.lineItems).toHaveLength(1);
    expect(client.getSnapshot().checkout).toBeNull();
    await client.addItem('sku-b');
    expect(client.getSnapshot().cart?.lineItems).toHaveLength(2);
    client.dispose();
  });

  it('resolves standalone payments using the application reference without creating a catalog cart', async () => {
    const resolvePayment = vi.fn(async () => ({
      name: 'Deposit',
      unitAmount: 5000,
      currencyCode: 'USD',
    }));
    const client = new CommerceClient({ ...config, resolvePayment });
    await client.pay('invoice-123');
    expect(resolvePayment).toHaveBeenCalledWith('invoice-123');
    expect(api.createCartOrder).not.toHaveBeenCalled();
    expect(api.getSku).not.toHaveBeenCalled();
    expect(
      vi.mocked(api.createCheckoutSession).mock.calls[0][0].lineItems
    ).toEqual([
      {
        quantity: 1,
        lineItemData: {
          name: 'Deposit',
          priceData: { unitAmount: 5000, currencyCode: 'USD' },
        },
      },
    ]);
  });

  it('fails clearly without OAuth and rejects a checkout for the wrong store', async () => {
    await expect(
      new CommerceClient({ ...config, getAccessToken: undefined }).buyNow(
        'sku-a'
      )
    ).rejects.toThrow('getAccessToken');
    expect(api.createCheckoutSession).not.toHaveBeenCalled();
    vi.mocked(api.createCheckoutSession).mockResolvedValueOnce({
      ...makeSession(),
      storeId: 'another-store',
    });
    const client = new CommerceClient(config);
    await expect(client.buyNow('sku-a')).rejects.toThrow(
      'configured storefront'
    );
    expect(client.getSnapshot().checkout).toBeNull();
  });
});

describe('hydration, locking, and navigation', () => {
  afterEach(() => vi.unstubAllGlobals());

  function stubLocks() {
    const request = vi.fn((_name: string, operation: () => Promise<unknown>) =>
      operation()
    );
    vi.stubGlobal('navigator', { ...navigator, locks: { request } });
    return request;
  }

  it('reads the saved cart once for many ready() calls without taking the write lock', async () => {
    const request = stubLocks();
    const client = new CommerceClient(config);
    localStorage.setItem(client.storageKey, 'cart-1');
    await Promise.all([client.ready(), client.ready(), client.ready()]);
    expect(api.getCartOrder).toHaveBeenCalledTimes(1);
    expect(request).not.toHaveBeenCalled();
    expect(client.getSnapshot().status).toBe('ready');
    await client.ready();
    expect(api.getCartOrder).toHaveBeenCalledTimes(1);
    await client.addItem('sku-a');
    expect(request).toHaveBeenCalledExactlyOnceWith(
      client.storageKey,
      expect.any(Function)
    );
    client.dispose();
  });

  it('reads a saved cart once per mutation, before and after the write', async () => {
    const client = new CommerceClient(config);
    localStorage.setItem(client.storageKey, 'cart-1');
    await client.addItem('sku-a');
    expect(api.getCartOrder).toHaveBeenCalledTimes(2);
    expect(api.getSku).toHaveBeenCalledTimes(1);
    client.dispose();
  });

  it('resolves the OAuth token before taking the cart lock', async () => {
    const request = stubLocks();
    let release!: (token: string) => void;
    const getAccessToken = vi.fn(
      () =>
        new Promise<string>(resolve => {
          release = resolve;
        })
    );
    const client = new CommerceClient({ ...config, getAccessToken });
    await client.addItem('sku-a');
    request.mockClear();
    const checkout = client.checkout();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(getAccessToken).toHaveBeenCalledOnce();
    expect(request).not.toHaveBeenCalled();
    expect(client.getSnapshot().status).toBe('loading');
    release('oauth-token');
    await checkout;
    expect(request).toHaveBeenCalledOnce();
    expect(api.createCheckoutSession).toHaveBeenCalledWith(expect.anything(), {
      accessToken: 'oauth-token',
      apiHost: 'api.godaddy.com',
    });
    client.closeCheckout();
    client.dispose();
  });

  it('releases a saved cart that Commerce reports as not found', async () => {
    const client = new CommerceClient(config);
    localStorage.setItem(client.storageKey, 'gone');
    vi.mocked(api.getCartOrder).mockRejectedValueOnce(
      Object.assign(new Error('Order not found'), {
        name: 'GraphQLErrorWithCodes',
        codes: ['NOT_FOUND'],
        messages: ['Order not found'],
      })
    );
    await client.ready();
    expect(localStorage.getItem(client.storageKey)).toBeNull();
    expect(client.getSnapshot()).toMatchObject({
      cart: null,
      status: 'ready',
      error: null,
    });
    await client.addItem('sku-a');
    expect(api.createCartOrder).toHaveBeenCalledTimes(1);
    client.dispose();
  });

  it('resolves relative navigation URLs against the page and rejects other schemes', async () => {
    const client = new CommerceClient({
      ...config,
      checkout: { returnUrl: '/cart', successUrl: '/thanks' },
    });
    await client.buyNow('sku-a');
    expect(vi.mocked(api.createCheckoutSession).mock.calls[0][0]).toMatchObject(
      {
        returnUrl: `${location.origin}/cart`,
        successUrl: `${location.origin}/thanks`,
      }
    );
    const unsafe = new CommerceClient({
      ...config,
      checkout: { successUrl: 'javascript:alert(1)' },
    });
    await expect(unsafe.buyNow('sku-a')).rejects.toMatchObject({
      code: 'INVALID_URL',
    });
    expect(api.createCheckoutSession).toHaveBeenCalledTimes(1);
  });

  it('derives status from pending work and the last failure', async () => {
    const client = new CommerceClient(config);
    expect(client.getSnapshot().status).toBe('idle');
    const ready = client.ready();
    expect(client.getSnapshot().status).toBe('loading');
    await ready;
    expect(client.getSnapshot().status).toBe('ready');
    vi.mocked(api.getSku).mockRejectedValueOnce(new Error('offline'));
    await expect(client.addItem('sku-a')).rejects.toThrow('offline');
    expect(client.getSnapshot()).toMatchObject({ status: 'error', pending: 0 });
    const retry = client.addItem('sku-a');
    expect(client.getSnapshot()).toMatchObject({
      status: 'loading',
      error: null,
    });
    await retry;
    expect(client.getSnapshot().status).toBe('ready');
    expect(client.getSnapshot().cart?.lineItems).toHaveLength(1);
    client.dispose();
  });
});

describe('server-created sessions', () => {
  it('delegates session creation to createSession without an OAuth token', async () => {
    const createSession = vi.fn(async () => ({
      id: 'server-session',
      url: 'https://checkout.example/c/server-session',
    }));
    const client = new CommerceClient({
      clientId: 'client',
      storeId: 'store',
      channelId: 'channel',
      checkout: { enablePromotionCodes: true },
      createSession,
    });
    await client.addItem('sku-a');
    const session = await client.checkout();
    expect(api.createCheckoutSession).not.toHaveBeenCalled();
    expect(createSession).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        draftOrderId: 'cart-1',
        storeId: 'store',
        channelId: 'channel',
        enablePromotionCodes: true,
        returnUrl: location.href,
        successUrl: location.href,
      })
    );
    expect(session.url).toBe('https://checkout.example/c/server-session');
    expect(client.getSnapshot().checkout?.id).toBe('server-session');
    client.closeCheckout();
    client.dispose();
  });

  it('rejects a server-created session for another storefront or without a URL', async () => {
    const other = new CommerceClient({
      ...config,
      getAccessToken: undefined,
      createSession: async () => ({
        id: 'x',
        url: 'https://checkout.example/x',
        storeId: 'another-store',
      }),
    });
    await expect(other.buyNow('sku-a')).rejects.toMatchObject({
      code: 'CHECKOUT_SCOPE_MISMATCH',
    });
    const incomplete = new CommerceClient({
      ...config,
      getAccessToken: undefined,
      createSession: async () => ({ id: 'x' }),
    });
    await expect(incomplete.buyNow('sku-a')).rejects.toMatchObject({
      code: 'CHECKOUT_CREATE_FAILED',
    });
    expect(api.createCheckoutSession).not.toHaveBeenCalled();
  });
});
