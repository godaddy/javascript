import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { SKU, SKUGroup } from './catalog-model';
import { CommerceStorefront } from './commerce-storefront';
import { ProductDetailsTitle } from './product-details';
import { ProductDetailsRoot, useProductDetails, useProductOption } from './product-details-context';
import {
  ProductAddToCart,
  ProductOption,
  ProductPurchase,
  ProductPurchaseStatus,
  ProductQuantity,
} from './product-purchase';

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const sku = (id: string, quantity: number): SKU => ({
  id,
  prices: { edges: [{ node: { value: { value: 1200, currencyCode: 'USD' } } }] },
  inventoryCounts: { edges: [{ node: { type: 'AVAILABLE', quantity } }] },
});
const shirt: SKUGroup = {
  id: 'shirt',
  label: 'Shirt',
  attributes: {
    edges: ['color', 'size'].map((name) => ({
      node: {
        name,
        label: name === 'color' ? 'Color' : 'Size',
        values: {
          edges: (name === 'color' ? ['blue', 'red'] : ['s', 'm']).map((value) => ({
            node: { id: value, name: value, label: value.toUpperCase() },
          })),
        },
      },
    })),
  },
  skus: { totalCount: 4, edges: [] },
};

function mockApi() {
  const fn = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'https://host.test');
    if (url.pathname.endsWith('/config'))
      return Promise.resolve(response({ cartScope: 's', currencyCode: 'USD' }));
    if (init?.method === 'POST')
      return Promise.resolve(response({ cart: { id: 'cart-1', lineItems: [], totals: {} } }, 201));
    const selected = url.searchParams.getAll('attributeValues');
    return Promise.resolve(
      response({
        skuGroup: selected.length
          ? { ...shirt, skus: { totalCount: 1, edges: [{ node: sku(`sku-${selected.join('-')}`, 5) }] } }
          : shirt,
      }),
    );
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

function mount(layout: ReactNode) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } })}>
      <MemoryRouter initialEntries={['/products/shirt']}>
        <CommerceStorefront>
          <Routes>
            <Route path='/products/:productId' element={layout} />
          </Routes>
        </CommerceStorefront>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function Swatches({ attribute }: { attribute: string }): ReactElement | null {
  const option = useProductOption(attribute);
  if (!option) return null;
  return (
    <div role='group' aria-label={option.label}>
      {option.values.map((value) => (
        <button
          key={value.name}
          type='button'
          aria-pressed={value.selected}
          onClick={() => option.select(value.name)}
        >
          {value.label}
        </button>
      ))}
      <button type='button' onClick={() => option.select('not-a-real-value')}>
        Invalid
      </button>
    </div>
  );
}

function SelectedSku(): ReactElement {
  const { selectedSku, status } = useProductDetails();
  return <output data-testid='selected'>{`${status}:${selectedSku?.id ?? 'none'}`}</output>;
}

describe('composable product details', () => {
  it('purchases through a custom layout with swatches, reordered parts, and host classes', async () => {
    const api = mockApi();
    mount(
      <ProductDetailsRoot className='host-article'>
        <ProductDetailsTitle className='host-title' />
        <Swatches attribute='color' />
        <p>Size guide</p>
        <ProductOption attribute='size' />
        <SelectedSku />
        <ProductQuantity />
        <ProductAddToCart />
      </ProductDetailsRoot>,
    );
    const title = await screen.findByRole('heading', { level: 1, name: 'Shirt' });
    expect(title).toHaveClass('host-title');
    expect(title.closest('article')).toHaveClass('host-article');
    const add = screen.getByRole('button', { name: 'Add to cart' });
    expect(add).toBeDisabled();
    expect(add).toHaveAccessibleDescription('Select all options to add this item to your cart.');

    await userEvent.click(screen.getByRole('button', { name: 'Invalid' }));
    expect(screen.getByTestId('selected')).toHaveTextContent('incomplete:none');
    await userEvent.click(screen.getByRole('button', { name: 'BLUE' }));
    expect(screen.getByRole('button', { name: 'BLUE' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('selected')).toHaveTextContent('incomplete:none');

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Size' }), 'm');
    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('ready:sku-blue-m'));
    await userEvent.clear(screen.getByRole('spinbutton', { name: 'Quantity' }));
    await userEvent.type(screen.getByRole('spinbutton', { name: 'Quantity' }), '2');
    await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }));
    await waitFor(() => expect(api.mock.calls.some((call) => call[1]?.method === 'POST')).toBe(true));
    const post = api.mock.calls.find((call) => call[1]?.method === 'POST');
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({
      lineItems: [{ skuId: 'sku-blue-m', name: 'Shirt', quantity: 2 }],
    });
  });

  it('resets quantity when any control changes the selection', async () => {
    mockApi();
    mount(
      <ProductDetailsRoot>
        <Swatches attribute='color' />
        <ProductOption attribute='size' />
        <ProductQuantity />
        <ProductPurchaseStatus />
      </ProductDetailsRoot>,
    );
    await userEvent.click(await screen.findByRole('button', { name: 'BLUE' }));
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Size' }), 's');
    const quantity = await screen.findByRole('spinbutton', { name: 'Quantity' });
    await userEvent.clear(quantity);
    await userEvent.type(quantity, '4');
    await userEvent.click(screen.getByRole('button', { name: 'RED' }));
    expect(await screen.findByRole('spinbutton', { name: 'Quantity' })).toHaveValue(1);
  });

  it('warns when a layout leaves out an option the product needs', async () => {
    mockApi();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mount(
      <ProductDetailsRoot>
        <ProductOption attribute='color' />
        <ProductAddToCart />
      </ProductDetailsRoot>,
    );
    await screen.findByRole('combobox', { name: 'Color' });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('cannot select "size"'));
    expect(warn.mock.calls.join('')).not.toContain('"color"');
  });

  it('does not warn for the packaged purchase area', async () => {
    mockApi();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mount(
      <ProductDetailsRoot>
        <ProductPurchase />
      </ProductDetailsRoot>,
    );
    await screen.findByRole('combobox', { name: 'Size' });
    expect(warn).not.toHaveBeenCalled();
  });

  it('names the missing root when a part is rendered outside ProductDetailsRoot', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ProductAddToCart />)).toThrow(
      'ProductAddToCart must be rendered inside <ProductDetailsRoot>.',
    );
    function Orphan(): null {
      useProductOption('color');
      return null;
    }
    expect(() => render(<Orphan />)).toThrow(
      'useProductOption must be rendered inside <ProductDetailsRoot>.',
    );
  });
});
