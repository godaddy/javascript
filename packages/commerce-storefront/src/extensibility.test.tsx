import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Component, type ErrorInfo, type ReactElement, type ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { AddToCartButton, CartButton } from './cart';
import type { CartOrder } from './cart-model';
import {
  CartCheckout,
  CartItemRemove,
  CartItemRoot,
  CartItems,
  CartRoot,
  CartSummary,
  CartTitle,
} from './cart-parts';
import { CatalogEmpty, CatalogPagination, CatalogProducts, CatalogRoot } from './catalog';
import type { SKU, SKUGroup } from './catalog-model';
import { type CommerceEvent, type CommerceProviderProps, useMoney } from './commerce-provider';
import { CommerceStorefront } from './commerce-storefront';
import { ProductCardAction, ProductCardPrice, ProductCardRoot } from './product-card';
import { ProductDetailsRoot, useProductDetails } from './product-details-context';
import { ProductDetailsAddToCart, ProductDetailsOption } from './product-purchase';

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const storageKey = 'godaddy:commerce-storefront:cart:s';
const sku = (id: string): SKU => ({
  id,
  prices: { edges: [{ node: { value: { value: 1200, currencyCode: 'USD' } } }] },
  inventoryCounts: { edges: [{ node: { type: 'AVAILABLE', quantity: 5 } }] },
});
const mug: SKUGroup = {
  id: 'mug',
  label: 'Mug',
  priceRange: { min: 1200, max: 1200 },
  skus: { totalCount: 1, edges: [{ node: sku('sku-mug') }] },
};
const shirt: SKUGroup = {
  id: 'shirt',
  label: 'Shirt',
  priceRange: { min: 2000, max: 2500 },
  attributes: {
    edges: [
      {
        node: {
          name: 'color',
          label: 'Color',
          values: {
            edges: ['blue', 'red'].map((name) => ({ node: { id: name, name, label: name.toUpperCase() } })),
          },
        },
      },
    ],
  },
  skus: { totalCount: 2, edges: [] },
};

function order(lines: { id: string; name: string; quantity: number }[]): CartOrder {
  const subtotal = lines.reduce((sum, line) => sum + 1200 * line.quantity, 0);
  return {
    id: 'cart-1',
    lineItems: lines.map((line) => ({
      ...line,
      totals: { subTotal: { value: 1200 * line.quantity, currencyCode: 'USD' } },
    })),
    totals: {
      subTotal: { value: subtotal, currencyCode: 'USD' },
      total: { value: subtotal, currencyCode: 'USD' },
    },
  };
}

/** A connected store with products, and a saved one-line cart when `savedCart` is set. */
function mockStore({
  savedCart = false,
  failPatch = false,
  emptyCatalog = false,
  checkout,
}: {
  savedCart?: boolean;
  failPatch?: boolean;
  emptyCatalog?: boolean;
  checkout?: Promise<Response>;
} = {}) {
  if (savedCart) localStorage.setItem(storageKey, 'cart-1');
  let lines = savedCart ? [{ id: 'line-1', name: 'Mug', quantity: 2 }] : [];
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'https://host.test');
    const path = url.pathname.replace('/api/commerce', '');
    if (path === '/config') return response({ cartScope: 's', currencyCode: 'USD' });
    if (path === '/products')
      return response({
        skuGroups: {
          edges: emptyCatalog ? [] : [mug, shirt].map((node) => ({ node })),
          pageInfo: { hasNextPage: true, endCursor: 'c2' },
        },
      });
    if (path === '/products/missing') return response({ error: 'Not found' }, 404);
    if (path === '/products/broken') return response({ error: 'The catalog is down.' }, 500);
    if (path.startsWith('/products/')) {
      const group = path.endsWith('/mug') ? mug : shirt;
      const selected = url.searchParams.getAll('attributeValues');
      return response({
        skuGroup: selected.length
          ? { ...group, skus: { totalCount: 1, edges: [{ node: sku(`sku-${selected.join('-')}`) }] } }
          : group,
      });
    }
    if (path === '/checkout') return checkout ?? response({ url: 'https://pay.test/session' });
    const line = path.match(/\/items\/([^/]+)$/)?.[1];
    if (line && init?.method === 'PATCH') {
      if (failPatch) return response({ error: 'Quantity rejected.' }, 409);
      const { quantity } = JSON.parse(String(init.body));
      lines = lines.map((candidate) => (candidate.id === line ? { ...candidate, quantity } : candidate));
    }
    if (line && init?.method === 'DELETE') lines = lines.filter((candidate) => candidate.id !== line);
    if (init?.method === 'POST' && path === '/cart') lines = [{ id: 'line-1', name: 'Mug', quantity: 1 }];
    return response({ cart: order(lines) }, init?.method === 'POST' ? 201 : 200);
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

function mount(layout: ReactNode, props: Partial<CommerceProviderProps> = {}, path = '/products/shirt') {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } })}>
      <MemoryRouter initialEntries={[path]}>
        <CommerceStorefront {...props}>
          <Routes>
            <Route path='/products/:productId' element={layout} />
            <Route path='*' element={layout} />
          </Routes>
          <Search />
        </CommerceStorefront>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function Search(): ReactElement {
  return <output data-testid='search'>{useLocation().search}</output>;
}

function Status({ id }: { id: string }): ReactElement {
  const { status, selectedSku } = useProductDetails();
  return <output data-testid={id}>{`${status}:${selectedSku?.id ?? 'none'}`}</output>;
}

class Boundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  componentDidCatch(_error: Error, _info: ErrorInfo) {}
  render() {
    return this.state.error ? <p role='alert'>{this.state.error}</p> : this.props.children;
  }
}

describe('roots that do not depend on the route', () => {
  it('keeps a quick view selection out of the page URL and apart from the page product', async () => {
    mockStore();
    mount(
      <>
        <ProductDetailsRoot>
          <ProductDetailsOption attribute='color' />
          <Status id='page' />
        </ProductDetailsRoot>
        <section aria-label='Quick view'>
          <ProductDetailsRoot productId='mug' urlState={false}>
            <ProductDetailsAddToCart />
            <Status id='quick' />
          </ProductDetailsRoot>
          <ProductDetailsRoot productId='shirt' urlState={false}>
            <ProductDetailsOption attribute='color' />
            <Status id='quick-shirt' />
          </ProductDetailsRoot>
        </section>
      </>,
    );
    await waitFor(() => expect(screen.getByTestId('quick')).toHaveTextContent('ready:sku-mug'));
    const quickView = screen.getByRole('region', { name: 'Quick view' });
    await userEvent.selectOptions(await within(quickView).findByRole('combobox', { name: 'Color' }), 'red');
    await waitFor(() => expect(screen.getByTestId('quick-shirt')).toHaveTextContent('ready:sku-red'));
    expect(screen.getByTestId('search')).toHaveTextContent(/^$/);
    expect(screen.getByTestId('page')).toHaveTextContent('incomplete:none');

    const [pageColor] = screen.getAllByRole('combobox', { name: 'Color' });
    await userEvent.selectOptions(pageColor, 'blue');
    await waitFor(() => expect(screen.getByTestId('page')).toHaveTextContent('ready:sku-blue'));
    expect(screen.getByTestId('search')).toHaveTextContent('?option.color=blue');
    expect(screen.getByTestId('quick-shirt')).toHaveTextContent('ready:sku-red');
  });

  it('warns instead of requesting a product when there is no product ID', async () => {
    const api = mockStore();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mount(<ProductDetailsRoot>{null}</ProductDetailsRoot>, {}, '/item');
    expect(await screen.findByRole('heading', { name: 'Product not found' })).toBeVisible();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Pass `productId`'));
    expect(api.mock.calls.some((call) => String(call[0]).includes('/products'))).toBe(false);
  });

  it('replaces the loading, not-found and error states', async () => {
    const api = mockStore();
    mount(
      <>
        <ProductDetailsRoot productId='missing' notFound={<p>That product is gone.</p>}>
          {null}
        </ProductDetailsRoot>
        <ProductDetailsRoot
          productId='broken'
          error={({ message, retry }) => (
            <button type='button' onClick={retry}>{`Try again: ${message}`}</button>
          )}
        >
          {null}
        </ProductDetailsRoot>
        <ProductDetailsRoot productId='shirt' loading={<p>Fetching…</p>}>
          {null}
        </ProductDetailsRoot>
      </>,
    );
    expect(await screen.findByText('Fetching…')).toBeVisible();
    expect(await screen.findByText('That product is gone.')).toBeVisible();
    const retry = await screen.findByRole('button', { name: 'Try again: The catalog is down.' });
    const requests = () =>
      api.mock.calls.filter((call) => String(call[0]).endsWith('/products/broken')).length;
    expect(requests()).toBe(1);
    await userEvent.click(retry);
    await waitFor(() => expect(requests()).toBe(2));
  });

  it('pages a catalog by its own page size without changing the page URL', async () => {
    const api = mockStore();
    mount(
      <CatalogRoot pageSize={2} urlState={false}>
        <CatalogProducts />
        <CatalogPagination />
      </CatalogRoot>,
      {},
      '/shop?campaign=spring',
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Next page' }));
    await waitFor(() =>
      expect(api.mock.calls.map((call) => String(call[0]))).toContain(
        '/api/commerce/products?first=2&after=c2',
      ),
    );
    expect(api.mock.calls.map((call) => String(call[0]))).toContain('/api/commerce/products?first=2');
    expect(screen.getByTestId('search')).toHaveTextContent('?campaign=spring');
    expect(await screen.findByRole('button', { name: 'First page' })).toBeVisible();
  });

  it('shows a custom empty state in place of the default one', async () => {
    mockStore({ emptyCatalog: true });
    mount(
      <>
        <CatalogRoot>
          <CatalogProducts />
          <CatalogEmpty className='host-empty'>
            <p>New arrivals soon.</p>
          </CatalogEmpty>
        </CatalogRoot>
        <CatalogRoot urlState={false}>
          <CatalogProducts />
        </CatalogRoot>
      </>,
      {},
      '/shop',
    );
    const custom = (await screen.findByText('New arrivals soon.')).parentElement;
    expect(custom).toHaveClass('host-empty');
    expect(custom).toHaveAttribute('data-commerce-part', 'catalog-empty');
    // Only the catalog without a CatalogEmpty shows the default message.
    expect(await screen.findAllByText('No products available.')).toHaveLength(1);
  });

  it('rejects a page size that is not a whole number of 1 or more', () => {
    mockStore();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mount(
      <Boundary>
        <CatalogRoot pageSize={0}>{null}</CatalogRoot>
      </Boundary>,
      {},
      '/shop',
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'CatalogRoot pageSize must be a whole number of 1 or more',
    );
  });
});

describe('replacement labels', () => {
  it('keeps each control behavior while the host replaces its text', async () => {
    let pay: (value: Response) => void = () => {};
    const session = new Promise<Response>((resolve) => {
      pay = resolve;
    });
    mockStore({ savedCart: true, checkout: session });
    vi.stubGlobal('location', { ...window.location, origin: 'https://shop.test', assign: vi.fn() });
    mount(
      <>
        <CartButton>{({ itemCount }) => `Bag (${itemCount})`}</CartButton>
        <CartRoot>
          <CartTitle>{({ isSample }) => (isSample ? 'Demo bag' : 'Your bag')}</CartTitle>
          <CartItems />
          <CartSummary>
            <CartCheckout>{({ busy }) => (busy ? 'Paying…' : 'Pay now')}</CartCheckout>
          </CartSummary>
        </CartRoot>
        <CartRoot>
          <CartItems>
            <CartItemRoot>
              <CartItemRemove>{() => null}</CartItemRemove>
            </CartItemRoot>
          </CartItems>
        </CartRoot>
      </>,
      { checkoutSuccessPath: '/thanks' },
      '/cart',
    );
    expect(await screen.findByRole('button', { name: 'Bag (2)' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Your bag' })).toBeVisible();
    const checkout = await screen.findByRole('button', { name: 'Pay now' });
    expect(checkout.closest('[data-commerce-part]')).toHaveAttribute('data-commerce-part', 'cart-checkout');
    await waitFor(() => expect(checkout).toBeEnabled());
    await userEvent.click(checkout);
    expect(await screen.findByRole('button', { name: 'Paying…' })).toHaveAttribute('aria-busy', 'true');
    pay(response({ url: 'https://pay.test/session' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Pay now' })).toBeVisible());
    // An empty label falls back to the package text instead of an unlabeled button.
    for (const remove of screen.getAllByRole('button', { name: 'Remove Mug' }))
      expect(remove).toHaveTextContent('Remove');
  });

  it('starts each accessible name with the replaced label', async () => {
    mockStore({ savedCart: true });
    mount(
      <>
        <CartRoot>
          <CartItems>
            <CartItemRoot>
              <CartItemRemove>Delete</CartItemRemove>
            </CartItemRoot>
          </CartItems>
        </CartRoot>
        <CartRoot>
          <CartItems />
        </CartRoot>
      </>,
      {},
      '/cart',
    );
    // Voice control users say the visible label, so the name must start with it.
    const replaced = await screen.findByRole('button', { name: 'Delete Mug' });
    expect(replaced).toHaveTextContent(/^Delete/);
    expect(replaced).not.toHaveAttribute('aria-label');
    expect(screen.getByRole('button', { name: 'Remove Mug' })).toHaveTextContent(/^Remove/);
  });

  it('starts a sample card name with the replaced label', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => response({ state: 'unbound' })),
    );
    mount(
      <>
        <CatalogRoot sampleProducts>
          <CatalogProducts>
            <ProductCardRoot>
              <ProductCardAction>Buy</ProductCardAction>
            </ProductCardRoot>
          </CatalogProducts>
        </CatalogRoot>
        <CatalogRoot sampleProducts>
          <CatalogProducts />
        </CatalogRoot>
      </>,
      {},
      '/shop',
    );
    expect(await screen.findByRole('button', { name: 'Buy (Product 1, sample)' })).toHaveTextContent(/^Buy/);
    expect(screen.getByRole('button', { name: 'Add Product 1 to sample cart' })).toBeVisible();
  });

  it('labels card actions by what they do', async () => {
    mockStore();
    mount(
      <CatalogRoot>
        <CatalogProducts>
          <ProductCardRoot>
            <ProductCardAction>
              {({ action }) => (action === 'add' ? 'Buy' : 'Pick a color')}
            </ProductCardAction>
          </ProductCardRoot>
        </CatalogProducts>
      </CatalogRoot>,
      {},
      '/shop',
    );
    expect(await screen.findByRole('button', { name: 'Buy' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Pick a color' })).toHaveAttribute('href', '/products/shirt');
  });

  it('marks every part with its stable name', async () => {
    mockStore();
    const { container } = mount(
      <ProductDetailsRoot>
        <ProductDetailsOption attribute='color' />
        <ProductDetailsAddToCart>Add to bag</ProductDetailsAddToCart>
      </ProductDetailsRoot>,
    );
    const button = await screen.findByRole('button', { name: 'Add to bag' });
    expect(button).toHaveAttribute('data-commerce-part', 'add-to-cart-button');
    expect(
      [...container.querySelectorAll('[data-commerce-part]')].map((part) =>
        part.getAttribute('data-commerce-part'),
      ),
    ).toEqual([
      'product-details-root',
      'product-details-option',
      'product-details-add-to-cart',
      'add-to-cart-button',
    ]);
    expect(container.querySelector('[data-commerce-part="product-details-option"]')).toHaveAttribute(
      'data-commerce-attribute',
      'color',
    );
  });
});

describe('locale', () => {
  function Total(): ReactElement {
    const money = useMoney();
    return <output data-testid='total'>{money(123456)}</output>;
  }

  it('formats package and custom prices in the provider locale', async () => {
    mockStore();
    mount(
      <CatalogRoot>
        <CatalogProducts>
          <ProductCardRoot>
            <ProductCardPrice />
          </ProductCardRoot>
        </CatalogProducts>
        <Total />
      </CatalogRoot>,
      { locale: 'de-DE' },
      '/shop',
    );
    expect(await screen.findByText(/^12,00\s\$$/)).toBeVisible();
    expect(screen.getByText(/^20,00\s\$ – 25,00\s\$$/)).toBeVisible();
    expect(screen.getByTestId('total')).toHaveTextContent(/^1\.234,56\s\$$/);
  });

  it('falls back to en-US for an invalid locale', async () => {
    mockStore();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mount(
      <CatalogRoot>
        <Total />
      </CatalogRoot>,
      { locale: 'not a locale!' },
      '/shop',
    );
    expect(await screen.findByTestId('total')).toHaveTextContent('$1,234.56');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"not a locale!" is not a valid locale'));
  });
});

describe('onEvent', () => {
  it('reports confirmed cart changes, then checkout', async () => {
    mockStore();
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, origin: 'https://shop.test', assign });
    const events: CommerceEvent[] = [];
    mount(
      <>
        <AddToCartButton sku={sku('sku-mug')} name='Mug' />
        <CartRoot>
          <CartItems />
          <CartSummary>
            <CartCheckout />
          </CartSummary>
        </CartRoot>
      </>,
      { checkoutSuccessPath: '/thanks', onEvent: (event) => events.push(event) },
      '/cart',
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Add to cart' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Increase quantity of Mug' }));
    await waitFor(() => expect(events).toHaveLength(2));
    await userEvent.click(screen.getByRole('button', { name: 'Proceed to Checkout' }));
    await waitFor(() => expect(assign).toHaveBeenCalled());
    await userEvent.click(screen.getByRole('button', { name: 'Remove Mug' }));
    await waitFor(() => expect(events).toHaveLength(4));
    expect(events).toEqual([
      { type: 'item-added', skuId: 'sku-mug', name: 'Mug', quantity: 1, isSample: false },
      { type: 'quantity-changed', itemId: 'line-1', quantity: 2, isSample: false },
      { type: 'checkout-started', cartId: 'cart-1' },
      { type: 'item-removed', itemId: 'line-1', isSample: false },
    ]);
  });

  it('reports failures with the message the cart shows', async () => {
    mockStore({ savedCart: true, failPatch: true });
    const onEvent = vi.fn();
    mount(
      <CartRoot>
        <CartItems />
      </CartRoot>,
      { onEvent },
      '/cart',
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Increase quantity of Mug' }));
    await waitFor(() =>
      expect(onEvent).toHaveBeenCalledWith({
        type: 'error',
        operation: 'change-quantity',
        message: 'Quantity rejected.',
      }),
    );
  });

  it('reports sample changes as samples', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => response({ state: 'unbound' })),
    );
    const onEvent = vi.fn();
    mount(
      <CatalogRoot sampleProducts>
        <CatalogProducts />
        <CartRoot>
          <CartItems />
        </CartRoot>
      </CatalogRoot>,
      { onEvent },
      '/shop',
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Add Product 1 to sample cart' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Increase quantity of Product 1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Remove Product 1' }));
    expect(onEvent.mock.calls.map(([event]) => event)).toEqual([
      { type: 'item-added', skuId: null, name: 'Product 1', quantity: 1, isSample: true },
      { type: 'quantity-changed', itemId: 'sample-1', quantity: 2, isSample: true },
      { type: 'item-removed', itemId: 'sample-1', isSample: true },
    ]);
  });

  it('keeps an add successful when a host callback throws', async () => {
    mockStore();
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onItemAdded = vi.fn(() => {
      throw new Error('analytics is down');
    });
    mount(
      <>
        <AddToCartButton sku={sku('sku-mug')} name='Mug' />
        <CartButton />
      </>,
      { onItemAdded, onEvent: () => {} },
      '/cart',
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Add to cart' }));
    await waitFor(() =>
      expect(onItemAdded).toHaveBeenCalledWith({ name: 'Mug', quantity: 1, isSample: false }),
    );
    // The add opened the packaged drawer, as a successful add does, with no cart error.
    const drawer = await screen.findByRole('dialog', { name: 'Your cart' });
    expect(within(drawer).getByRole('heading', { name: 'Mug' })).toBeVisible();
    expect(within(drawer).queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cart 1', hidden: true })).toBeInTheDocument();
    expect(logged).toHaveBeenCalledWith(
      '[gd-commerce-storefront] A storefront callback threw.',
      expect.any(Error),
    );
  });
});
