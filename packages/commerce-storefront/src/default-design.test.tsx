import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { Catalog } from './catalog';
import { isProductOnSale, type SKU, type SKUGroup } from './catalog-model';
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
// Red is sold out only in size M; green in every size. Every SKU is $25, and only Blue S is not marked down from $30.
const skus: SKU[] = [
  sku('blue-s', ['blue', 's'], 4),
  sku('blue-m', ['blue', 'm'], 4, 2500, 3000),
  sku('red-s', ['red', 's'], 2, 2500, 3000),
  sku('red-m', ['red', 'm'], 0, 2500, 3000),
  sku('green-s', ['green', 's'], 0, 2500, 3000),
  sku('green-m', ['green', 'm'], 0, 2500, 3000),
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
  card('cap', 'Cap', { priceRange: { min: 1000, max: 2000 }, compareAtPriceRange: { min: 2400, max: 2400 } }),
  card('bag', 'Bag', { compareAtPriceRange: { min: 1400, max: 1400 } }),
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

  it('strikes through a starting compare-at price only when it belongs to the cheapest SKUs', async () => {
    mockApi();
    mount(<ProductDetails />, '/products/shirt');
    const price = await screen.findByTestId('product-price');
    // Blue S costs $25 but was never $30, so "From $25" has no compare-at price; the badge still says a SKU is on sale.
    expect(price).toHaveTextContent(/^From \$25\.00$/);
    expect(screen.getByText('Sale')).toBeVisible();
    await userEvent.click(screen.getByRole('radio', { name: 'Red' }));
    await userEvent.click(screen.getByRole('radio', { name: 'S' }));
    await waitFor(() => expect(price).toHaveTextContent('$25.00Was$30.00'));
    expect(within(price).getByText('$30.00').tagName).toBe('DEL');
    expect(screen.getByText('Sale')).toBeVisible();
  });

  it('labels the add button with the total, and drops the badge for a SKU that is not on sale', async () => {
    mockApi();
    mount(<ProductDetails />, '/products/shirt');
    await userEvent.click(await screen.findByRole('radio', { name: 'Blue' }));
    await userEvent.click(screen.getByRole('radio', { name: 'S' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Increase quantity of Shirt' }));
    expect(await screen.findByRole('button', { name: 'Add to cart, $50.00' })).toBeEnabled();
    expect(screen.queryByText('Sale')).not.toBeInTheDocument();
    expect(within(screen.getByTestId('product-price')).queryByRole('deletion')).not.toBeInTheDocument();
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
  it('badges sale products, strikes through only a compare-at price that belongs to the price, and shows swatch dots', async () => {
    mockApi();
    mount(<Catalog pageSize={24} />, '/shop', { getSwatch });
    const article = async (name: string) =>
      (await screen.findByRole('heading', { level: 2, name })).closest('article') as HTMLElement;
    // The bag has one price and one compare-at price.
    expect(within(await article('Bag')).getByText('Sale')).toBeVisible();
    expect(within(await article('Bag')).getByText('$14.00').tagName).toBe('DEL');
    // The cap's prices are a range, and the shirt's cheapest SKU was never $30, so they show only the badge.
    for (const name of ['Cap', 'Shirt']) {
      expect(within(await article(name)).getByText('Sale')).toBeVisible();
      expect(within(await article(name)).queryByRole('deletion')).not.toBeInTheDocument();
    }
    expect(within(await article('Shirt')).getByText('3 color options: Blue, Red, Green')).toBeInTheDocument();
    expect(screen.getAllByText('Sale')).toHaveLength(3);
    expect(screen.queryByRole('navigation', { name: 'Product pages' })).not.toBeInTheDocument();
  });
});

describe('isProductOnSale', () => {
  const priced = (prices: Array<[number, number?]>, complete = true): SKUGroup => ({
    priceRange: {
      min: Math.min(...prices.map(([price]) => price)),
      max: Math.max(...prices.map(([price]) => price)),
    },
    skus: {
      totalCount: prices.length,
      pageInfo: { hasNextPage: !complete },
      edges: prices.map(([price, compareAt], index) => ({
        node: sku(`sku-${index}`, [], 1, price, compareAt),
      })),
    },
  });

  it('pairs each SKU price with its own compare-at price', () => {
    // $10 without a compare-at price, and $20 "marked down" from $20: nothing is on sale.
    expect(
      isProductOnSale({ ...priced([[1000], [2000, 2000]]), compareAtPriceRange: { min: 2000, max: 2000 } }),
    ).toBe(false);
    // $10 at its compare-at price, and $20 marked down from $30: the $20 SKU is on sale.
    expect(
      isProductOnSale({
        ...priced([
          [1000, 1000],
          [2000, 3000],
        ]),
        compareAtPriceRange: { min: 1000, max: 3000 },
      }),
    ).toBe(true);
  });

  it('falls back to ranges, badging only a product whose every compare-at price is above every price', () => {
    const ranges = (price: [number, number], compareAt: [number, number]): SKUGroup => ({
      priceRange: { min: price[0], max: price[1] },
      compareAtPriceRange: { min: compareAt[0], max: compareAt[1] },
      skus: { totalCount: 2, edges: [] },
    });
    expect(isProductOnSale(ranges([2800, 2800], [3400, 3400]))).toBe(true);
    expect(isProductOnSale(ranges([13300, 13800], [14800, 15300]))).toBe(true);
    expect(isProductOnSale(ranges([1000, 2000], [2000, 2000]))).toBe(false);
    expect(isProductOnSale(ranges([1000, 2000], [1000, 3000]))).toBe(false);
    // A truncated SKU list falls back to the ranges too, which cannot show this one is on sale.
    expect(
      isProductOnSale({
        ...priced(
          [
            [1000, 1000],
            [2000, 3000],
          ],
          false,
        ),
        compareAtPriceRange: { min: 1000, max: 3000 },
      }),
    ).toBe(false);
  });
});
