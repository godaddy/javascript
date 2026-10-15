import { createContext, type ReactElement, type ReactNode, useContext, useState } from 'react';
import { Link } from 'react-router';
import { money } from './api';
import { AddToCartButton, buttonClass } from './cart';
import {
  getPrimaryImageUrl,
  getProductAttributes,
  getSingleMatchedSku,
  type SKU,
  type SKUGroup,
} from './catalog-model';
import { useCommerce } from './commerce-provider';
import { partClass } from './part';
import { type SampleProduct, useSampleCart } from './sample-cart';
import { StorefrontSurface } from './storefront-surface';

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

/** One catalog entry: a product from the server, or a built-in sample while no store is connected. */
export type ProductCardItem =
  | { source: 'live'; product: SKUGroup }
  | { source: 'sample'; sample: SampleProduct };

/** Set by `CatalogProducts` for each entry it renders, so the card template needs no product prop. */
export const CatalogItemContext = createContext<ProductCardItem | null>(null);

/** Read-only card state for custom parts rendered inside `ProductCardRoot`. */
export interface ProductCardState {
  /** `null` for a built-in sample, which is not a catalog product. */
  readonly product: SKUGroup | null;
  readonly name: string;
  /** The product page, or `null` for a sample, which has none. */
  readonly href: string | null;
  readonly isSample: boolean;
}

interface ProductCardInternal extends ProductCardState {
  item: ProductCardItem;
}

/** Props shared by every card part. `className` is added to the part's outer element. */
export interface ProductCardPartProps {
  className?: string;
}

const ProductCardContext = createContext<ProductCardInternal | null>(null);

function useProductCardInternal(part: string): ProductCardInternal {
  const context = useContext(ProductCardContext);
  if (!context) throw new Error(`${part} must be rendered inside <ProductCardRoot>.`);
  return context;
}

/** Read the card's product, name, and link from inside `ProductCardRoot`. */
export function useProductCard(): ProductCardState {
  const { product, name, href, isSample } = useProductCardInternal('useProductCard');
  return { product, name, href, isSample };
}

export interface ProductCardRootProps {
  children: ReactNode;
  /** The catalog product to show. Leave it out inside `CatalogProducts`, which supplies each product. */
  product?: SKUGroup;
  /** Added to the root `<article>`. */
  className?: string;
}

/** Provides one product to card parts. Inside `CatalogProducts` it renders the current catalog entry. */
export function ProductCardRoot({ children, product, className }: ProductCardRootProps): ReactElement {
  const catalogItem = useContext(CatalogItemContext);
  const { config } = useCommerce();
  if (catalogItem && product)
    throw new Error(
      'Inside <CatalogProducts>, ProductCardRoot shows each catalog product. Remove its product prop.',
    );
  const item: ProductCardItem | null = catalogItem ?? (product ? { source: 'live', product } : null);
  if (!item) throw new Error('ProductCardRoot needs a product prop outside <CatalogProducts>.');
  const value: ProductCardInternal =
    item.source === 'live'
      ? {
          item,
          product: item.product,
          name: item.product.label ?? item.product.name ?? 'Product',
          href: `${config.productPath}/${encodeURIComponent(item.product.id ?? '')}`,
          isSample: false,
        }
      : { item, product: null, name: item.sample.name, href: null, isSample: true };
  const card: ReactElement = (
    <ProductCardContext.Provider value={value}>
      {/* `group` drives the image hover zoom. A card nested inside this one is not a catalog entry. */}
      <article className={partClass('group', className)}>
        <CatalogItemContext.Provider value={null}>{children}</CatalogItemContext.Provider>
      </article>
    </ProductCardContext.Provider>
  );
  // Inside the catalog the article is the grid item, so host classes such as `col-span-2` place it.
  return catalogItem ? card : <StorefrontSurface>{card}</StorefrontSurface>;
}

/** The product's first image, linked to its page. Samples show a placeholder. */
export function ProductCardImage({ className }: ProductCardPartProps): ReactElement {
  const { item, name, href } = useProductCardInternal('ProductCardImage');
  return (
    <div className={partClass(className)}>
      {item.source === 'live' && href ? (
        <Link to={href} tabIndex={-1} aria-hidden='true' className='block aspect-square overflow-hidden'>
          <ProductImage
            url={getPrimaryImageUrl(item.product)}
            name={name}
            className='motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:scale-105'
          />
        </Link>
      ) : (
        <div aria-hidden='true' className='flex aspect-square items-center justify-center bg-neutral-100'>
          <div className='h-20 w-20 rounded-lg border border-neutral-300' />
        </div>
      )}
    </div>
  );
}

/** The product name as an H2, linked to its page. */
export function ProductCardTitle({ className }: ProductCardPartProps): ReactElement {
  const { name, href } = useProductCardInternal('ProductCardTitle');
  return (
    <div className={partClass(className)}>
      <h2 className='break-words text-2xl font-semibold leading-tight'>
        {href ? (
          <Link
            className='rounded text-inherit hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'
            to={href}
          >
            {name}
          </Link>
        ) : (
          name
        )}
      </h2>
    </div>
  );
}

/** Up to three lines of the product description. Renders nothing without one. */
export function ProductCardDescription({ className }: ProductCardPartProps): ReactElement | null {
  const { product } = useProductCardInternal('ProductCardDescription');
  if (!product?.description) return null;
  return (
    <div className={partClass(className)}>
      <p className='line-clamp-3 text-sm leading-6'>{product.description}</p>
    </div>
  );
}

/** The product's price, or its price range when variants differ. */
export function ProductCardPrice({ className }: ProductCardPartProps): ReactElement {
  const { item } = useProductCardInternal('ProductCardPrice');
  const { config } = useCommerce();
  let text: string;
  if (item.source === 'sample') text = money(item.sample.price, 'USD');
  else {
    const min: number | null | undefined = item.product.priceRange?.min;
    const max: number | null | undefined = item.product.priceRange?.max;
    text =
      typeof min === 'number'
        ? `${money(min, config.currencyCode)}${typeof max === 'number' && max !== min ? ` – ${money(max, config.currencyCode)}` : ''}`
        : 'Price unavailable';
  }
  return (
    <div className={partClass(className)}>
      <p className='text-lg font-semibold leading-7'>{text}</p>
    </div>
  );
}

/**
 * Adds the product directly when it has exactly one SKU and no options; otherwise links to its page to choose.
 * Samples add to the sample cart.
 */
export function ProductCardAction({ className }: ProductCardPartProps): ReactElement {
  const { item, name, href } = useProductCardInternal('ProductCardAction');
  return (
    <div className={partClass(className)}>
      {item.source === 'live' ? (
        <LiveAction product={item.product} name={name} href={href ?? ''} />
      ) : (
        <SampleAction sample={item.sample} />
      )}
    </div>
  );
}

function LiveAction({
  product,
  name,
  href,
}: {
  product: SKUGroup;
  name: string;
  href: string;
}): ReactElement {
  const selectedSku: SKU | null = getSingleMatchedSku(product);
  const hasVariants: boolean = getProductAttributes(product).length > 0;
  if (!hasVariants && selectedSku) return <AddToCartButton sku={selectedSku} name={name} />;
  return (
    <Link className={buttonClass} to={href}>
      {hasVariants ? 'Choose options' : 'View product'}
    </Link>
  );
}

function SampleAction({ sample }: { sample: SampleProduct }): ReactElement {
  const { add } = useSampleCart();
  return (
    <button
      type='button'
      className={buttonClass}
      aria-label={`Add ${sample.name} to sample cart`}
      onClick={() => add(sample.key)}
    >
      Add to cart
    </button>
  );
}

// In the catalog grid each card stretches to its row, and `mt-auto` lines up the price rows.
export const packagedCardClass: string =
  'flex min-w-0 flex-col overflow-hidden rounded-lg border border-neutral-200';

/** The packaged card's parts, inside a root that has `packagedCardClass`. */
export function PackagedCardParts(): ReactElement {
  return (
    <>
      <ProductCardImage />
      <div className='flex flex-1 flex-col p-6'>
        <ProductCardTitle />
        <ProductCardDescription className='mt-3' />
        <div className='mt-auto pt-6'>
          <div className='flex flex-wrap items-end justify-between gap-4 border-t border-neutral-200 pt-5'>
            <ProductCardPrice className='min-w-0 flex-1' />
            <ProductCardAction className='max-w-full' />
          </div>
        </div>
      </div>
    </>
  );
}

/** The packaged card for one `SKUGroup`. Compose `ProductCardRoot` and the card parts for a custom card. */
export function ProductCard({ product }: { product: SKUGroup }): ReactElement {
  return (
    <ProductCardRoot product={product} className={packagedCardClass}>
      <PackagedCardParts />
    </ProductCardRoot>
  );
}
