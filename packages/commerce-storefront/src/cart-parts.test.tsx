import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Component, type ErrorInfo, type ReactElement, type ReactNode, useState } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { AddToCartButton, CartButton } from './cart';
import type { CartOrder } from './cart-model';
import {
  CartCheckout,
  CartCheckoutNote,
  CartClose,
  CartDescription,
  CartDrawerRoot,
  CartEmpty,
  CartItemImage,
  CartItemName,
  CartItemOptions,
  CartItemPrice,
  CartItemQuantity,
  CartItemRemove,
  CartItemRoot,
  CartItems,
  CartNotices,
  CartRoot,
  CartSubtotal,
  CartSummary,
  CartTitle,
  useCartItem,
} from './cart-parts';
import { useCart } from './cart-state';
import { Catalog, CatalogProducts, CatalogRoot } from './catalog';
import { CommerceProvider, type CommerceProviderProps, useCommerce } from './commerce-provider';
import { CommerceStorefront } from './commerce-storefront';
import { packageRuleConflicts } from './test-css';

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const storageKey = 'godaddy:commerce-storefront:cart:s';

function order(lines: { id: string; name: string; quantity: number; price: number }[]): CartOrder {
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  return {
    id: 'cart-1',
    lineItems: lines.map((line) => ({
      id: line.id,
      name: line.name,
      quantity: line.quantity,
      details: {
        productAssetUrl: line.id === 'line-1' ? 'https://cdn.test/mug.png' : null,
        selectedOptions: line.id === 'line-2' ? [{ attribute: 'Size', values: ['M'] }] : null,
      },
      totals: { subTotal: { value: line.price * line.quantity, currencyCode: 'USD' } },
    })),
    totals: {
      subTotal: { value: subtotal, currencyCode: 'USD' },
      total: { value: subtotal, currencyCode: 'USD' },
    },
  };
}

/** A connected store with a saved cart of two lines that accepts quantity changes and removals. */
function mockStore({ state = 'ready' }: { state?: string } = {}) {
  localStorage.setItem(storageKey, 'cart-1');
  let lines = [
    { id: 'line-1', name: 'Mug', quantity: 2, price: 1200 },
    { id: 'line-2', name: 'Shirt', quantity: 1, price: 2500 },
  ];
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'https://host.test');
    if (url.pathname.endsWith('/config'))
      return response(state === 'ready' ? { cartScope: 's', currencyCode: 'USD' } : { state });
    const line = url.pathname.match(/\/items\/([^/]+)$/)?.[1];
    if (line && init?.method === 'PATCH') {
      const { quantity } = JSON.parse(String(init.body));
      lines = lines.map((candidate) => (candidate.id === line ? { ...candidate, quantity } : candidate));
    }
    if (line && init?.method === 'DELETE') lines = lines.filter((candidate) => candidate.id !== line);
    if (url.pathname.endsWith('/checkout')) return response({ url: 'https://pay.test/session' });
    if (url.pathname.endsWith('/products'))
      return response({ skuGroups: { edges: [], pageInfo: { hasNextPage: false } } });
    return response({ cart: order(lines) });
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

function app(children: ReactNode, props: Partial<CommerceProviderProps> = {}, path = '/cart'): ReactElement {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } })}>
      <MemoryRouter initialEntries={[path]}>
        <CommerceProvider {...props}>{children}</CommerceProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function OpenCart(): ReactElement {
  const { setOpen } = useCommerce();
  return (
    <button type='button' onClick={() => setOpen(true)}>
      Open
    </button>
  );
}

function LineBadge(): ReactElement {
  const { name, quantity } = useCartItem();
  return <output data-testid='line'>{`${name}×${quantity}`}</output>;
}

describe('composable cart', () => {
  it('builds a custom drawer from parts, edits lines, and checks out', async () => {
    const api = mockStore();
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, origin: 'https://shop.test', assign });
    render(
      app(
        <>
          <OpenCart />
          <CartDrawerRoot className='host-panel'>
            <CartClose />
            <CartTitle />
            <CartItems className='host-list'>
              <CartItemRoot className='host-line'>
                <CartItemName />
                <LineBadge />
                <CartItemPrice />
                <CartItemQuantity />
                <CartItemRemove />
              </CartItemRoot>
            </CartItems>
            <CartSummary className='host-summary'>
              <CartCheckout />
              <CartSubtotal />
            </CartSummary>
          </CartDrawerRoot>
        </>,
        { checkoutSuccessPath: '/thanks' },
      ),
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Open' }));
    const dialog = await screen.findByRole('dialog', { name: 'Your cart' });
    expect(dialog).toHaveClass('host-panel');
    // Without a CartDescription the dialog names no description, so Radix has nothing to warn about.
    expect(dialog).not.toHaveAttribute('aria-describedby');
    await waitFor(() => expect(within(dialog).getAllByTestId('line')).toHaveLength(2));
    const lines = within(dialog).getAllByRole('listitem');
    expect(lines[0]).toHaveClass('host-line');
    expect(lines[0].parentElement).toHaveClass('host-list');
    expect(
      within(dialog)
        .getAllByTestId('line')
        .map((line) => line.textContent),
    ).toEqual(['Mug×2', 'Shirt×1']);
    expect(within(dialog).getByText('$49.00')).toBeVisible();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Increase quantity of Mug' }));
    await waitFor(() => expect(within(dialog).getByText('Mug×3')).toBeInTheDocument());
    const patch = api.mock.calls.find((call) => call[1]?.method === 'PATCH');
    expect(String(patch?.[0])).toBe('/api/commerce/cart/cart-1/items/line-1');
    expect(JSON.parse(String(patch?.[1]?.body))).toEqual({ quantity: 3 });

    await userEvent.click(within(dialog).getByRole('button', { name: 'Remove Shirt' }));
    await waitFor(() => expect(within(dialog).getAllByTestId('line')).toHaveLength(1));
    expect(within(dialog).getByRole('button', { name: 'Decrease quantity of Mug' })).toBeEnabled();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Proceed to Checkout' }));
    await waitFor(() => expect(assign).toHaveBeenCalledWith('https://pay.test/session'));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close cart' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('links the description only while one is rendered', async () => {
    mockStore();
    const warn = vi.spyOn(console, 'warn');
    render(
      app(
        <>
          <OpenCart />
          <CartDrawerRoot>
            <CartTitle />
            <CartDescription />
            <CartItems />
          </CartDrawerRoot>
        </>,
      ),
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Open' }));
    const dialog = await screen.findByRole('dialog', { name: 'Your cart' });
    await waitFor(() => expect(dialog).toHaveAccessibleDescription('Review your items before checkout.'));
    expect(warn).not.toHaveBeenCalled();
  });

  it('shows the cart on a page, with a custom empty state and no close button', async () => {
    mockStore();
    render(
      app(
        <Routes>
          <Route
            path='/cart'
            element={
              <CartRoot className='host-page'>
                <h1>Cart</h1>
                <CartTitle />
                <CartClose />
                <CartItems />
                <CartEmpty>
                  <p>Nothing here yet.</p>
                </CartEmpty>
                <CartSummary>
                  <CartSubtotal />
                  <CartCheckoutNote />
                  <CartCheckout />
                </CartSummary>
              </CartRoot>
            }
          />
        </Routes>,
      ),
    );
    const title = await screen.findByRole('heading', { level: 2, name: 'Your cart' });
    expect(title.closest('section')).toHaveClass('host-page');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close cart' })).not.toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 3, name: 'Mug' })).toBeVisible();
    // The packaged item shows the image and options.
    expect(document.querySelector('img[src="https://cdn.test/mug.png"]')).not.toBeNull();
    expect(screen.getByText('Size: M')).toBeVisible();
    expect(screen.getByText('Checkout is not available yet.')).toBeVisible();
    for (const name of ['Remove Mug', 'Remove Shirt']) {
      await userEvent.click(screen.getByRole('button', { name }));
      await waitFor(() => expect(screen.queryByRole('button', { name })).not.toBeInTheDocument());
    }
    expect(screen.getByText('Nothing here yet.')).toBeVisible();
    expect(screen.queryByText('Subtotal')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Shipping, taxes, and discounts are calculated at checkout.'),
    ).not.toBeInTheDocument();
  });

  it('shows the sample cart on a page and never sends it to the store', async () => {
    const api = mockStore({ state: 'unbound' });
    render(
      app(
        <>
          <CatalogRoot sampleProducts>
            <CatalogProducts />
          </CatalogRoot>
          <CartRoot>
            <CartTitle />
            <CartItems />
            <CartEmpty />
            <CartSummary>
              <CartSubtotal />
              <CartCheckoutNote />
              <CartCheckout />
            </CartSummary>
          </CartRoot>
        </>,
      ),
    );
    const title = await screen.findByRole('heading', { level: 2, name: 'Sample cart' });
    const page = title.closest('section') as HTMLElement;
    expect(page).toHaveAttribute('data-commerce-source', 'sample');
    expect(within(page).getByRole('link', { name: 'Browse products' })).toHaveAttribute('href', '/shop');
    await userEvent.click(screen.getByRole('button', { name: 'Add Product 2 to sample cart' }));
    expect(await within(page).findByRole('heading', { level: 3, name: 'Product 2' })).toBeVisible();
    expect(within(page).getByText('Sample subtotal')).toBeVisible();
    expect(within(page).getByText('Example total in USD. Checkout is not set up yet.')).toBeVisible();
    expect(within(page).queryByText(/calculated at checkout/)).not.toBeInTheDocument();
    await userEvent.click(within(page).getByRole('button', { name: 'Increase quantity of Product 2' }));
    // The line and the subtotal.
    expect(within(page).getAllByText('$40.00')).toHaveLength(2);
    expect(api.mock.calls.every(([input]) => String(input).endsWith('/config'))).toBe(true);
  });

  it('keeps host classes on the connection status', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => {})),
    );
    render(
      app(
        <CartRoot className='host-page'>
          <CartItems />
        </CartRoot>,
      ),
    );
    expect(screen.getByText('Connecting to the store…').closest('.host-page')).not.toBeNull();
  });

  it('shows a storage warning and a refreshable error together', async () => {
    mockStore();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    let fail = true;
    const api = vi.mocked(fetch);
    const store = api.getMockImplementation();
    api.mockImplementation(async (input, init) => {
      if (String(input).endsWith('/cart/cart-1') && fail) return response({ error: 'Cart offline' }, 503);
      return store?.(input, init) as Promise<Response>;
    });
    render(
      app(
        <CartRoot>
          <CartNotices className='host-notices' />
          <CartItems />
        </CartRoot>,
      ),
    );
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Cart offline');
    expect(alert.closest('.host-notices')).not.toBeNull();
    fail = false;
    await userEvent.click(within(alert).getByRole('button', { name: 'Refresh cart' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(
      await screen.findByText('Your browser cannot save the cart. Keep this page open while shopping.'),
    ).toBeVisible();
  });

  it('counts the cart for a custom cart button', async () => {
    mockStore();
    function CustomButton(): ReactElement {
      const { itemCount, loading } = useCart();
      return <output data-testid='count'>{loading ? 'loading' : itemCount}</output>;
    }
    render(
      app(
        <>
          <CustomButton />
          <CartButton />
        </>,
      ),
    );
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('3'));
    expect(screen.getByRole('button', { name: 'Cart 3' })).toBeEnabled();
  });

  it('names the missing root when parts are misplaced', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockStore();
    expect(() => render(app(<CartItems />))).toThrow(
      'CartItems must be rendered inside <CartRoot> or <CartDrawerRoot>.',
    );
    expect(() => render(app(<CartItemName />))).toThrow(
      'CartItemName must be rendered inside <CartItemRoot>.',
    );
    function Orphan(): null {
      useCartItem();
      return null;
    }
    expect(() => render(app(<Orphan />))).toThrow('useCartItem must be rendered inside <CartItemRoot>.');
  });

  it('names CartItems when an item is rendered outside it', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockStore();
    const errors: unknown[] = [];
    render(
      app(
        <CartRoot>
          <Boundary errors={errors}>
            <CartItemRoot>
              <CartItemName />
            </CartItemRoot>
          </Boundary>
        </CartRoot>,
      ),
    );
    await waitFor(() => expect(errors).toHaveLength(1));
    expect(String(errors[0])).toContain('CartItemRoot must be rendered inside <CartItems>.');
  });

  it('puts host classes on an element that no package rule styles', async () => {
    mockStore();
    const conflicts = packageRuleConflicts();
    render(
      app(
        <>
          <OpenCart />
          <CartDrawerRoot className='host'>
            <CartTitle className='host' />
            <CartDescription className='host' />
            <CartClose className='host' />
            <CartNotices className='host' />
            <CartItems className='host'>
              <CartItemRoot className='host'>
                <CartItemImage className='host' />
                <CartItemName className='host' />
                <CartItemOptions className='host' />
                <CartItemPrice className='host' />
                <CartItemQuantity className='host' />
                <CartItemRemove className='host' />
              </CartItemRoot>
            </CartItems>
            <CartEmpty className='host' />
            <CartSummary className='host'>
              <CartSubtotal className='host' />
              <CartCheckoutNote className='host' />
              <CartCheckout className='host' />
            </CartSummary>
          </CartDrawerRoot>
          <CartRoot className='host'>
            <CartTitle />
          </CartRoot>
        </>,
      ),
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Open' }));
    await screen.findByRole('heading', { level: 3, name: 'Shirt' });
    // Drawer, title, description, close, list, summary, subtotal, note, checkout, page root; per line: the root,
    // name, price, quantity and remove, plus the mug's image and the shirt's options.
    expect(document.querySelectorAll('.host')).toHaveLength(10 + 2 * 5 + 2);
    for (const host of document.querySelectorAll('.host')) {
      const part = host.localName + [...host.classList].filter((name) => name !== 'host').join('.');
      expect({ part, conflicts: conflicts(host) }).toEqual({ part, conflicts: [] });
    }
  });

  it('checks the notices and empty state for package rules too', async () => {
    mockStore();
    const store = vi.mocked(fetch).getMockImplementation();
    vi.mocked(fetch).mockImplementation(async (input, init) =>
      String(input).endsWith('/cart/cart-1')
        ? response({ error: 'Cart offline' }, 503)
        : (store?.(input, init) as Promise<Response>),
    );
    const conflicts = packageRuleConflicts();
    render(
      app(
        <CartRoot>
          <CartNotices className='host' />
          <CartItems />
          <CartEmpty className='host' />
        </CartRoot>,
      ),
    );
    await screen.findByText('Cart offline');
    expect(document.querySelectorAll('.host')).toHaveLength(2);
    for (const host of document.querySelectorAll('.host')) expect(conflicts(host)).toEqual([]);
  });

  it('falls back to the default empty state when its children render nothing', async () => {
    mockStore();
    vi.mocked(fetch).mockImplementation(async (input) =>
      String(input).endsWith('/config')
        ? response({ cartScope: 's', currencyCode: 'USD' })
        : response({ cart: null }),
    );
    localStorage.clear();
    const custom = false;
    render(
      app(
        <CartRoot>
          <CartEmpty>{custom && <p>Custom</p>}</CartEmpty>
        </CartRoot>,
      ),
    );
    expect(await screen.findByText('Your cart is empty')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Browse products' })).toBeVisible();
  });

  it('warns when the item template renders no CartItemRoot', async () => {
    mockStore();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      app(
        <CartRoot>
          <CartItems>
            <p>line</p>
          </CartItems>
        </CartRoot>,
      ),
    );
    await waitFor(() => expect(screen.getAllByText('line')).toHaveLength(2));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('renders no <CartItemRoot>'));
    warn.mockClear();
    render(
      app(
        <CartRoot>
          <CartItems />
        </CartRoot>,
      ),
    );
    await screen.findAllByRole('heading', { level: 3, name: 'Mug' });
    expect(warn).not.toHaveBeenCalled();
  });

  it('opens a drawer on add only when one is mounted, and reports every add', async () => {
    mockStore();
    const added = vi.fn();
    function Open(): ReactElement {
      const { open } = useCommerce();
      return <output data-testid='open'>{String(open)}</output>;
    }
    const sku = { id: 'sku-mug' };
    const view = render(
      app(
        <>
          <Open />
          <CartButton />
          <AddToCartButton sku={sku} name='Mug' />
        </>,
        { onItemAdded: added },
      ),
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Add to cart' }));
    await waitFor(() => expect(added).toHaveBeenCalledWith({ name: 'Mug', quantity: 1, isSample: false }));
    expect(screen.getByTestId('open')).toHaveTextContent('false');
    await userEvent.click(screen.getByRole('button', { name: /^Cart/ }));
    expect(screen.getByRole('button', { name: /^Cart/ })).toHaveAttribute('aria-expanded', 'false');
    view.unmount();

    render(
      app(
        <>
          <AddToCartButton sku={sku} name='Mug' />
          <CartDrawerRoot>
            <CartTitle />
          </CartDrawerRoot>
        </>,
        { onItemAdded: added },
      ),
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Add to cart' }));
    expect(await screen.findByRole('dialog', { name: 'Your cart' })).toBeVisible();
    expect(added).toHaveBeenCalledTimes(2);
  });

  it('reports sample adds too', async () => {
    mockStore({ state: 'unbound' });
    const added = vi.fn();
    render(
      app(
        <CatalogRoot sampleProducts>
          <CatalogProducts />
        </CatalogRoot>,
        { onItemAdded: added },
      ),
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Add Product 2 to sample cart' }));
    expect(added).toHaveBeenCalledWith({ name: 'Product 2', quantity: 1, isSample: true });
  });

  it('renders the packaged drawer from CommerceStorefront with dividers between lines', async () => {
    mockStore();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <CommerceStorefront>
            <OpenCart />
          </CommerceStorefront>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Open' }));
    const dialog = await screen.findByRole('dialog', { name: 'Your cart' });
    expect(dialog).toHaveAccessibleDescription('Review your items before checkout.');
    await within(dialog).findByRole('heading', { level: 3, name: 'Shirt' });
    // The reset skips part elements, so the list's divider reaches each line.
    expect(getComputedStyle(within(dialog).getAllByRole('listitem')[0]).borderBottomWidth).not.toBe('0px');
  });
});

describe('add to cart reasons', () => {
  const mug = (quantity: number) => ({
    id: 'sku-mug',
    inventoryCounts: { edges: [{ node: { type: 'AVAILABLE', quantity } }] },
  });

  it('says why the button is disabled', async () => {
    mockStore();
    function Harness(): ReactElement {
      const [quantity, setQuantity] = useState<number>(5);
      const [stock, setStock] = useState<number>(3);
      return (
        <>
          <AddToCartButton sku={mug(stock)} name='Mug' quantity={quantity} />
          <button type='button' onClick={() => setQuantity(1.5)}>
            Fraction
          </button>
          <button type='button' onClick={() => setQuantity(3)}>
            Three
          </button>
          <button type='button' onClick={() => setStock(0)}>
            Sell out
          </button>
        </>
      );
    }
    render(app(<Harness />));
    const button = screen.getByRole('button', { name: 'Add to cart' });
    expect(button).toHaveAccessibleDescription('Connecting to the store…');
    await waitFor(() => expect(button).toHaveAccessibleDescription('Only 3 available.'));
    expect(button).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Fraction' }));
    expect(button).toHaveAccessibleDescription('Enter a whole number of 1 or more.');
    await userEvent.click(screen.getByRole('button', { name: 'Three' }));
    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute('aria-describedby');
    await userEvent.click(screen.getByRole('button', { name: 'Sell out' }));
    expect(screen.getByRole('button', { name: 'Out of stock' })).not.toHaveAttribute('aria-describedby');
  });

  it('treats oversold stock as sold out', async () => {
    mockStore();
    render(app(<AddToCartButton sku={mug(-2)} name='Mug' />));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Out of stock' })).toBeDisabled());
  });

  it('says a store must be connected before adding', async () => {
    mockStore({ state: 'unbound' });
    render(app(<AddToCartButton sku={mug(3)} name='Mug' />));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Add to cart' })).toHaveAccessibleDescription(
        'Connect a store to add items to the cart.',
      ),
    );
  });
});

describe('catalog loading placeholders', () => {
  it('render inside the host grid', async () => {
    let finish!: () => void;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).endsWith('/config')) return response({ cartScope: 's', currencyCode: 'USD' });
        if (String(input).includes('/products')) {
          await new Promise<void>((done) => {
            finish = done;
          });
          return response({ skuGroups: { edges: [], pageInfo: { hasNextPage: false } } });
        }
        return response({ cart: null });
      }),
    );
    render(
      app(
        <CatalogRoot>
          <CatalogProducts className='host-grid' />
        </CatalogRoot>,
      ),
    );
    await waitFor(() =>
      expect(document.querySelectorAll('.host-grid > [aria-hidden="true"]')).toHaveLength(3),
    );
    await act(async () => finish());
    expect(await screen.findByText('No products available.')).toBeVisible();
    expect(document.querySelector('.host-grid')?.children).toHaveLength(0);
  });

  it('still render for the packaged catalog', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) =>
        String(input).endsWith('/config')
          ? response({ cartScope: 's', currencyCode: 'USD' })
          : new Promise<Response>(() => {}),
      ),
    );
    render(app(<Catalog />));
    await waitFor(() =>
      expect(document.querySelectorAll('[aria-hidden="true"].motion-safe\\:animate-pulse')).toHaveLength(3),
    );
  });
});

class Boundary extends Component<{ errors: unknown[]; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }
  componentDidCatch(error: unknown, _info: ErrorInfo): void {
    this.props.errors.push(error);
  }
  render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}
