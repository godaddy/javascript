import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router';
import { getStartingCompareAt, isOnSale, isProductOnSale } from './catalog-model';
import { saleBadgeClass } from './class-names';
import { useCommerce, useMoney } from './commerce-provider';
import { partProps, renderLabel } from './part';
import { ProductImage } from './product-card';
import {
  type ProductDetailsPartProps,
  ProductDetailsRoot,
  useProductDetailsInternal,
} from './product-details-context';
import { ProductDetailsPurchase } from './product-purchase';

/** The packaged product page for `${productPath}/:productId`. Compose the parts for a custom layout. */
export function ProductDetails(): ReactElement {
  return (
    <ProductDetailsRoot>
      <ProductDetailsBackLink className='mb-4 sm:mb-6' />
      <div className='grid items-start gap-8 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12'>
        <div className='relative min-w-0'>
          <ProductDetailsGallery />
          <ProductDetailsBadge className='pointer-events-none absolute left-4 top-4' />
        </div>
        <div className='min-w-0 md:pt-2'>
          <ProductDetailsTitle />
          <ProductDetailsPrice className='mt-2' />
          <ProductDetailsDescription className='mt-6' />
          <ProductDetailsPurchase className='mt-6 border-t border-commerce-line pt-6' />
        </div>
      </div>
    </ProductDetailsRoot>
  );
}

export interface ProductDetailsBackLinkProps extends ProductDetailsPartProps {
  /** Replaces the chevron and "Back to shop". */
  children?: ReactNode;
}

/** A link to the catalog. */
export function ProductDetailsBackLink({ className, children }: ProductDetailsBackLinkProps): ReactElement {
  useProductDetailsInternal('ProductDetailsBackLink');
  const { config } = useCommerce();
  return (
    <div {...partProps('product-details-back-link', className)}>
      <Link
        className='inline-flex min-h-11 items-center gap-1 text-sm text-commerce-muted underline-offset-4 transition-colors hover:text-inherit hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-current'
        to={config.catalogPath}
      >
        {renderLabel(
          children,
          undefined,
          <>
            <svg aria-hidden='true' viewBox='0 0 16 16' className='h-3.5 w-3.5'>
              <path
                d='M10 4L6 8l4 4'
                fill='none'
                stroke='currentColor'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
            Back to shop
          </>,
        )}
      </Link>
    </div>
  );
}

/** Main image with thumbnails; the selected SKU's images replace the product's when present. */
export function ProductDetailsGallery({ className }: ProductDetailsPartProps): ReactElement {
  const { images, imageIndex, setImageIndex, name } = useProductDetailsInternal('ProductDetailsGallery');
  return (
    <div {...partProps('product-details-gallery', className)}>
      <div className='aspect-square overflow-hidden bg-commerce-tint'>
        <ProductImage key={images[imageIndex]} url={images[imageIndex]} name={name} />
      </div>
      {images.length > 1 && (
        <div className='mt-3 flex gap-3 overflow-x-auto p-1'>
          {images.map((url, index) => (
            <button
              type='button'
              key={url}
              className={`h-20 w-20 shrink-0 overflow-hidden bg-commerce-tint outline-offset-2 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-current ${imageIndex === index ? 'outline outline-2 outline-current' : 'opacity-60 hover:opacity-100'}`}
              aria-label={`View image ${index + 1}`}
              aria-pressed={imageIndex === index}
              data-commerce-control='thumbnail'
              onClick={() => setImageIndex(index)}
            >
              <ProductImage url={url} name='' />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * "Sale" when the verified SKU's compare-at price is above its price, or, before then, when some SKU's is. Renders
 * nothing otherwise.
 */
export function ProductDetailsBadge({ className }: ProductDetailsPartProps): ReactElement | null {
  const { price, product } = useProductDetailsInternal('ProductDetailsBadge');
  const onSale: boolean = price
    ? isOnSale(price.value?.value, price.compareAtValue?.value)
    : isProductOnSale(product);
  if (!onSale) return null;
  return (
    <div {...partProps('product-details-badge', className)}>
      <span className={saleBadgeClass}>Sale</span>
    </div>
  );
}

/** The product name as the page's H1. */
export function ProductDetailsTitle({ className }: ProductDetailsPartProps): ReactElement {
  const { name } = useProductDetailsInternal('ProductDetailsTitle');
  return (
    <div {...partProps('product-details-title', className)}>
      <h1 className='text-balance break-words text-3xl font-semibold leading-tight tracking-tight sm:text-4xl'>
        {name}
      </h1>
    </div>
  );
}

/**
 * The verified SKU's price and compare-at price, or the product's starting price. Before a SKU is verified, the
 * compare-at price shows only when it belongs to the cheapest SKUs, so it never pairs prices from different SKUs.
 */
export function ProductDetailsPrice({ className }: ProductDetailsPartProps): ReactElement {
  const { price, product } = useProductDetailsInternal('ProductDetailsPrice');
  const { config } = useCommerce();
  const money = useMoney();
  let compareAt: string | null = null;
  if (price?.compareAtValue?.value != null && isOnSale(price.value?.value, price.compareAtValue.value))
    compareAt = money(price.compareAtValue.value, price.compareAtValue.currencyCode ?? config.currencyCode);
  else if (!price) {
    const starting: number | null = getStartingCompareAt(product);
    if (starting !== null) compareAt = money(starting);
  }
  return (
    // The flex layout is inside the part, so it cannot outrank host classes on the outer element.
    <div {...partProps('product-details-price', className)}>
      <div
        aria-live='polite'
        className='flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xl font-medium tabular-nums'
        data-testid='product-price'
      >
        {price?.value?.value != null
          ? money(price.value.value, price.value.currencyCode ?? config.currencyCode)
          : product.priceRange?.min != null
            ? `From ${money(product.priceRange.min)}`
            : 'Price unavailable'}
        {compareAt && (
          <>
            <span className='sr-only'>Was</span>
            <del className='text-base font-normal text-commerce-muted'>{compareAt}</del>
          </>
        )}
      </div>
    </div>
  );
}

/** The verified SKU's description, or the product's. */
export function ProductDetailsDescription({ className }: ProductDetailsPartProps): ReactElement {
  const { selectedSku, product } = useProductDetailsInternal('ProductDetailsDescription');
  return (
    <div {...partProps('product-details-description', className)}>
      <p className='whitespace-pre-line text-base leading-7 text-commerce-muted'>
        {selectedSku?.description ?? product.description}
      </p>
    </div>
  );
}
