import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactElement, type ReactNode, StrictMode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { ApiError, describeError, money, moneyRange } from './api';
import { CartButton } from './cart';
import { Catalog, CatalogHeader, CatalogRoot } from './catalog';
import type { SKU, SKUGroup } from './catalog-model';
import { type CommerceProviderProps, useMessage } from './commerce-provider';
import { CommerceStorefront } from './commerce-storefront';
import { frFR } from './locales/fr-fr';
import {
  enUS,
  formatMessage,
  StorefrontError,
  type StorefrontMessageKey,
  type StorefrontMessages,
} from './messages';
import { ProductDetails } from './product-details';
import { RelatedProducts } from './related-products';

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const sku = (id: string, quantity = 5): SKU => ({
  id,
  prices: { edges: [{ node: { value: { value: 1250, currencyCode: 'EUR' } } }] },
  inventoryCounts: { edges: [{ node: { type: 'AVAILABLE', quantity } }] },
});
const mug: SKUGroup = {
  id: 'mug',
  label: 'Tasse',
  priceRange: { min: 1250, max: 1250 },
  skus: { totalCount: 1, edges: [{ node: sku('sku-mug') }] },
};
const shirt: SKUGroup = {
  id: 'shirt',
  label: 'T-shirt',
  priceRange: { min: 2000, max: 2500 },
  attributes: {
    edges: [
      {
        node: {
          name: 'size',
          label: 'Taille',
          values: {
            edges: ['s', 'm'].map((name) => ({ node: { id: name, name, label: name.toUpperCase() } })),
          },
        },
      },
    ],
  },
  skus: { totalCount: 2, edges: [] },
};

function mockStore(state: 'ready' | 'unbound' = 'ready') {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const path = new URL(String(input), 'https://host.test').pathname.replace('/api/commerce', '');
      if (path === '/config')
        return response(state === 'ready' ? { cartScope: 's', currencyCode: 'EUR' } : { state });
      if (path === '/products')
        return response({ skuGroups: { edges: [mug, shirt].map((node) => ({ node })), pageInfo: {} } });
      if (path === '/products/missing')
        return response({ error: 'Product not found', code: 'not_found' }, 404);
      if (path === '/products/broken') return response({ error: 'Catalog offline', code: 'teapot' }, 500);
      if (path === '/products/upstream')
        return response({ error: 'Upstream failed', code: 'upstream_error' }, 502);
      if (path === '/products/mug') return response({ skuGroup: mug });
      if (path === '/products/shirt') return response({ skuGroup: shirt });
      return response({ cart: null });
    }),
  );
}

function mount(layout: ReactNode, props: Partial<CommerceProviderProps> = {}, path = '/shop') {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } })}>
      <MemoryRouter initialEntries={[path]}>
        <CommerceStorefront {...props}>
          <CartButton />
          <Routes>
            <Route path='/products/:productId' element={layout} />
            <Route path='*' element={layout} />
          </Routes>
        </CommerceStorefront>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const french = { locale: 'fr-FR', messages: frFR } as const;

describe('formatMessage', () => {
  it('fills placeholders and formats numbers for the messages locale', () => {
    expect(formatMessage(enUS, 'availableCount', { count: 1234 })).toBe('1,234 available');
    expect(formatMessage(frFR, 'availableCount', { count: 1234 })).toBe('1 234 disponibles');
    expect(formatMessage(enUS, 'decreaseQuantity', { name: 'Mug' })).toBe('Decrease quantity of Mug');
  });

  it('chooses plural forms with the locale rules', () => {
    // French counts 0 and 1 as singular; English counts only 1.
    expect(formatMessage(enUS, 'productCount', { count: 0 })).toBe('Showing 0 products');
    expect(formatMessage(frFR, 'productCount', { count: 0 })).toBe('0 produit affiché');
    expect(formatMessage(frFR, 'productCount', { count: 1 })).toBe('1 produit affiché');
    expect(formatMessage(frFR, 'productCount', { count: 2 })).toBe('2 produits affichés');
  });

  it('leaves unknown placeholders alone and survives an invalid locale', () => {
    expect(formatMessage(enUS, 'itemAdded', {})).toBe('{name} added to your cart.');
    expect(formatMessage({ ...enUS, locale: 'not a locale!' }, 'availableCount', { count: 2 })).toBe(
      '2 available',
    );
  });

  it('shows English for a malformed message instead of throwing', () => {
    // As if loaded from JSON: a plural with no `other`, and a number in place of text.
    const broken = {
      ...frFR,
      productCount: { one: '{count} produit' },
      sale: 1,
    } as unknown as StorefrontMessages;
    expect(formatMessage(broken, 'productCount', { count: 1 })).toBe('1 produit');
    expect(formatMessage(broken, 'productCount', { count: 3 })).toBe('Showing 3 products');
    expect(formatMessage(broken, 'sale')).toBe('Sale');
  });

  it('ships French for every English key', () => {
    const keys = Object.keys(enUS) as StorefrontMessageKey[];
    expect(Object.keys(frFR).sort()).toEqual(keys.sort());
    for (const key of keys) {
      if (key === 'skuOptionLabel') continue;
      expect.soft(frFR[key], key).not.toEqual(enUS[key]);
    }
  });
});

describe('describeError', () => {
  it('shows package errors in the messages language', () => {
    const error = new StorefrontError('checkoutEmpty');
    expect(error.message).toBe('Add an item before checking out.');
    expect(describeError(error, frFR)).toBe('Ajoutez un article avant de passer commande.');
  });

  it('shows English server text only to English, and translates known codes', () => {
    const coded = new ApiError('The connected store changed.', 409, { code: 'scope_mismatch' });
    const unknown = new ApiError('Catalog offline', 500, { code: 'teapot' });
    expect(describeError(coded, enUS)).toBe('The connected store changed.');
    expect(describeError(coded, frFR)).toBe(frFR.errorCodes.scope_mismatch);
    expect(describeError(unknown, frFR)).toBe(formatMessage(frFR, 'requestFailed'));
    expect(describeError(new Error('Boom'), frFR)).toBe(formatMessage(frFR, 'unknownError'));
    expect(describeError('nope', enUS)).toBe(formatMessage(enUS, 'unknownError'));
  });

  it('translates a code that came without server text', () => {
    const coded = new ApiError('Commerce request failed.', 409, {
      code: 'scope_mismatch',
      text: { key: 'requestFailed' },
    });
    expect(describeError(coded, frFR)).toBe(frFR.errorCodes.scope_mismatch);
  });

  it('ignores codes that name inherited properties', () => {
    const inherited = new ApiError('Upstream text', 500, { code: 'constructor' });
    expect(describeError(inherited, enUS)).toBe('Upstream text');
    expect(describeError(inherited, frFR)).toBe(formatMessage(frFR, 'requestFailed'));
  });

  it('handles messages with no errorCodes, such as from JSON', () => {
    const coded = new ApiError('Not found', 404, { code: 'not_found' });
    const partial = { ...frFR, errorCodes: undefined } as unknown as StorefrontMessages;
    expect(describeError(coded, partial)).toBe(formatMessage(frFR, 'requestFailed'));
  });

  it('lets a site translate a code in English too', () => {
    const coded = new ApiError('Not found', 404, { code: 'not_found' });
    expect(describeError(coded, { ...enUS, errorCodes: { not_found: 'Gone.' } })).toBe('Gone.');
  });
});

describe('moneyRange', () => {
  it('writes an equal range as one exact price', () => {
    expect(moneyRange(2000, 2000, 'USD')).toBe(money(2000, 'USD'));
    expect(moneyRange(2000, 2000, 'EUR', 'fr-FR')).toBe(money(2000, 'EUR', 'fr-FR'));
  });

  it('joins the two prices when formatRange throws', () => {
    const formatRange = vi.spyOn(Intl.NumberFormat.prototype, 'formatRange').mockImplementation(() => {
      throw new RangeError('start is greater than end');
    });
    try {
      expect(moneyRange(2500, 2000, 'USD')).toBe('$25.00 – $20.00');
    } finally {
      formatRange.mockRestore();
    }
  });
});

describe('messages prop', () => {
  it('renders the catalog and cart button in French with euro prices', async () => {
    mockStore();
    mount(<Catalog />, french);
    expect(await screen.findByRole('heading', { level: 1, name: 'Tous les produits' })).toBeVisible();
    expect(await screen.findByText('2 produits affichés')).toBeVisible();
    expect(screen.getByText(/^12,50\s€$/)).toBeVisible();
    expect(screen.getByText(/^20,00–25,00\s€$/)).toBeVisible();
    expect(screen.getByRole('link', { name: 'Choisir les options' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Ajouter au panier' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Panier, 0 article' })).toBeVisible();
  });

  it('keeps English text when only locale is set', async () => {
    mockStore();
    mount(<Catalog />, { locale: 'fr-FR' });
    expect(await screen.findByText('Showing 2 products')).toBeVisible();
    expect(screen.getByText(/^12,50\s€$/)).toBeVisible();
  });

  it('leaves out a null title and description, rather than an empty heading', async () => {
    mockStore();
    mount(
      <CatalogRoot>
        <CatalogHeader title={null} description={null} />
        <RelatedProducts productId='mug' title={null} />
      </CatalogRoot>,
    );
    // The related products load after the catalog, so their cards show it rendered.
    expect(await screen.findByRole('heading', { level: 2, name: 'T-shirt' })).toBeVisible();
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    expect(screen.queryByText(enUS.catalogDescription as string)).not.toBeInTheDocument();
    expect(screen.queryByText(enUS.relatedTitle as string)).not.toBeInTheDocument();
    expect(document.querySelector('[data-commerce-part=related-products]')).not.toHaveAttribute(
      'aria-labelledby',
    );
  });

  it('fills keys a site leaves out with English, and props still win', async () => {
    mockStore();
    mount(
      <CatalogRoot>
        <CatalogHeader description='Handmade in Lyon.' />
      </CatalogRoot>,
      { messages: { catalogTitle: 'Notre boutique' } },
    );
    expect(await screen.findByRole('heading', { name: 'Notre boutique' })).toBeVisible();
    expect(screen.getByText('Handmade in Lyon.')).toBeVisible();
  });

  it('translates the product page, its options and its add button', async () => {
    mockStore();
    const user = userEvent.setup();
    mount(<ProductDetails />, french, '/products/shirt');
    expect(await screen.findByRole('heading', { level: 1, name: 'T-shirt' })).toBeVisible();
    expect(screen.getByText(/^À partir de 20,00\s€$/)).toBeVisible();
    expect(screen.getByRole('link', { name: 'Retour à la boutique' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Choisir : taille' }));
    // Testing Library normalizes spaces, so match the no-break space exactly.
    expect(
      screen.getByText('Sélection requise\u00a0: taille.', { normalizer: (text) => text }),
    ).toBeVisible();
    expect(screen.getByRole('spinbutton', { name: 'Quantité' })).toBeVisible();
  });

  it('translates server failures by code on the product page', async () => {
    mockStore();
    mount(<ProductDetails />, french, '/products/broken');
    const alert = await screen.findByRole('alert');
    expect(within(alert).getByRole('heading', { name: 'Produit indisponible' })).toBeVisible();
    expect(within(alert).getByText(formatMessage(frFR, 'requestFailed'))).toBeVisible();
    expect(within(alert).getByRole('button', { name: 'Recharger le produit' })).toBeVisible();
  });

  it('shows the French text for a known server code', async () => {
    mockStore();
    mount(<ProductDetails />, french, '/products/upstream');
    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText(frFR.errorCodes.upstream_error ?? '')).toBeVisible();
  });

  it('keeps English server text when an override leaves locale empty', async () => {
    mockStore();
    mount(<ProductDetails />, { messages: { locale: null as unknown as string } }, '/products/broken');
    expect(await screen.findByText('Catalog offline')).toBeVisible();
  });

  it('names samples and sample carts in French', async () => {
    mockStore('unbound');
    const user = userEvent.setup();
    mount(<Catalog sampleProducts />, french);
    expect(await screen.findByText("Produits d'exemple · Prix d'exemple en USD")).toBeVisible();
    await user.click(screen.getByRole('button', { name: "Ajouter Produit 1 au panier d'exemple" }));
    const drawer = await screen.findByRole('dialog', { name: "Panier d'exemple (1)" });
    expect(within(drawer).getByText("Sous-total d'exemple")).toBeVisible();
    expect(within(drawer).getByRole('button', { name: 'Fermer le panier' })).toBeVisible();
    expect(document.querySelector('.commerce-sr-only[aria-live]')?.textContent).toBe(
      "Article ajouté à votre panier d'exemple\u00a0: Produit 1.",
    );
  });

  it('keeps the text function stable when messages is an inline object, nested parts included', () => {
    const seen = new Set<unknown>();
    function Probe(): ReactElement {
      const text = useMessage();
      seen.add(text);
      return <output>{`${text('checkout')} ${text('cartButtonLabel', { count: 2 })}`}</output>;
    }
    mockStore();
    const client = new QueryClient();
    // A new object, plural and errorCodes on every render, as an inline prop would be.
    const page = (checkout: string) => (
      <StrictMode>
        <QueryClientProvider client={client}>
          <MemoryRouter>
            <CommerceStorefront
              locale='fr-FR'
              messages={{
                ...frFR,
                checkout,
                cartButtonLabel: { one: 'Panier ({count})', other: 'Panier ({count})' },
                errorCodes: { ...frFR.errorCodes, not_found: 'Introuvable' },
              }}
            >
              <Probe />
            </CommerceStorefront>
          </MemoryRouter>
        </QueryClientProvider>
      </StrictMode>
    );
    const view = render(page('Commander'));
    const first: number = seen.size;
    view.rerender(page('Commander'));
    view.rerender(page('Commander'));
    expect(seen.size).toBe(first);
    view.rerender(page('Payer'));
    expect(screen.getByText('Payer Panier (2)')).toBeVisible();
    expect(seen.size).toBe(first + 1);
  });

  it('gives custom parts the provider text, and English outside a provider', () => {
    function Label({ id }: { id: string }): ReactElement {
      return <output data-testid={id}>{useMessage()('cartTitle')}</output>;
    }
    mockStore();
    mount(<Label id='inside' />, french);
    render(<Label id='outside' />);
    expect(screen.getByTestId('inside')).toHaveTextContent('Votre panier');
    expect(screen.getByTestId('outside')).toHaveTextContent('Your cart');
  });
});
