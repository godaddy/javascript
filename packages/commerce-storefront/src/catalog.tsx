import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { createContext, type ReactElement, type ReactNode, useContext } from 'react';
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
  return (
    <StorefrontSurface>
      {connection === 'ready' ? (
        <CatalogLoader className={className}>{children}</CatalogLoader>
      ) : connection === 'unbound' && sampleProducts ? (
        <CatalogContext.Provider value={{ source: 'sample' }}>
          <section className={partClass(className)} data-commerce-source='sample'>
            {children}
          </section>
        </CatalogContext.Provider>
      ) : (
        <CommerceStatus />
      )}
    </StorefrontSurface>
  );
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
  function goToPage(cursor?: string): void {
    const next = new URLSearchParams(params);
    if (cursor) next.set('after', cursor);
    else next.delete('after');
    setParams(next);
  }
  const nodes: SKUGroup[] =
    products.data?.skuGroups?.edges?.flatMap((edge) => (edge?.node?.id ? [edge.node] : [])) ?? [];
  return (
    <CatalogContext.Provider value={{ source: 'live', products, nodes, after, goToPage }}>
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
        {catalog.source === 'sample'
          ? 'Sample products · Example prices in USD'
          : catalog.products.isPending
            ? 'Loading products…'
            : catalog.products.isError
              ? 'Products unavailable'
              : `Showing ${catalog.nodes.length} product${catalog.nodes.length === 1 ? '' : 's'}`}
      </p>
    </div>
  );
}

export interface CatalogProductsProps extends CatalogPartProps {
  /** One card, rendered for every product. Defaults to the packaged card. */
  children?: ReactNode;
}

/**
 * The product cards. `className` goes on the element that contains the cards, such as a grid. The loading
 * placeholder, the error with its retry, and the empty message render just before that element.
 */
export function CatalogProducts({ className, children }: CatalogProductsProps): ReactElement {
  const catalog = useCatalogInternal('CatalogProducts');
  const card: ReactNode = children ?? (
    <ProductCardRoot className={packagedCardClass}>
      <PackagedCardParts />
    </ProductCardRoot>
  );
  const items: { key: string; item: ProductCardItem }[] =
    catalog.source === 'sample'
      ? sampleProducts.map((sample) => ({ key: sample.key, item: { source: 'sample', sample } }))
      : catalog.nodes.map((product) => ({ key: product.id ?? '', item: { source: 'live', product } }));
  const products = catalog.source === 'live' ? catalog.products : null;
  return (
    <>
      {products?.isPending && (
        <div aria-hidden='true' className='grid grid-cols-1 gap-6 py-8 sm:grid-cols-2 lg:grid-cols-3'>
          {[0, 1, 2].map((item: number) => (
            <div
              key={item}
              className='overflow-hidden rounded-lg border border-neutral-200 motion-safe:animate-pulse'
            >
              <div className='aspect-square bg-neutral-100' />
              <div className='space-y-4 p-6'>
                <div className='h-6 w-2/3 rounded bg-neutral-100' />
                <div className='h-4 rounded bg-neutral-100' />
                <div className='h-11 rounded bg-neutral-100' />
              </div>
            </div>
          ))}
        </div>
      )}
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
        {items.map(({ key, item }) => (
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
    <nav aria-label='Product pages' className={partClass('flex justify-between', className)}>
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
    </nav>
  );
}

export interface CatalogProps {
  title?: string;
  description?: string;
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
