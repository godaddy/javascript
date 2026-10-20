import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import {
  createContext,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { message, request } from './api';
import type { SKUGroup, SkuGroupsResult } from './catalog-model';
import { errorActionClass, errorNoticeClass, secondaryButtonClass } from './class-names';
import { useCommerce } from './commerce-provider';
import { hasChildren, type PartRegistry, partProps, usePartRegistry } from './part';
import {
  CatalogItemContext,
  PackagedCardParts,
  type ProductCardItem,
  ProductCardRoot,
  packagedCardClass,
} from './product-card';
import { useRootParams } from './root-params';
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

interface CatalogEmptyInternal {
  register: PartRegistry['register'];
  /** A `CatalogEmpty` is mounted, so `CatalogProducts` leaves out its own empty message. */
  custom: boolean;
}

const CatalogEmptyContext = createContext<CatalogEmptyInternal | null>(null);
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
  /** Products per page, a whole number of 1 or more. Defaults to 6. Samples are always one page of six. */
  pageSize?: number;
  /**
   * Keep the page cursor in the page URL, as `after`, so a reload or a shared link keeps the page. Defaults to
   * `true`. Set `false` for every other catalog on the same page, so the catalogs do not share one cursor.
   */
  urlState?: boolean;
}

/** Loads one cursor page of products, or the built-in samples, and provides them to catalog parts. */
export function CatalogRoot({
  children,
  className,
  sampleProducts = false,
  pageSize = 6,
  urlState = true,
}: CatalogRootProps): ReactElement {
  const { connection } = useCommerce();
  // Parent effects run after child effects, so a mounted `CatalogEmpty` has registered by the root's own effect.
  const [custom, setCustom] = useState<boolean>(false);
  const { register, has } = usePartRegistry(
    useCallback((registered: PartRegistry['has']) => setCustom(registered('empty')), []),
  );
  useEffect(() => {
    setCustom(has('empty'));
  }, [has]);
  const empty = useMemo((): CatalogEmptyInternal => ({ register, custom }), [register, custom]);
  if (!Number.isSafeInteger(pageSize) || pageSize < 1)
    throw new Error(`CatalogRoot pageSize must be a whole number of 1 or more, not ${pageSize}.`);
  let content: ReactElement;
  if (connection === 'ready')
    content = (
      <CatalogLoader className={className} pageSize={pageSize} urlState={urlState}>
        {children}
      </CatalogLoader>
    );
  else if (connection === 'unbound' && sampleProducts)
    content = (
      <CatalogContext.Provider value={sampleCatalog}>
        <section {...partProps('catalog-root', className)} data-commerce-source='sample'>
          {children}
        </section>
      </CatalogContext.Provider>
    );
  // Host classes stay on while connecting, so the layout does not jump when the catalog replaces the status.
  else
    content = (
      <div {...partProps('catalog-root', className)}>
        <CommerceStatus />
      </div>
    );
  return (
    <StorefrontSurface>
      <CatalogEmptyContext.Provider value={empty}>{content}</CatalogEmptyContext.Provider>
    </StorefrontSurface>
  );
}

function CatalogLoader({
  children,
  className,
  pageSize,
  urlState,
}: Omit<CatalogRootProps, 'sampleProducts'> & { pageSize: number; urlState: boolean }): ReactElement {
  const { config } = useCommerce();
  const [params, setParams] = useRootParams(urlState);
  const after: string = params.get('after') ?? '';
  const urlParams: URLSearchParams = new URLSearchParams({ first: String(pageSize) });
  if (after) urlParams.set('after', after);
  const products = useQuery({
    retry: false,
    queryKey: ['commerce', config.cartScope, 'products', pageSize, after],
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
      <section {...partProps('catalog-root', className)}>{children}</section>
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
    <header {...partProps('catalog-header', className)}>
      <h1 className='max-w-3xl text-balance text-3xl font-semibold leading-tight tracking-tight'>{title}</h1>
      <p className='mt-1 max-w-xl text-base leading-7 text-commerce-muted'>{description}</p>
    </header>
  );
}

/** Announces loading, failure, or how many products the page shows. */
export function CatalogSummary({ className }: CatalogPartProps): ReactElement {
  const catalog = useCatalogInternal('CatalogSummary');
  return (
    <div {...partProps('catalog-summary', className)}>
      <p className='text-sm text-commerce-muted' role='status'>
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

/** Two columns on phones, then as many 240px columns as fit. Shared with `RelatedProducts`. */
export const catalogGridClass: string =
  'grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] lg:gap-y-12';

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
 * element holds placeholder cards. The error with its retry and, without a `CatalogEmpty`, the empty message render just before it.
 */
export function CatalogProducts({ className, children }: CatalogProductsProps): ReactElement {
  const catalog = useCatalogInternal('CatalogProducts');
  const customEmpty: boolean = useContext(CatalogEmptyContext)?.custom ?? false;
  // `{custom && <ProductCardRoot>…}` with `custom` false still gets a card, not an empty slot per product.
  const card: ReactNode = hasChildren(children) ? children : packagedCard;
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
        <div role='alert' className={errorNoticeClass}>
          <p>{message(products.error)}</p>
          <button type='button' className={errorActionClass} onClick={() => void products.refetch()}>
            Retry products
          </button>
        </div>
      )}
      {products?.isSuccess && !items.length && !customEmpty && (
        <p className='py-16 text-center text-commerce-muted'>No products available.</p>
      )}
      <div {...partProps('catalog-products', className)}>
        {/* Placeholders go inside the host's element, so they follow its grid. */}
        {products?.isPending
          ? [0, 1, 2].map((placeholder: number) => (
              <div key={placeholder} aria-hidden='true' className='motion-safe:animate-pulse'>
                <div className='aspect-square bg-commerce-tint-strong' />
                <div className='space-y-2 pt-3'>
                  <div className='h-4 w-2/3 rounded bg-commerce-tint-strong' />
                  <div className='h-4 w-1/4 rounded bg-commerce-tint-strong' />
                </div>
                <div className='mt-4 h-11 rounded-lg bg-commerce-tint' />
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

export interface CatalogEmptyProps extends CatalogPartProps {
  /** Replaces the default message. */
  children?: ReactNode;
}

/**
 * Renders only when a connected store's catalog has no products: "No products available.", or its children. While
 * one is mounted, `CatalogProducts` leaves out its own empty message. Samples are never empty.
 */
export function CatalogEmpty({ className, children }: CatalogEmptyProps): ReactElement | null {
  const catalog = useCatalogInternal('CatalogEmpty');
  const register = useContext(CatalogEmptyContext)?.register;
  useEffect(() => register?.('empty'), [register]);
  if (catalog.source === 'sample' || !catalog.products.isSuccess || catalog.nodes.length) return null;
  return (
    <div {...partProps('catalog-empty', className)}>
      {hasChildren(children) ? children : <p>No products available.</p>}
    </div>
  );
}

/**
 * First-page and next-page buttons. Renders nothing when there is only one page, including for samples.
 */
export function CatalogPagination({ className }: CatalogPartProps): ReactElement | null {
  const catalog = useCatalogInternal('CatalogPagination');
  if (catalog.source === 'sample') return null;
  const { after, goToPage } = catalog;
  const pageInfo = catalog.products.data?.skuGroups?.pageInfo;
  const hasNext: boolean = !!(pageInfo?.hasNextPage && pageInfo.endCursor);
  if (!after && !hasNext) return null;
  return (
    <nav aria-label='Product pages' {...partProps('catalog-pagination', className)}>
      {/* Inside the part, so this layout cannot outrank host classes on the nav. */}
      <div className='flex justify-center gap-3'>
        {after && (
          <button type='button' className={secondaryButtonClass} onClick={() => goToPage()}>
            First page
          </button>
        )}
        {hasNext && pageInfo?.endCursor && (
          <button
            type='button'
            className={secondaryButtonClass}
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
  /** Products per page. Defaults to 6. */
  pageSize?: number;
}

/** The packaged catalog. Compose `CatalogRoot` and the catalog parts for a custom layout. */
export function Catalog({
  title,
  description,
  showHeader = true,
  sampleProducts,
  pageSize,
}: CatalogProps): ReactElement {
  return (
    <CatalogRoot sampleProducts={sampleProducts} pageSize={pageSize}>
      <div className='flex flex-wrap items-end justify-between gap-x-4 gap-y-2 pb-6 pt-4 sm:pb-8 sm:pt-8'>
        {showHeader && <CatalogHeader title={title} description={description} />}
        <CatalogSummary />
      </div>
      <CatalogProducts className={catalogGridClass} />
      <CatalogPagination className='mt-12 border-t border-commerce-line pt-6' />
    </CatalogRoot>
  );
}
