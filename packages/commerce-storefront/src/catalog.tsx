import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import {
  Children,
  createContext,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import { useSearchParams } from 'react-router';
import { message, request } from './api';
import { buttonClass } from './cart';
import type { SKUGroup, SkuGroupsResult } from './catalog-model';
import { useCommerce } from './commerce-provider';
import { partClass } from './part';
import {
  CatalogItemContext,
  PackagedCardParts,
  type ProductCardItem,
  ProductCardRoot,
  packagedCardClass,
} from './product-card';
import { sampleProducts } from './sample-cart';
import { CommerceStatus, StorefrontSurface } from './storefront-surface';

type CatalogInternal =
  | { source: 'sample' }
  | {
      source: 'live';
      products: UseQueryResult<SkuGroupsResult>;
      nodes: SKUGroup[];
      after: string;
      goToPage: (cursor?: string) => void;
    };

/** Props shared by every catalog part. `className` is added to the part's outer element. */
export interface CatalogPartProps {
  className?: string;
}

const CatalogContext = createContext<CatalogInternal | null>(null);
const sampleCatalog: CatalogInternal = { source: 'sample' };

function useCatalogInternal(part: string): CatalogInternal {
  const context = useContext(CatalogContext);
  if (!context) throw new Error(`${part} must be rendered inside <CatalogRoot>.`);
  return context;
}

export interface CatalogRootProps {
  children: ReactNode;
  /** Added to the root `<section>`. */
  className?: string;
  /** Permit built-in examples only while the host confirms this site is unbound. */
  sampleProducts?: boolean;
}

/** Loads one cursor page of products, or the built-in samples, and provides them to catalog parts. */
export function CatalogRoot({ children, className, sampleProducts = false }: CatalogRootProps): ReactElement {
  const { connection } = useCommerce();
  let content: ReactElement;
  if (connection === 'ready') content = <CatalogLoader className={className}>{children}</CatalogLoader>;
  else if (connection === 'unbound' && sampleProducts)
    content = (
      <CatalogContext.Provider value={sampleCatalog}>
        <section className={partClass(className)} data-commerce-source='sample'>
          {children}
        </section>
      </CatalogContext.Provider>
    );
  // Host classes stay on while connecting, so the layout does not jump when the catalog replaces the status.
  else
    content = (
      <div className={partClass(className)}>
        <CommerceStatus />
      </div>
    );
  return <StorefrontSurface>{content}</StorefrontSurface>;
}

function CatalogLoader({ children, className }: Omit<CatalogRootProps, 'sampleProducts'>): ReactElement {
  const { config } = useCommerce();
  const [params, setParams] = useSearchParams();
  const after: string = params.get('after') ?? '';
  const urlParams: URLSearchParams = new URLSearchParams({ first: '6' });
  if (after) urlParams.set('after', after);
  const products = useQuery({
    retry: false,
    queryKey: ['commerce', config.cartScope, 'products', after],
    queryFn: ({ signal }) =>
      request<SkuGroupsResult>(`/products?${urlParams}`, {
        signal,
        headers: { 'X-Commerce-Scope': config.cartScope },
      }),
  });
  const goToPage = useCallback(
    (cursor?: string): void => {
      const next = new URLSearchParams(params);
      if (cursor) next.set('after', cursor);
      else next.delete('after');
      setParams(next);
    },
    [params, setParams],
  );
  // Stable while the data is, so a refetch does not re-render every card.
  const nodes = useMemo(
    (): SKUGroup[] =>
      products.data?.skuGroups?.edges?.flatMap((edge) => (edge?.node?.id ? [edge.node] : [])) ?? [],
    [products.data],
  );
  const value = useMemo(
    (): CatalogInternal => ({ source: 'live', products, nodes, after, goToPage }),
    [products, nodes, after, goToPage],
  );
  return (
    <CatalogContext.Provider value={value}>
      <section className={partClass(className)}>{children}</section>
    </CatalogContext.Provider>
  );
}

export interface CatalogHeaderProps extends CatalogPartProps {
  title?: string;
  description?: string;
}

/** The catalog title as the page's H1, with a description. */
export function CatalogHeader({
  title = 'Shop all products',
  description = 'Explore the collection and find your favorites.',
  className,
}: CatalogHeaderProps): ReactElement {
  useCatalogInternal('CatalogHeader');
  return (
    <header className={partClass(className)}>
      <h1 className='max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl'>{title}</h1>
      <p className='mt-5 max-w-xl text-base leading-7 sm:text-lg'>{description}</p>
    </header>
  );
}

/** Announces loading, failure, or how many products the page shows. */
export function CatalogSummary({ className }: CatalogPartProps): ReactElement {
  const catalog = useCatalogInternal('CatalogSummary');
  return (
    <div className={partClass(className)}>
      <p className='text-sm' role='status'>
        {summary(catalog)}
      </p>
    </div>
  );
}

function summary(catalog: CatalogInternal): string {
  if (catalog.source === 'sample') return 'Sample products · Example prices in USD';
  if (catalog.products.isPending) return 'Loading products…';
  if (catalog.products.isError) return 'Products unavailable';
  return `Showing ${catalog.nodes.length} product${catalog.nodes.length === 1 ? '' : 's'}`;
}

const sampleItems: { key: string; item: ProductCardItem }[] = sampleProducts.map((sample) => ({
  key: sample.key,
  item: { source: 'sample', sample },
}));

const packagedCard: ReactElement = (
  <ProductCardRoot className={packagedCardClass}>
    <PackagedCardParts />
  </ProductCardRoot>
);

export interface CatalogProductsProps extends CatalogPartProps {
  /** One card, rendered for every product. Defaults to the packaged card. */
  children?: ReactNode;
}

/**
 * The product cards. `className` goes on the element that contains the cards, such as a grid. While loading, that
 * element holds placeholder cards. The error with its retry and the empty message render just before it.
 */
export function CatalogProducts({ className, children }: CatalogProductsProps): ReactElement {
  const catalog = useCatalogInternal('CatalogProducts');
  // `{custom && <ProductCardRoot>…}` with `custom` false still gets a card, not an empty slot per product.
  const card: ReactNode = Children.toArray(children).some((child) => child !== '') ? children : packagedCard;
  const nodes: SKUGroup[] | null = catalog.source === 'live' ? catalog.nodes : null;
  const items = useMemo(
    (): { key: string; item: ProductCardItem }[] =>
      nodes
        ? nodes.map((product) => ({ key: product.id ?? '', item: { source: 'live', product } }))
        : sampleItems,
    [nodes],
  );
  const products = catalog.source === 'live' ? catalog.products : null;
  return (
    <>
      {products?.isError && (
        <div role='alert' className='rounded-lg bg-red-50 p-5 text-red-800'>
          <p>{message(products.error)}</p>
          <button
            type='button'
            className='min-h-11 bg-red-50 text-red-800 underline'
            onClick={() => void products.refetch()}
          >
            Retry products
          </button>
        </div>
      )}
      {products?.isSuccess && !items.length && <p className='py-16 text-center'>No products available.</p>}
      <div className={partClass(className)}>
        {/* Placeholders go inside the host's element, so they follow its grid. */}
        {products?.isPending
          ? [0, 1, 2].map((placeholder: number) => (
              <div
                key={placeholder}
                aria-hidden='true'
                className='overflow-hidden rounded-lg border border-neutral-200 motion-safe:animate-pulse'
              >
                <div className='aspect-square bg-neutral-100' />
                <div className='space-y-4 p-6'>
                  <div className='h-6 w-2/3 rounded bg-neutral-100' />
                  <div className='h-4 rounded bg-neutral-100' />
                  <div className='h-11 rounded bg-neutral-100' />
                </div>
              </div>
            ))
          : items.map(({ key, item }) => (
              <CatalogItemContext.Provider key={key} value={item}>
                {card}
              </CatalogItemContext.Provider>
            ))}
      </div>
    </>
  );
}

/** First-page and next-page buttons. Renders nothing for samples, which have one page. */
export function CatalogPagination({ className }: CatalogPartProps): ReactElement | null {
  const catalog = useCatalogInternal('CatalogPagination');
  if (catalog.source === 'sample') return null;
  const { after, goToPage } = catalog;
  const pageInfo = catalog.products.data?.skuGroups?.pageInfo;
  return (
    <nav aria-label='Product pages' className={partClass(className)}>
      {/* Inside the part, so this layout cannot outrank host classes on the nav. */}
      <div className='flex justify-between'>
        {after ? (
          <button type='button' className={buttonClass} onClick={() => goToPage()}>
            First page
          </button>
        ) : (
          <span />
        )}
        {pageInfo?.hasNextPage && pageInfo.endCursor && (
          <button
            type='button'
            className={buttonClass}
            onClick={() => goToPage(pageInfo.endCursor ?? undefined)}
          >
            Next page
          </button>
        )}
      </div>
    </nav>
  );
}

export interface CatalogProps {
  /** @deprecated Compose `CatalogRoot` with `<CatalogHeader title='…' />` instead. */
  title?: string;
  /** @deprecated Compose `CatalogRoot` with `<CatalogHeader description='…' />` instead. */
  description?: string;
  /** @deprecated To render the page's own H1, compose `CatalogRoot` without `CatalogHeader` instead. */
  showHeader?: boolean;
  /** Permit built-in examples only while the host confirms this site is unbound. */
  sampleProducts?: boolean;
}

/** The packaged catalog. Compose `CatalogRoot` and the catalog parts for a custom layout. */
export function Catalog({
  title,
  description,
  showHeader = true,
  sampleProducts,
}: CatalogProps): ReactElement {
  return (
    <CatalogRoot sampleProducts={sampleProducts}>
      {showHeader && (
        <CatalogHeader
          title={title}
          description={description}
          className='border-b border-neutral-200 pb-10 pt-4 sm:pb-14 sm:pt-8'
        />
      )}
      <CatalogSummary className='border-b border-neutral-200 py-6 sm:py-8' />
      <CatalogProducts className='grid grid-cols-1 gap-6 py-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8 lg:py-10' />
      <CatalogPagination className='border-t border-neutral-200 pt-6' />
    </CatalogRoot>
  );
}
