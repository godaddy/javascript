import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { CartButton } from './cart';
import type { CartOrder } from './cart-model';
import {
  CartDrawerRoot,
  CartItemName,
  CartItemPrice,
  CartItemRoot,
  CartItems,
  CartRoot,
  CartSubtotal,
  CartTitle,
} from './cart-parts';
import { Catalog, CatalogHeader, CatalogProducts, CatalogRoot } from './catalog';
import type { SKU, SKUGroup } from './catalog-model';
import {
  COMMERCE_DATA_ATTRIBUTE,
  type CommerceContextValue,
  CommerceProvider,
  type CommerceProviderProps,
  useCommerce,
  useCommerceData,
} from './commerce-provider';
import { CommerceStorefront } from './commerce-storefront';
import { ProductCard } from './product-card';
import { ProductDetails } from './product-details';
import { RelatedProducts } from './related-products';

const marked = `[${COMMERCE_DATA_ATTRIBUTE}="commerce"]`;
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const sku = (id: string): SKU => ({
  id,
  prices: { edges: [{ node: { value: { value: 1200, currencyCode: 'USD' } } }] },
  inventoryCounts: { edges: [{ node: { type: 'AVAILABLE', quantity: 5 } }] },
});
const product = (id: string, label: string): SKUGroup => ({
  id,
  label,
  description: `${label} description`,
  priceRange: { min: 1200, max: 1200 },
  skus: { totalCount: 1, edges: [{ node: sku(`sku-${id}`) }] },
});
const mug: SKUGroup = product('mug', 'Mug');
const cup: SKUGroup = product('cup', 'Cup');
const cart: CartOrder = {
  id: 'cart-1',
  lineItems: [
    {
      id: 'line-1',
      skuId: 'sku-mug',
      name: 'Mug',
      quantity: 2,
      totals: { subTotal: { value: 2400, currencyCode: 'USD' } },
    },
  ],
  totals: { subTotal: { value: 2400, currencyCode: 'USD' }, total: { value: 2400, currencyCode: 'USD' } },
};

function mockStore(state: 'ready' | 'unbound' | 'connecting' = 'ready') {
  localStorage.setItem('godaddy:commerce-storefront:cart:s', 'cart-1');
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const path = new URL(String(input), 'https://host.test').pathname.replace('/api/commerce', '');
      if (path === '/config')
        return response(state === 'ready' ? { cartScope: 's', currencyCode: 'USD' } : { state });
      if (path === '/products')
        return response({ skuGroups: { edges: [mug, cup].map((node) => ({ node })), pageInfo: {} } });
      if (path.startsWith('/products/')) return response({ skuGroup: mug });
      return response({ cart });
    }),
  );
}

let context: CommerceContextValue;
function Observe(): null {
  context = useCommerce();
  return null;
}

function mount(children: ReactNode, props: Partial<CommerceProviderProps> = {}, path = '/shop') {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } })}>
      <MemoryRouter initialEntries={[path]}>
        <CommerceProvider {...props}>
          <Observe />
          <Routes>
            <Route path='/products/:productId' element={children} />
            <Route path='*' element={children} />
          </Routes>
        </CommerceProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/** The `data-commerce-part` names of the marked elements inside `root`, in document order. */
const markedParts = (root: ParentNode): (string | null)[] =>
  [...root.querySelectorAll(marked)].map((element) => element.getAttribute('data-commerce-part'));

describe('Commerce data marker', () => {
  it('marks the catalog cards but not the host heading or the wrapper', async () => {
    mockStore();
    const { container } = mount(
      <CatalogRoot>
        <CatalogHeader title='Our shop' description='Hand-made goods.' />
        <CatalogProducts />
      </CatalogRoot>,
    );
    const [card] = await screen.findAllByRole('article');
    expect(markedParts(card)).toEqual(['product-card-image', 'product-card-title', 'product-card-price']);
    expect(screen.getByText('Our shop').closest(marked)).toBeNull();
    expect(screen.getByText('Hand-made goods.').closest(marked)).toBeNull();
    expect(container.querySelector('.commerce-storefront')).not.toHaveAttribute(COMMERCE_DATA_ATTRIBUTE);
  });

  it('marks a standalone product card', async () => {
    mockStore();
    mount(<ProductCard product={mug} />);
    const card = await screen.findByRole('article');
    await waitFor(() => expect(context.connection).toBe('ready'));
    expect(
      within(card).getByRole('heading', { name: 'Mug' }).closest('[data-commerce-part]'),
    ).toHaveAttribute(COMMERCE_DATA_ATTRIBUTE, 'commerce');
    expect(markedParts(card)).toContain('product-card-price');
  });

  it('marks product details and related products, but not the back link', async () => {
    mockStore();
    const { container } = mount(
      <>
        <ProductDetails />
        <RelatedProducts productId='mug' title='You may also like' />
      </>,
      {},
      '/products/mug',
    );
    await screen.findByRole('heading', { level: 1, name: 'Mug' });
    const details = container.querySelector('[data-commerce-part="product-details-root"]') as HTMLElement;
    expect(markedParts(details)).toEqual([
      'product-details-gallery',
      'product-details-title',
      'product-details-price',
      'product-details-description',
    ]);
    expect(screen.getByRole('link', { name: /Back to shop/ }).closest(marked)).toBeNull();
    const related = await screen.findByRole('region', { name: 'You may also like' });
    expect(within(related).getByRole('heading', { name: 'Cup' }).closest(marked)).not.toBeNull();
    expect(within(related).getByRole('heading', { name: 'You may also like' }).closest(marked)).toBeNull();
  });

  it('marks cart lines and totals on a cart page and in a composed drawer, but not host titles', async () => {
    mockStore();
    const parts = (
      <>
        <CartTitle>My bag</CartTitle>
        <CartItems>
          <CartItemRoot>
            <CartItemName />
            <CartItemPrice />
          </CartItemRoot>
        </CartItems>
        <CartSubtotal />
      </>
    );
    const { container } = mount(
      <>
        <CartRoot>{parts}</CartRoot>
        <CartDrawerRoot>{parts}</CartDrawerRoot>
      </>,
    );
    const page = (await waitFor(() => {
      const root = container.querySelector('[data-commerce-part="cart-root"]');
      expect(root?.querySelector(marked)).toBeTruthy();
      return root;
    })) as HTMLElement;
    expect(markedParts(page)).toEqual(['cart-item-name', 'cart-item-price', 'cart-subtotal']);
    expect(within(page).getByText('My bag').closest(marked)).toBeNull();
    act(() => context.setOpen(true));
    const dialog = await screen.findByRole('dialog');
    // The drawer portals into `document.body`, so each part carries its own marker.
    expect(markedParts(dialog)).toEqual(['cart-item-name', 'cart-item-price', 'cart-subtotal']);
    expect(within(dialog).getByText('My bag').closest(marked)).toBeNull();
  });

  it('marks the cart button count but not a host label', async () => {
    mockStore();
    mount(
      <>
        <CartButton />
        <CartButton>{({ itemCount }) => `Bag (${itemCount})`}</CartButton>
      </>,
    );
    const [icon, labeled] = await screen.findAllByRole('button');
    await waitFor(() => expect(icon.querySelector(marked)).toHaveTextContent('2'));
    expect(labeled).toHaveTextContent('Bag (2)');
    expect(labeled.closest(marked)).toBeNull();
    expect(labeled.querySelector(marked)).toBeNull();
  });

  it('leaves samples and the connection status unmarked', async () => {
    mockStore('unbound');
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/shop']}>
          <CommerceStorefront>
            <Observe />
            <CartButton />
            <Catalog sampleProducts />
            <CartRoot>
              <CartTitle />
            </CartRoot>
          </CommerceStorefront>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findAllByRole('article')).not.toHaveLength(0);
    await act(async () => {
      await screen.getAllByRole('button', { name: /^Add/ })[0].click();
    });
    expect(await screen.findByRole('dialog')).toBeVisible();
    expect(document.querySelector(marked)).toBeNull();
    expect(container.querySelector(marked)).toBeNull();
  });

  it('leaves the connecting status unmarked', async () => {
    mockStore('connecting');
    mount(<Catalog />);
    expect(await screen.findByText('Connecting to the store…')).toBeVisible();
    expect(document.querySelector(marked)).toBeNull();
  });

  it('marks nothing when the provider turns the marker off, including custom parts', async () => {
    mockStore();
    function Custom(): ReactElement {
      return <p {...useCommerceData()}>Custom store data</p>;
    }
    mount(
      <>
        <Custom />
        <Catalog />
      </>,
      { markCommerceData: false },
    );
    expect(await screen.findAllByRole('article')).toHaveLength(2);
    expect(document.querySelector(marked)).toBeNull();
  });

  it('lets a custom part mark itself', async () => {
    mockStore();
    function Custom(): ReactElement {
      return <p {...useCommerceData()}>Custom store data</p>;
    }
    mount(<Custom />);
    expect(screen.getByText('Custom store data')).toHaveAttribute(COMMERCE_DATA_ATTRIBUTE, 'commerce');
  });
});
