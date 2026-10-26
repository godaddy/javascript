import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Component, type ErrorInfo, type ReactElement, type ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { CatalogHeader, CatalogPagination, CatalogProducts, CatalogRoot, CatalogSummary } from './catalog';
import type { SKUGroup } from './catalog-model';
import { CommerceStorefront } from './commerce-storefront';
import {
  ProductCard,
  ProductCardAction,
  ProductCardDescription,
  ProductCardImage,
  ProductCardPrice,
  ProductCardRoot,
  ProductCardTitle,
  useProductCard,
} from './product-card';
import { packageRuleConflicts } from './test-css';

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const mug: SKUGroup = {
  id: 'mug',
  label: 'Mug',
  description: 'A ceramic mug.',
  priceRange: { min: 1200, max: 1200 },
  skus: {
    totalCount: 1,
    edges: [
      { node: { id: 'sku-mug', inventoryCounts: { edges: [{ node: { type: 'AVAILABLE', quantity: 5 } }] } } },
    ],
  },
};
const shirt: SKUGroup = {
  id: 'shirt',
  label: 'Shirt',
  priceRange: { min: 2000, max: 2500 },
  attributes: {
    edges: [
      {
        node: {
          name: 'size',
          label: 'Size',
          values: { edges: [{ node: { id: 's', name: 's', label: 'S' } }] },
        },
      },
    ],
  },
  skus: { totalCount: 2, edges: [] },
};

function mockApi({
  config = { cartScope: 's', currencyCode: 'USD' },
  products = () =>
    response({
      skuGroups: {
        edges: [mug, shirt].map((node) => ({ node })),
        pageInfo: { hasNextPage: true, endCursor: 'c2' },
      },
    }),
}: {
  config?: unknown;
  products?: (url: URL) => Response;
} = {}) {
  const fn = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'https://host.test');
    if (url.pathname.endsWith('/config')) return Promise.resolve(response(config));
    if (init?.method === 'POST')
      return Promise.resolve(response({ cart: { id: 'cart-1', lineItems: [], totals: {} } }, 201));
    return Promise.resolve(products(url));
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

function app(layout: ReactNode): ReactElement {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } })}>
      <MemoryRouter initialEntries={['/shop']}>
        <CommerceStorefront>{layout}</CommerceStorefront>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function mount(layout: ReactNode) {
  return render(app(layout));
}

function Badge(): ReactElement {
  const { name, href, isSample } = useProductCard();
  return <output data-testid='badge'>{`${name}:${href ?? 'none'}:${isSample}`}</output>;
}

describe('composable catalog', () => {
  it('renders a custom catalog and card layout, places cards with host classes, and purchases', async () => {
    const api = mockApi();
    mount(
      <CatalogRoot className='host-root'>
        <CatalogProducts className='host-grid'>
          <ProductCardRoot className='host-card'>
            <ProductCardTitle />
            <Badge />
            <ProductCardPrice />
            <ProductCardAction />
          </ProductCardRoot>
        </CatalogProducts>
        <CatalogSummary />
        <CatalogPagination />
      </CatalogRoot>,
    );
    const title = await screen.findByRole('heading', { level: 2, name: 'Mug' });
    const card = title.closest('article');
    expect(card).toHaveClass('host-card');
    // The card is the grid's own child, so placement classes such as col-span-2 reach the grid.
    expect(card?.parentElement).toHaveClass('host-grid');
    expect(card?.closest('section')).toHaveClass('host-root');
    expect(screen.getByText('Showing 2 products')).toHaveAttribute('role', 'status');
    expect(screen.getAllByTestId('badge').map((badge) => badge.textContent)).toEqual([
      'Mug:/products/mug:false',
      'Shirt:/products/shirt:false',
    ]);
    expect(screen.getByRole('link', { name: 'Choose options' })).toHaveAttribute('href', '/products/shirt');
    expect(screen.getByText('$20.00 – $25.00')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }));
    await waitFor(() => expect(api.mock.calls.some((call) => call[1]?.method === 'POST')).toBe(true));
    const post = api.mock.calls.find((call) => call[1]?.method === 'POST');
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({
      lineItems: [{ skuId: 'sku-mug', name: 'Mug', quantity: 1 }],
    });
    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await waitFor(() =>
      expect(api.mock.calls.some(([input]) => String(input).includes('after=c2'))).toBe(true),
    );
  });

  it('shows samples in a custom layout and adds them only to the sample cart', async () => {
    const api = mockApi({ config: { state: 'unbound' } });
    mount(
      <CatalogRoot sampleProducts>
        <CatalogHeader title='Sample shop' />
        <CatalogProducts>
          <ProductCardRoot>
            <ProductCardImage />
            <ProductCardTitle />
            <ProductCardDescription />
            <Badge />
            <ProductCardAction />
          </ProductCardRoot>
        </CatalogProducts>
        <CatalogPagination />
      </CatalogRoot>,
    );
    await screen.findByRole('heading', { level: 2, name: 'Product 6' });
    expect(screen.getByRole('heading', { level: 1, name: 'Sample shop' }).closest('section')).toHaveAttribute(
      'data-commerce-source',
      'sample',
    );
    expect(screen.getAllByRole('article')).toHaveLength(6);
    expect(screen.getAllByTestId('badge')[0]).toHaveTextContent('Product 1:none:true');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add Product 3 to sample cart' }));
    const drawer = await screen.findByRole('dialog', { name: /^Sample cart/ });
    expect(within(drawer).getByRole('heading', { name: 'Product 3' })).toBeInTheDocument();
    expect(api.mock.calls.every(([input]) => String(input).endsWith('/config'))).toBe(true);
  });

  it('shows the error and retry before a custom grid, then the products', async () => {
    let fail = true;
    mockApi({
      products: () =>
        fail
          ? response({ error: 'Catalog is down.' }, 503)
          : response({ skuGroups: { edges: [{ node: mug }], pageInfo: { hasNextPage: false } } }),
    });
    mount(
      <CatalogRoot>
        <CatalogProducts className='host-grid' />
      </CatalogRoot>,
    );
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Catalog is down.');
    expect(alert.nextElementSibling).toHaveClass('host-grid');
    fail = false;
    await userEvent.click(within(alert).getByRole('button', { name: 'Retry products' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Mug' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('gives a card nested in a catalog card its own product', async () => {
    mockApi();
    mount(
      <CatalogRoot>
        <CatalogProducts>
          <ProductCardRoot>
            <ProductCardTitle />
            <ProductCardRoot product={{ ...shirt, id: 'related', label: 'Related' }}>
              <Badge />
            </ProductCardRoot>
          </ProductCardRoot>
        </CatalogProducts>
      </CatalogRoot>,
    );
    await screen.findByRole('heading', { level: 2, name: 'Mug' });
    expect(screen.getAllByTestId('badge').map((badge) => badge.textContent)).toEqual([
      'Related:/products/related:false',
      'Related:/products/related:false',
    ]);
  });

  it('keeps one accessible product link whether or not the card has a title', async () => {
    mockApi();
    const { unmount } = mount(
      <CatalogRoot>
        <CatalogProducts>
          <ProductCardRoot>
            <ProductCardImage />
            <ProductCardPrice />
            <ProductCardAction />
          </ProductCardRoot>
        </CatalogProducts>
      </CatalogRoot>,
    );
    // Without a title, the image is the product link.
    const imageLink = await screen.findByRole('link', { name: 'Mug: image unavailable' });
    expect(imageLink).toHaveAttribute('href', '/products/mug');
    expect(imageLink).not.toHaveAttribute('tabindex');
    unmount();
    mount(
      <CatalogRoot>
        <CatalogProducts>
          <ProductCardRoot>
            <ProductCardImage />
            <ProductCardTitle />
          </ProductCardRoot>
        </CatalogProducts>
      </CatalogRoot>,
    );
    // With a title, the title is the only link assistive technology and the keyboard reach.
    await screen.findByRole('link', { name: 'Mug' });
    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual(['Mug', 'Shirt']);
    const hidden = document.querySelector('a[aria-hidden="true"][href="/products/mug"]');
    expect(hidden).toHaveAttribute('tabindex', '-1');
  });

  it('hides the image link in server HTML when the card has a title', () => {
    mockApi();
    const html = renderToString(app(<ProductCard product={mug} />));
    const card = document.createElement('div');
    card.innerHTML = html;
    const links = [...card.querySelectorAll('a[href="/products/mug"]')];
    expect(links.map((link) => [link.getAttribute('tabindex'), link.getAttribute('aria-hidden')])).toEqual([
      ['-1', 'true'],
      [null, null],
    ]);
  });

  it('falls back to the packaged card when the card template is false or empty', async () => {
    mockApi();
    const custom = false;
    mount(
      <CatalogRoot>
        <CatalogProducts>
          {custom && (
            <ProductCardRoot>
              <ProductCardTitle />
            </ProductCardRoot>
          )}
        </CatalogProducts>
      </CatalogRoot>,
    );
    expect(await screen.findByRole('heading', { level: 2, name: 'Mug' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });

  it('keeps host classes on the connection status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => {})),
    );
    mount(
      <CatalogRoot className='host-root'>
        <CatalogProducts />
      </CatalogRoot>,
    );
    expect(screen.getByText('Connecting to the store…').closest('.host-root')).not.toBeNull();
  });

  it('names the missing root or product when parts are misplaced', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ProductCardTitle />)).toThrow(
      'ProductCardTitle must be rendered inside <ProductCardRoot>.',
    );
    function Orphan(): null {
      useProductCard();
      return null;
    }
    expect(() => render(<Orphan />)).toThrow('useProductCard must be rendered inside <ProductCardRoot>.');
    expect(() => render(<CatalogSummary />)).toThrow('CatalogSummary must be rendered inside <CatalogRoot>.');
    mockApi();
    expect(() =>
      mount(
        <ProductCardRoot>
          <ProductCardTitle />
        </ProductCardRoot>,
      ),
    ).toThrow('ProductCardRoot needs a product prop outside <CatalogProducts>.');
    const errors: unknown[] = [];
    mount(
      <CatalogRoot>
        <CatalogProducts>
          <Boundary errors={errors}>
            <ProductCardRoot product={mug}>
              <ProductCardTitle />
            </ProductCardRoot>
          </Boundary>
        </CatalogProducts>
      </CatalogRoot>,
    );
    await waitFor(() => expect(errors).toHaveLength(2));
    expect(String(errors[0])).toContain(
      'Inside <CatalogProducts>, ProductCardRoot shows each catalog product. Remove its product prop.',
    );
  });

  it('puts host classes on an element that no package rule styles', async () => {
    const conflicts = packageRuleConflicts();
    const layout = (
      <CatalogRoot className='host' sampleProducts>
        <CatalogHeader className='host' />
        <CatalogSummary className='host' />
        <CatalogProducts className='host'>
          <ProductCardRoot className='host'>
            <ProductCardImage className='host' />
            <ProductCardTitle className='host' />
            <ProductCardDescription className='host' />
            <ProductCardPrice className='host' />
            <ProductCardAction className='host' />
          </ProductCardRoot>
        </CatalogProducts>
        <CatalogPagination className='host' />
      </CatalogRoot>
    );
    const expectNoConflicts = (): void => {
      for (const host of document.querySelectorAll('.host')) {
        const part = host.localName + [...host.classList].filter((name) => name !== 'host').join('.');
        expect({ part, conflicts: conflicts(host) }).toEqual({ part, conflicts: [] });
      }
    };
    mockApi();
    const live = mount(layout);
    await screen.findByRole('heading', { level: 2, name: 'Mug' });
    // Root, header, summary, grid and pagination; card root and parts: six for the mug, five for the shirt (no description).
    expect(document.querySelectorAll('.host')).toHaveLength(5 + 6 + 5);
    expectNoConflicts();
    live.unmount();
    mockApi({ config: { state: 'unbound' } });
    mount(layout);
    await screen.findByRole('heading', { level: 2, name: 'Product 6' });
    expectNoConflicts();
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
