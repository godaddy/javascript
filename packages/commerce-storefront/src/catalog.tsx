import { useQuery } from '@tanstack/react-query';
import { type ReactElement, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { message, money, request } from './api';
import { AddToCartButton, buttonClass } from './cart';
import {
  getPrimaryImageUrl,
  getProductAttributes,
  getSingleMatchedSku,
  type SKU,
  type SKUGroup,
  type SkuGroupsResult,
} from './catalog-model';
import { useCommerce } from './commerce-provider';
import { CommerceStatus, StorefrontSurface } from './storefront-surface';

export function ProductImage({
  url,
  name,
  className = '',
}: {
  url?: string | null;
  name: string;
  className?: string;
}): ReactElement {
  const [failed, setFailed] = useState<boolean>(false);
  return url && !failed ? (
    <img
      src={url}
      alt={name}
      loading='lazy'
      className={`h-full w-full object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  ) : (
    <div
      className={`flex h-full min-h-44 items-center justify-center p-6 text-center ${className}`}
      role='img'
      aria-label={`${name}: image unavailable`}
    >
      No image available
    </div>
  );
}

export function ProductCard({ product }: { product: SKUGroup }): ReactElement {
  return (
    <StorefrontSurface>
      <ProductCardContent product={product} />
    </StorefrontSurface>
  );
}

function ProductCardContent({ product }: { product: SKUGroup }): ReactElement {
  const { config } = useCommerce();
  const name: string = product.label ?? product.name ?? 'Product';
  const href: string = `${config.productPath}/${encodeURIComponent(product.id ?? '')}`;
  const selectedSku: SKU | null = getSingleMatchedSku(product);
  const _skuId: string | null = selectedSku?.id ?? null;
  const hasVariants: boolean = getProductAttributes(product).length > 0;
  const min: number | null | undefined = product.priceRange?.min;
  const max: number | null | undefined = product.priceRange?.max;
  return (
    <article className='group flex min-w-0 flex-col overflow-hidden rounded-lg border border-neutral-200'>
      <Link to={href} tabIndex={-1} aria-hidden='true' className='block aspect-square overflow-hidden'>
        <ProductImage
          url={getPrimaryImageUrl(product)}
          name={name}
          className='motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:scale-105'
        />
      </Link>
      <div className='flex flex-1 flex-col p-6'>
        <h2 className='break-words text-2xl font-semibold leading-tight'>
          <Link
            className='rounded text-inherit hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'
            to={href}
          >
            {name}
          </Link>
        </h2>
        {product.description && <p className='mt-3 line-clamp-3 text-sm leading-6'>{product.description}</p>}
        <div className='mt-auto pt-6'>
          <div className='flex flex-wrap items-end justify-between gap-4 border-t border-neutral-200 pt-5'>
            <p className='min-w-0 flex-1 text-lg font-semibold leading-7'>
              {typeof min === 'number'
                ? `${money(min, config.currencyCode)}${typeof max === 'number' && max !== min ? ` – ${money(max, config.currencyCode)}` : ''}`
                : 'Price unavailable'}
            </p>
            <div className='max-w-full'>
              {!hasVariants && selectedSku ? (
                <AddToCartButton sku={selectedSku} name={name} />
              ) : (
                <Link className={buttonClass} to={href}>
                  {hasVariants ? 'Choose options' : 'View product'}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export interface CatalogProps {
  title?: string;
  description?: string;
}

export function Catalog(props: CatalogProps): ReactElement {
  const { connection } = useCommerce();
  return (
    <StorefrontSurface>
      {connection === 'ready' ? <CatalogContent {...props} /> : <CommerceStatus />}
    </StorefrontSurface>
  );
}

function CatalogContent({
  title = 'Shop all products',
  description = 'Explore the collection and find your favorites.',
}: CatalogProps): ReactElement {
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
  const pageInfo = products.data?.skuGroups?.pageInfo;
  return (
    <section>
      <header className='border-b border-neutral-200 pb-10 pt-4 sm:pb-14 sm:pt-8'>
        <h1 className='max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl'>{title}</h1>
        <p className='mt-5 max-w-xl text-base leading-7 sm:text-lg'>{description}</p>
      </header>
      <div className='border-b border-neutral-200 py-6 sm:py-8'>
        <p className='text-sm' role='status'>
          {products.isPending
            ? 'Loading products…'
            : products.isError
              ? 'Products unavailable'
              : `Showing ${nodes.length} product${nodes.length === 1 ? '' : 's'}`}
        </p>
      </div>
      {products.isPending && (
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
      {products.isError && (
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
      {products.isSuccess && !nodes.length && <p className='py-16 text-center'>No products available.</p>}
      <div className='grid grid-cols-1 gap-6 py-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8 lg:py-10'>
        {nodes.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <nav aria-label='Product pages' className='flex justify-between border-t border-neutral-200 pt-6'>
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
    </section>
  );
}
