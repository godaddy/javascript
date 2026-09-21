import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactNode, useState } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { ApiError, CartIdStorage, money, request } from './api';
import { AddToCartButton, CartButton } from './cart';
import { addToCart, type CartOrder } from './cart-model';
import { Catalog } from './catalog';
import type { SKUGroup } from './catalog-model';
import { type CommerceContextValue, useCommerce } from './commerce-provider';
import { CommerceStorefront } from './commerce-storefront';
import { ProductDetails } from './product-details';

const configuration = { cartScope: 'store-one', currencyCode: 'USD' };
const storageKey = 'godaddy:commerce-storefront:cart:store-one';
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const cart = (id = 'cart-1', quantity = 1): CartOrder => ({
  id,
  lineItems: [{ id: 'line-1', skuId: 'sku-1', name: 'Mug', quantity }],
  totals: { total: { value: quantity * 1200, currencyCode: 'USD' } },
});
const item = { skuId: 'sku-1', name: 'Mug', quantity: 1 };
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function mockApi(handler: (path: string, init?: RequestInit) => Response | Promise<Response>) {
  const fn = vi.fn((input: RequestInfo | URL, init?: RequestInit) =>
    Promise.resolve(handler(String(input), init)),
  );
  vi.stubGlobal('fetch', fn);
  return fn;
}
function mount(children?: ReactNode, path = '/shop', checkoutSuccessPath?: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  let context: CommerceContextValue;
  function Observe() {
    context = useCommerce();
    return null;
  }
  function Location() {
    const location = useLocation();
    return <output data-testid='location'>{location.search}</output>;
  }
  const view = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <CommerceStorefront
          checkoutSuccessPath={checkoutSuccessPath}
          theme={{ '--commerce-accent': '#123456' }}
        >
          <Observe />
          <Location />
          {children}
        </CommerceStorefront>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...view, client, context: () => context };
}
async function connected(view: ReturnType<typeof mount>) {
  await waitFor(() => expect(view.context().connection).toBe('ready'));
  await waitFor(() => expect(view.context().hydrating).toBe(false));
}

describe('connection boundary', () => {
  it('preserves the surrounding app and its state while connecting, failing and retrying', async () => {
    const first = deferred<Response>();
    const api = mockApi(() => first.promise);
    function Shell() {
      const [value, setValue] = useState('');
      return (
        <>
          <label>
            Search
            <input value={value} onChange={(event) => setValue(event.target.value)} />
          </label>
          <Catalog />
        </>
      );
    }
    mount(<Shell />);
    const field = screen.getByRole('textbox');
    fireEvent.change(field, { target: { value: 'keep me' } });
    expect(screen.getByText('Connecting to the store…')).toBeVisible();
    await act(async () => first.resolve(response({ error: 'Store offline' }, 503)));
    expect(await screen.findByText('Store offline')).toBeVisible();
    expect(screen.getByRole('textbox')).toBe(field);
    api.mockImplementation(async (input) =>
      String(input).endsWith('/config') ? response(configuration) : response({ skuGroups: { edges: [] } }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Retry connection' }));
    expect(await screen.findByText('No products available.')).toBeVisible();
    expect(field).toHaveValue('keep me');
    expect(screen.getByRole('textbox')).toBe(field);
  });
  it('rejects malformed server configuration before requesting catalog or cart', async () => {
    const api = mockApi(() => response({ cartScope: '', currencyCode: 'invalid' }));
    mount(<Catalog />);
    expect(await screen.findByText('The store returned invalid configuration.')).toBeVisible();
    expect(api).toHaveBeenCalledTimes(1);
  });
});

describe('shared cart', () => {
  it('returns keyboard focus to the add trigger and never submits a host form', async () => {
    const submit = vi.fn((event) => event.preventDefault());
    mockApi((path) => (path.endsWith('/config') ? response(configuration) : response({ cart: cart() })));
    const view = mount(
      <form onSubmit={submit}>
        <AddToCartButton sku={{ id: 'sku-1' }} name='Mug' />
        <CartButton />
      </form>,
    );
    await connected(view);
    const trigger = screen.getByRole('button', { name: 'Add to cart' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await screen.findByRole('dialog');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(submit).not.toHaveBeenCalled();
  });

  it('serializes two first additions, persists the cart, and themes the accessible drawer', async () => {
    const create = deferred<Response>();
    const writes: string[] = [];
    const api = mockApi((path, init) => {
      if (path.endsWith('/config')) return response(configuration);
      expect(new Headers(init?.headers).get('X-Commerce-Scope')).toBe('store-one');
      if (init?.method === 'POST') {
        writes.push(path);
        return path.endsWith('/items') ? response({ cart: cart('cart-1', 2) }) : create.promise;
      }
      return response({ cart: cart() });
    });
    const view = mount();
    await connected(view);
    let tasks: Promise<boolean>[] = [];
    act(() => {
      tasks = [view.context().addItem(item), view.context().addItem(item)];
    });
    await waitFor(() => expect(writes).toEqual(['/api/commerce/cart']));
    await act(async () => {
      create.resolve(response({ cart: cart() }));
      await Promise.all(tasks);
    });
    expect(writes).toEqual(['/api/commerce/cart', '/api/commerce/cart/cart-1/items']);
    expect(view.context().cart?.lineItems?.[0]?.quantity).toBe(2);
    expect(localStorage.getItem(storageKey)).toBe('cart-1');
    const dialog = screen.getByRole('dialog', { name: 'Your cart' });
    expect(dialog.closest('.commerce-storefront')).toHaveStyle('--commerce-accent: #123456');
    expect(within(dialog).getByText('Checkout is not available yet.')).toBeVisible();
    expect(JSON.parse(String(api.mock.calls.find((call) => call[1]?.method === 'POST')?.[1]?.body))).toEqual({
      lineItems: [item],
    });
  });
  it.each([404, 410])(
    'clears an expired cart (%i) without treating server/network errors as expiry',
    async (status) => {
      localStorage.setItem(storageKey, 'expired');
      mockApi((path) =>
        path.endsWith('/config') ? response(configuration) : response({ error: 'Expired' }, status),
      );
      const view = mount();
      await connected(view);
      expect(view.context().cart).toBeNull();
      expect(localStorage.getItem(storageKey)).toBeNull();
      expect(view.context().error).toBeNull();
    },
  );
  it('keeps a cart ID after hydration fails and does not create a duplicate order', async () => {
    localStorage.setItem(storageKey, 'existing');
    const api = mockApi((path) =>
      path.endsWith('/config') ? response(configuration) : response({ error: 'Offline' }, 503),
    );
    const view = mount();
    await connected(view);
    await act(async () => {
      expect(await view.context().addItem(item)).toBe(false);
    });
    expect(localStorage.getItem(storageKey)).toBe('existing');
    expect(view.context().error).toBe('Offline');
    expect(api.mock.calls.every((call) => call[1]?.method !== 'POST')).toBe(true);
  });
  it('ignores an old binding response after the store changes', async () => {
    const add = deferred<Response>();
    mockApi((path, init) =>
      path.endsWith('/config')
        ? response(configuration)
        : init?.method === 'POST'
          ? add.promise
          : response({ cart: null }),
    );
    const view = mount();
    await connected(view);
    let task!: Promise<boolean>;
    act(() => {
      task = view.context().addItem(item);
    });
    await waitFor(() => expect(view.context().pending).toBe(true));
    // Allow the add request to start before switching the server-provided binding.
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      view.client.setQueryData(['commerce', 'configuration'], { ...configuration, cartScope: 'store-two' });
    });
    await connected(view);
    await act(async () => {
      add.resolve(response({ cart: cart() }));
      expect(await task).toBe(false);
    });
    expect(view.context().cart).toBeNull();
    expect(view.context().open).toBe(false);
    expect(view.context().announcement).toBe('');
    expect(localStorage.getItem('godaddy:commerce-storefront:cart:store-two')).toBeNull();
  });
  it('does not revive a stale operation when the same store disconnects and reconnects', async () => {
    const add = deferred<Response>();
    const api = mockApi((path, init) =>
      path.endsWith('/config')
        ? response(configuration)
        : init?.method === 'POST'
          ? add.promise
          : response({ cart: null }),
    );
    const view = mount();
    await connected(view);
    let task!: Promise<boolean>;
    act(() => {
      task = view.context().addItem(item);
    });
    await waitFor(() => expect(api.mock.calls.some((call) => call[1]?.method === 'POST')).toBe(true));
    api.mockImplementation(async (input) =>
      String(input).endsWith('/config') ? response({ error: 'Disconnected' }, 503) : response({ cart: null }),
    );
    await act(async () => {
      await view.client.refetchQueries({ queryKey: ['commerce', 'configuration'] });
    });
    await waitFor(() => expect(view.context().connection).toBe('error'));
    act(() => {
      view.client.setQueryData(['commerce', 'configuration'], configuration);
    });
    await connected(view);
    await act(async () => {
      add.resolve(response({ cart: cart() }));
      expect(await task).toBe(false);
    });
    expect(view.context().cart).toBeNull();
    expect(view.context().open).toBe(false);
  });
  it('requires explicit checkout enablement and rejects an unsafe session URL', async () => {
    localStorage.setItem(storageKey, 'cart-1');
    const api = mockApi((path) =>
      path.endsWith('/config')
        ? response(configuration)
        : path.endsWith('/checkout')
          ? response({ url: 'javascript:alert(1)' })
          : response({ cart: cart() }),
    );
    const disabled = mount();
    await connected(disabled);
    await act(async () => {
      expect(await disabled.context().checkout()).toBe(false);
    });
    expect(disabled.context().error).toBe('Checkout has not been enabled for this store.');
    expect(api.mock.calls.some((call) => String(call[0]).endsWith('/checkout'))).toBe(false);
    disabled.unmount();
    const enabled = mount(undefined, '/shop', '/order-return');
    await connected(enabled);
    await act(async () => {
      expect(await enabled.context().checkout()).toBe(false);
    });
    expect(enabled.context().error).toBe('Commerce returned an invalid checkout URL.');
    const body = JSON.parse(
      String(api.mock.calls.find((call) => String(call[0]).endsWith('/checkout'))?.[1]?.body),
    );
    expect(body).toMatchObject({ draftOrderId: 'cart-1' });
    expect(new URL(body.successUrl).pathname).toBe('/order-return');
    expect(new URL(body.successUrl).searchParams.get('orderId')).toBe('cart-1');
  });
});

const group: SKUGroup = {
  id: 'shirt',
  label: 'Shirt',
  attributes: {
    edges: [
      {
        node: {
          name: 'color',
          label: 'Color',
          values: {
            edges: [
              { node: { id: 'id-blue', name: 'blue', label: 'Blue' } },
              { node: { id: 'id-red', name: 'red', label: 'Red' } },
            ],
          },
        },
      },
    ],
  },
  skus: { totalCount: 2, edges: [] },
};
describe('catalog and product selection', () => {
  it('waits for verified attribute names and blocks sold-out variants', async () => {
    const api = mockApi((path) => {
      if (path.endsWith('/config')) return response(configuration);
      const color = new URL(path, 'https://example.test').searchParams.get('attributeValues');
      const selected = {
        id: `sku-${color}`,
        inventoryCounts: { edges: [{ node: { type: 'AVAILABLE', quantity: color === 'blue' ? 3 : 0 } }] },
        prices: { edges: [{ node: { value: { value: 1200, currencyCode: 'USD' } } }] },
      };
      return response({
        skuGroup: color ? { ...group, skus: { totalCount: 1, edges: [{ node: selected }] } } : group,
      });
    });
    const view = mount(
      <Routes>
        <Route path='/products/:productId' element={<ProductDetails />} />
      </Routes>,
      '/products/shirt',
    );
    await connected(view);
    expect(await screen.findByRole('button', { name: 'Add to cart' })).toBeDisabled();
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Color' }), 'blue');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add to cart' })).toBeEnabled());
    expect(api.mock.calls.some((call) => String(call[0]).includes('attributeValues=blue'))).toBe(true);
    expect(screen.getByTestId('product-price')).toHaveTextContent('$12.00');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Color' }), 'red');
    expect(await screen.findByRole('button', { name: 'Out of stock' })).toBeDisabled();
  });
  it('preserves unrelated URL state during cursor pagination and binds catalog requests', async () => {
    const api = mockApi((path) =>
      path.endsWith('/config')
        ? response(configuration)
        : response({
            skuGroups: {
              edges: [],
              pageInfo: { hasNextPage: !path.includes('after='), endCursor: 'cursor+next' },
            },
          }),
    );
    const view = mount(<Catalog />, '/shop?campaign=spring');
    await connected(view);
    await userEvent.click(await screen.findByRole('button', { name: 'Next page' }));
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('campaign=spring&after=cursor%2Bnext'),
    );
    await userEvent.click(screen.getByRole('button', { name: 'First page' }));
    expect(screen.getByTestId('location')).toHaveTextContent('?campaign=spring');
    const catalogRequests = api.mock.calls.filter((call) => String(call[0]).includes('/products'));
    expect(
      catalogRequests.every((call) => new Headers(call[1]?.headers).get('X-Commerce-Scope') === 'store-one'),
    ).toBe(true);
  });
});

describe('storage and transport', () => {
  it('encodes reserved characters in an existing cart ID', async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      response({ cart: cart('order/with?reserved#characters') }),
    );
    await addToCart('order/with?reserved#characters', item, fetcher);
    expect(fetcher.mock.calls[0]?.[0]).toBe('/api/commerce/cart/order%2Fwith%3Freserved%23characters/items');
  });

  it('retains an unsaved ID and pending clear when storage writes fail but reads succeed', () => {
    localStorage.setItem('cart', 'old');
    const storage = new CartIdStorage('cart');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });
    expect(() => storage.write('new')).toThrow('Quota exceeded');
    expect(storage.read()).toBe('new');
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('Denied');
    });
    expect(() => storage.write(null)).toThrow('Denied');
    expect(storage.read()).toBeNull();
  });
  it('surfaces non-JSON API failures as typed errors with the original cause', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<html>Unavailable</html>', { status: 502 })),
    );
    const error = await request('/config').catch((error) => error);
    expect(error).toBeInstanceOf(ApiError);
    if (!(error instanceof ApiError)) throw error;
    expect(error.status).toBe(502);
    expect(error.cause).toBeInstanceOf(SyntaxError);
  });
  it('formats currency minor units according to the currency exponent', () => {
    expect(money(1234, 'USD')).toBe('$12.34');
    expect(money(1234, 'JPY')).toBe('¥1,234');
    expect(money(1234, 'KWD')).toContain('1.234');
  });
});
