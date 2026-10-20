import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { SKU, SKUGroup } from './catalog-model';
import { CommerceStorefront } from './commerce-storefront';
import {
  ProductDetailsBackLink,
  ProductDetailsDescription,
  ProductDetailsGallery,
  ProductDetailsPrice,
  ProductDetailsTitle,
} from './product-details';
import { ProductDetailsRoot, useProductDetails, useProductDetailsOption } from './product-details-context';
import {
  ProductDetailsAddToCart,
  ProductDetailsAvailability,
  ProductDetailsOption,
  ProductDetailsOptions,
  ProductDetailsPurchase,
  ProductDetailsPurchaseStatus,
  ProductDetailsQuantity,
} from './product-purchase';
import { packageRuleConflicts } from './test-css';

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
const poster: SKUGroup = {
  id: 'poster',
  label: 'Poster',
  skus: {
    totalCount: 2,
    edges: ['small', 'large'].map((size) => ({ node: { ...sku(`poster-${size}`, 3), label: size } })),
  },
};

function mockApi(group: SKUGroup = shirt) {
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
          ? { ...group, skus: { totalCount: 1, edges: [{ node: sku(`sku-${selected.join('-')}`, 5) }] } }
          : group,
      }),
    );
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

function mount(layout: ReactNode, path = '/products/shirt') {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } })}>
      <MemoryRouter initialEntries={[path]}>
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
  const option = useProductDetailsOption(attribute);
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
        <ProductDetailsOption attribute='size' />
        <SelectedSku />
        <ProductDetailsQuantity />
        <ProductDetailsAddToCart />
      </ProductDetailsRoot>,
    );
    const title = await screen.findByRole('heading', { level: 1, name: 'Shirt' });
    expect(title.parentElement).toHaveClass('host-title');
    expect(title.closest('article')).toHaveClass('host-article');
    // Enabled before every option is chosen, and named for the first missing one.
    const add = screen.getByRole('button', { name: 'Select color' });
    expect(add).toBeEnabled();

    await userEvent.click(screen.getByRole('button', { name: 'Invalid' }));
    expect(screen.getByTestId('selected')).toHaveTextContent('incomplete:none');
    await userEvent.click(screen.getByRole('button', { name: 'BLUE' }));
    expect(screen.getByRole('button', { name: 'BLUE' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('selected')).toHaveTextContent('incomplete:none');

    // Pressing it marks the missing option and focuses its first choice.
    await userEvent.click(screen.getByRole('button', { name: 'Select size' }));
    expect(screen.getByText('Select size.')).toBeVisible();
    expect(screen.getByRole('group', { name: 'Size' })).toHaveAccessibleDescription('Select size.');
    await waitFor(() => expect(screen.getByRole('radio', { name: 'S' })).toHaveFocus());

    await userEvent.click(screen.getByRole('radio', { name: 'M' }));
    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('ready:sku-blue-m'));
    expect(screen.queryByText('Select size.')).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Size M' })).toBeInTheDocument();
    await userEvent.clear(screen.getByRole('spinbutton', { name: 'Quantity' }));
    await userEvent.type(screen.getByRole('spinbutton', { name: 'Quantity' }), '2');
    await userEvent.click(screen.getByRole('button', { name: 'Add to cart, $24.00' }));
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
        <ProductDetailsOption attribute='size' />
        <ProductDetailsQuantity />
        <ProductDetailsPurchaseStatus />
      </ProductDetailsRoot>,
    );
    await userEvent.click(await screen.findByRole('button', { name: 'BLUE' }));
    await userEvent.click(screen.getByRole('radio', { name: 'S' }));
    const quantity = await screen.findByRole('spinbutton', { name: 'Quantity' });
    await userEvent.clear(quantity);
    await userEvent.type(quantity, '4');
    await userEvent.click(screen.getByRole('button', { name: 'RED' }));
    expect(await screen.findByRole('spinbutton', { name: 'Quantity' })).toHaveValue(1);
  });

  it('explains a quantity that cannot be added, next to the field and on the button', async () => {
    mockApi(poster);
    mount(
      <ProductDetailsRoot>
        <ProductDetailsPurchase />
      </ProductDetailsRoot>,
      '/products/poster',
    );
    await userEvent.click(await screen.findByRole('radio', { name: 'small' }));
    const quantity = await screen.findByRole('spinbutton', { name: 'Quantity' });
    const add = await screen.findByRole('button', { name: /^Add to cart/ });
    await waitFor(() => expect(add).toBeEnabled());
    expect(quantity).not.toHaveAttribute('aria-invalid');
    await userEvent.clear(quantity);
    await userEvent.type(quantity, '4');
    expect(quantity).toHaveAttribute('aria-invalid', 'true');
    expect(quantity).toHaveAccessibleDescription('Only 3 available.');
    expect(screen.getByText('Only 3 available.', { selector: 'p' })).toBeVisible();
    expect(add).toBeDisabled();
    expect(add).toHaveAccessibleDescription('Only 3 available.');
    await userEvent.clear(quantity);
    expect(quantity).toHaveAccessibleDescription('Enter a whole number of 1 or more.');
    await userEvent.type(quantity, '2');
    expect(quantity).not.toHaveAttribute('aria-describedby');
    expect(add).toBeEnabled();
  });

  it('warns when a layout leaves out an option the product needs', async () => {
    mockApi();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mount(
      <ProductDetailsRoot>
        <ProductDetailsOption attribute='color' />
        <ProductDetailsAddToCart />
      </ProductDetailsRoot>,
    );
    await screen.findByRole('radio', { name: 'BLUE' });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('No control for "size" is rendered right now'));
    expect(warn.mock.calls.join('')).not.toMatch(/never/);
    expect(warn.mock.calls.join('')).not.toContain('"color"');
  });

  it('does not warn for the packaged purchase area', async () => {
    mockApi();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mount(
      <ProductDetailsRoot>
        <ProductDetailsPurchase />
      </ProductDetailsRoot>,
    );
    await screen.findByRole('radio', { name: 'M' });
    expect(warn).not.toHaveBeenCalled();
  });

  it('names the missing root when a part is rendered outside ProductDetailsRoot', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ProductDetailsAddToCart />)).toThrow(
      'ProductDetailsAddToCart must be rendered inside <ProductDetailsRoot>.',
    );
    function Orphan(): null {
      useProductDetailsOption('color');
      return null;
    }
    expect(() => render(<Orphan />)).toThrow(
      'useProductDetailsOption must be rendered inside <ProductDetailsRoot>.',
    );
  });
  it('keeps IDs unique and labels attached when purchase parts render twice', async () => {
    mockApi();
    const ids = (): string[] => [...document.querySelectorAll('[id]')].map((element) => element.id);
    const unique = (): void => expect(new Set(ids()).size).toBe(ids().length);
    mount(
      <ProductDetailsRoot>
        <ProductDetailsPurchase />
        <div data-testid='sticky'>
          <ProductDetailsQuantity />
          <ProductDetailsAddToCart />
        </div>
      </ProductDetailsRoot>,
    );
    const [, second] = await screen.findAllByRole('button', { name: 'Select color' });
    unique();
    // Either add button marks the missing options once, in the one set of controls.
    await userEvent.click(second as HTMLElement);
    expect(screen.getAllByText('Select color.')).toHaveLength(1);
    unique();
    await userEvent.click(screen.getByRole('radio', { name: 'BLUE' }));
    await userEvent.click(screen.getByRole('radio', { name: 'M' }));
    await screen.findAllByRole('button', { name: 'Add to cart, $12.00' });
    expect(screen.getAllByRole('spinbutton', { name: 'Quantity' })).toHaveLength(2);
    unique();
  });

  it('keeps the SKU list ID unique when the options render twice', async () => {
    mockApi(poster);
    mount(
      <ProductDetailsRoot>
        <ProductDetailsOptions />
        <ProductDetailsOptions />
      </ProductDetailsRoot>,
      '/products/poster',
    );
    // Two separate radio groups: a shared name would make them one group.
    const choices = (await screen.findAllByRole('radio', { name: 'small' })) as HTMLInputElement[];
    expect(choices).toHaveLength(2);
    expect(choices[0]?.name).not.toBe(choices[1]?.name);
    await userEvent.click(choices[1] as HTMLInputElement);
    for (const choice of choices) expect(choice).toBeChecked();
  });

  it('puts host classes on an element that no package rule styles', async () => {
    mockApi();
    const conflicts = packageRuleConflicts();
    const parts: Array<[string, ReactElement]> = [
      ['BackLink', <ProductDetailsBackLink key='a' className='host' />],
      ['Gallery', <ProductDetailsGallery key='b' className='host' />],
      ['Title', <ProductDetailsTitle key='c' className='host' />],
      ['Price', <ProductDetailsPrice key='d' className='host' />],
      ['Description', <ProductDetailsDescription key='e' className='host' />],
      ['Purchase', <ProductDetailsPurchase key='f' className='host' />],
      ['Options', <ProductDetailsOptions key='g' className='host' />],
      ['Option', <ProductDetailsOption key='h' attribute='size' className='host' />],
      ['PurchaseStatus', <ProductDetailsPurchaseStatus key='i' className='host' />],
      ['AddToCart', <ProductDetailsAddToCart key='j' className='host' />],
    ];
    mount(
      <ProductDetailsRoot className='host'>
        {parts.map(([name, part]) => (
          <section key={name} data-part={name}>
            {part}
          </section>
        ))}
        <section data-part='Ready'>
          <Swatches attribute='color' />
          <ProductDetailsAvailability className='host' />
          <ProductDetailsQuantity className='host' />
        </section>
      </ProductDetailsRoot>,
    );
    const expectNoConflicts = (count: number): void => {
      const hosts = [...document.querySelectorAll('.host')];
      expect(hosts).toHaveLength(count);
      for (const host of hosts) {
        const part = host.closest('[data-part]')?.getAttribute('data-part') ?? 'Root';
        expect({ part, conflicts: conflicts(host) }).toEqual({ part, conflicts: [] });
      }
    };
    await screen.findByRole('heading', { level: 1, name: 'Shirt' });
    // Every part plus the root and the quantity, but not the status message, which waits for a full selection.
    expectNoConflicts(parts.length + 1 - 1 + 1);
    await userEvent.click(screen.getByRole('button', { name: 'BLUE' }));
    await userEvent.click(screen.getAllByRole('radio', { name: 'M' })[0] as HTMLElement);
    await screen.findAllByText('5 available');
    // Availability appears.
    expectNoConflicts(parts.length + 1 - 1 + 2);
  });

  it('does not run the layout check in production builds', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    mockApi();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mount(
      <ProductDetailsRoot>
        <ProductDetailsOption attribute='color' />
      </ProductDetailsRoot>,
    );
    await screen.findByRole('radio', { name: 'BLUE' });
    expect(warn).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});
