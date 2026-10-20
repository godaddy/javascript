import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { Catalog } from './catalog';
import type { SKU, SKUGroup } from './catalog-model';
import type { CommerceProviderProps } from './commerce-provider';
import { CommerceStorefront } from './commerce-storefront';
import { ProductDetails } from './product-details';
import { RelatedProducts } from './related-products';

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const values = (names: string[]) => ({
  edges: names.map((name) => ({
    node: { id: `id-${name}`, name, label: name[0]?.toUpperCase() + name.slice(1) },
  })),
});
const sku = (id: string, names: string[], quantity: number, price = 2500, compareAt?: number): SKU => ({
  id,
  attributeValues: { edges: names.map((name) => ({ node: { name } })) },
  prices: {
    edges: [
      {
        node: {
          value: { value: price, currencyCode: 'USD' },
          compareAtValue: compareAt ? { value: compareAt, currencyCode: 'USD' } : null,
        },
      },
    ],
  },
  inventoryCounts: { edges: [{ node: { type: 'AVAILABLE', quantity } }] },
});
// Red is sold out only in size M; green in every size.
const skus: SKU[] = [
  sku('blue-s', ['blue', 's'], 4),
  sku('blue-m', ['blue', 'm'], 4),
  sku('red-s', ['red', 's'], 2),
  sku('red-m', ['red', 'm'], 0),
  sku('green-s', ['green', 's'], 0),
  sku('green-m', ['green', 'm'], 0),
];
const shirt: SKUGroup = {
  id: 'shirt',
  label: 'Shirt',
  priceRange: { min: 2500, max: 2500 },
  compareAtPriceRange: { min: 3000, max: 3000 },
  attributes: {
    edges: [
      { node: { name: 'color', label: 'Color', values: values(['blue', 'red', 'green']) } },
      { node: { name: 'size', label: 'Size', values: values(['s', 'm']) } },
    ],
  },
  skus: { totalCount: skus.length, pageInfo: { hasNextPage: false }, edges: skus.map((node) => ({ node })) },
};
const shoe: SKUGroup = {
  id: 'shoe',
  label: 'Shoe',
  priceRange: { min: 9000, max: 9000 },
  attributes: {
    edges: [
      {
        node: {
          name: 'size',
          label: 'US Size',
          values: values(['6', '7', '8', '9', '10', '11', '12', '13', '14']),
        },
      },
    ],
  },
  skus: { totalCount: 9, edges: [] },
};
const card = (id: string, label: string, extra: Partial<SKUGroup> = {}): SKUGroup => ({
  id,
  label,
  priceRange: { min: 1000, max: 1000 },
  skus: { totalCount: 1, edges: [{ node: { id: `${id}-sku`, inventoryCounts: { edges: [] } } }] },
  ...extra,
});
const catalog: SKUGroup[] = [
  card('mug', 'Mug'),
  shirt,
  card('cap', 'Cap'),
  card('bag', 'Bag'),
  card('pen', 'Pen'),
  card('cup', 'Cup'),
];

function mockApi() {
  const fn = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input), 'https://host.test');
    if (url.pathname.endsWith('/config')) return response({ cartScope: 's', currencyCode: 'USD' });
    if (url.pathname.endsWith('/products')) {
      const first = Number(url.searchParams.get('first'));
      return response({
        skuGroups: {
          edges: catalog.slice(0, first).map((node) => ({ node })),
          pageInfo: { hasNextPage: first < catalog.length, endCursor: 'next' },
        },
      });
    }
    const id = url.pathname.split('/').at(-1);
    const group = [shirt, shoe].find((product) => product.id === id);
    if (!group) return response({ error: 'Product not found' }, 404);
    const selected = url.searchParams.getAll('attributeValues');
    if (!selected.length) return response({ skuGroup: group });
    const matches = (group.skus?.edges ?? []).filter((edge) =>
      selected.every((name) =>
        edge?.node?.attributeValues?.edges?.some((value) => value?.node?.name === name),
      ),
    );
    return response({ skuGroup: { ...group, skus: { totalCount: matches.length, edges: matches } } });
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

function mount(children: ReactNode, path: string, props: Partial<CommerceProviderProps> = {}): void {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } })}>
      <MemoryRouter initialEntries={[path]}>
        <CommerceStorefront {...props}>
          <Routes>
            <Route path='/shop' element={children} />
            <Route path='/products/:productId' element={children} />
          </Routes>
        </CommerceStorefront>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const colors: Record<string, string> = { blue: '#1d4ed8', red: '#b91c1c', green: '#15803d' };
const getSwatch: CommerceProviderProps['getSwatch'] = ({ attribute, name }) =>
  attribute === 'color' ? colors[name] : undefined;

function ProductPage(): ReactElement {
  return (
    <>
      <ProductDetails />
      <RelatedProducts limit={3} />
    </>
  );
}

const soldOut = (label: string): string => `${label}, sold out`;

describe('default product page', () => {
  it('crosses out values sold out with the other selections, but keeps them selectable', async () => {
    mockApi();
    mount(<ProductDetails />, '/products/shirt');
    const green = await screen.findByRole('radio', { name: soldOut('Green') });
    expect(screen.getByRole('radio', { name: 'Red' })).toBeEnabled();
    await userEvent.click(screen.getByRole('radio', { name: 'M' }));
    expect(await screen.findByRole('radio', { name: soldOut('Red') })).toBeEnabled();
    await userEvent.click(screen.getByRole('radio', { name: soldOut('Red') }));
    expect(await screen.findByRole('button', { name: 'Out of stock' })).toBeDisabled();
    // With red chosen, M is the sold-out size.
    expect(screen.getByRole('radio', { name: soldOut('M') })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'S' })).toBeEnabled();
    expect(green).toBeInTheDocument();
  });

  it('marks nothing sold out when the SKU list is incomplete', async () => {
    mockApi();
    const truncated = { ...shirt, skus: { ...shirt.skus, pageInfo: { hasNextPage: true } } };
    vi.mocked(fetch).mockImplementation(async (input) =>
      String(input).endsWith('/config')
        ? response({ cartScope: 's', currencyCode: 'USD' })
        : response({ skuGroup: truncated }),
    );
    mount(<ProductDetails />, '/products/shirt');
    expect(await screen.findByRole('radio', { name: 'Green' })).toBeInTheDocument();
  });

  it('shows the sale badge and starting compare-at price, then the SKU price on the add button', async () => {
    mockApi();
    mount(<ProductDetails />, '/products/shirt');
    const price = await screen.findByTestId('product-price');
    expect(price).toHaveTextContent('From $25.00Was$30.00');
    expect(within(price).getByText('$30.00').tagName).toBe('DEL');
    expect(screen.getByText('Sale')).toBeVisible();
    await userEvent.click(screen.getByRole('radio', { name: 'Blue' }));
    await userEvent.click(screen.getByRole('radio', { name: 'S' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Increase quantity of Shirt' }));
    expect(await screen.findByRole('button', { name: 'Add to cart, $50.00' })).toBeEnabled();
    // Blue S has no compare-at price, so it is not on sale.
    expect(screen.queryByText('Sale')).not.toBeInTheDocument();
  });

  it('caps the stepper at the verified stock', async () => {
    mockApi();
    mount(<ProductDetails />, '/products/shirt?option.color=red&option.size=s');
    const increase = await screen.findByRole('button', { name: 'Increase quantity of Shirt' });
    await waitFor(() => expect(screen.getByText('2 available')).toBeVisible());
    await userEvent.click(increase);
    expect(screen.getByRole('spinbutton', { name: 'Quantity' })).toHaveValue(2);
    expect(increase).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Decrease quantity of Shirt' })).toBeEnabled();
  });

  it('renders swatches only for attributes the host gives a swatch for every value', async () => {
    mockApi();
    mount(<ProductDetails />, '/products/shirt', { getSwatch });
    const blue = await screen.findByRole('radio', { name: 'Blue' });
    expect(blue.nextElementSibling).toHaveStyle({ background: '#1d4ed8' });
    expect(screen.getByRole('radio', { name: 'S' }).nextElementSibling).toHaveTextContent('S');
  });

  it('uses a select for an option with more than eight values', async () => {
    mockApi();
    mount(<ProductDetails />, '/products/shoe');
    const select = await screen.findByRole('combobox', { name: 'US Size' });
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Select US Size' }));
    expect(select).toHaveFocus();
    expect(select).toHaveAccessibleDescription('Select US Size.');
  });
});

describe('RelatedProducts', () => {
  it('lists other catalog products, without the current one, up to the limit', async () => {
    mockApi();
    mount(<ProductPage />, '/products/shirt');
    const related = await screen.findByRole('region', { name: 'You may also like' });
    const titles = within(related)
      .getAllByRole('heading', { level: 2 })
      .slice(1)
      .map((heading) => heading.textContent);
    expect(titles).toEqual(['Mug', 'Cap', 'Bag']);
  });

  it('renders nothing while no store is connected', async () => {
    const fn = mockApi();
    fn.mockImplementation(async () => response({ state: 'unbound' }));
    mount(<ProductPage />, '/products/shirt');
    expect(await screen.findByText('Connect a store to show products.')).toBeVisible();
    expect(screen.queryByRole('region', { name: 'You may also like' })).not.toBeInTheDocument();
  });
});

describe('default catalog', () => {
  it('badges sale products, shows swatch dots, and hides pagination on a single page', async () => {
    mockApi();
    mount(<Catalog pageSize={24} />, '/shop', { getSwatch });
    const shirtCard = (await screen.findByRole('heading', { level: 2, name: 'Shirt' })).closest('article');
    expect(within(shirtCard as HTMLElement).getByText('Sale')).toBeVisible();
    expect(within(shirtCard as HTMLElement).getByText('$30.00').tagName).toBe('DEL');
    expect(
      within(shirtCard as HTMLElement).getByText('3 color options: Blue, Red, Green'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Sale')).toHaveLength(1);
    expect(screen.queryByRole('navigation', { name: 'Product pages' })).not.toBeInTheDocument();
  });
});
