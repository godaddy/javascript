import type { ReactElement } from 'react';
import { Link } from 'react-router';
import { money } from './api';
import { useCommerce } from './commerce-provider';
import { partClass } from './part';
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
      <ProductDetailsBackLink className='mb-8 sm:mb-10' />
      <div className='grid items-start gap-8 lg:grid-cols-12 lg:gap-12'>
        <ProductDetailsGallery className='min-w-0 lg:col-span-7' />
        <div className='min-w-0 lg:col-span-5 lg:py-4'>
          <ProductDetailsTitle />
          <ProductDetailsPrice className='mt-6' />
          <ProductDetailsDescription className='my-8' />
          <ProductDetailsPurchase className='border-t border-neutral-200 pt-8' />
        </div>
      </div>
    </ProductDetailsRoot>
  );
}

export function ProductDetailsBackLink({ className }: ProductDetailsPartProps): ReactElement {
  useProductDetailsInternal('ProductDetailsBackLink');
  const { config } = useCommerce();
  return (
    <div className={partClass(className)}>
      <Link
        className='inline-flex min-h-11 items-center text-sm text-inherit underline underline-offset-4 focus-visible:outline focus-visible:outline-2'
        to={config.catalogPath}
      >
        ← Back to shop
      </Link>
    </div>
  );
}

/** Main image with thumbnails; the selected SKU's images replace the product's when present. */
export function ProductDetailsGallery({ className }: ProductDetailsPartProps): ReactElement {
  const { images, imageIndex, setImageIndex, name } = useProductDetailsInternal('ProductDetailsGallery');
  return (
    <div className={partClass(className)}>
      <div className='aspect-square overflow-hidden rounded-lg'>
        <ProductImage key={images[imageIndex]} url={images[imageIndex]} name={name} />
      </div>
      {images.length > 1 && (
        <div className='mt-4 flex gap-3 overflow-x-auto'>
          {images.map((url, index) => (
            <button
              type='button'
              key={url}
              className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${imageIndex === index ? 'border-neutral-900' : 'border-transparent'}`}
              aria-label={`View image ${index + 1}`}
              aria-pressed={imageIndex === index}
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

/** The product name as the page's H1. */
export function ProductDetailsTitle({ className }: ProductDetailsPartProps): ReactElement {
  const { name } = useProductDetailsInternal('ProductDetailsTitle');
  return (
    <div className={partClass(className)}>
      <h1 className='break-words text-4xl font-semibold leading-tight sm:text-5xl'>{name}</h1>
    </div>
  );
}

/** The verified SKU's price and compare-at price, or the product's starting price. */
export function ProductDetailsPrice({ className }: ProductDetailsPartProps): ReactElement {
  const { price, product } = useProductDetailsInternal('ProductDetailsPrice');
  const { config } = useCommerce();
  return (
    <div
      aria-live='polite'
      className={partClass('flex flex-wrap items-baseline gap-x-3 gap-y-1 text-2xl font-medium', className)}
      data-testid='product-price'
    >
      {price?.value?.value != null
        ? money(price.value.value, price.value.currencyCode ?? config.currencyCode)
        : product.priceRange?.min != null
          ? `From ${money(product.priceRange.min, config.currencyCode)}`
          : 'Price unavailable'}
      {price?.compareAtValue?.value != null &&
        price.value?.value != null &&
        price.compareAtValue.value > price.value.value && (
          <del className='text-lg font-normal'>
            {money(price.compareAtValue.value, price.compareAtValue.currencyCode ?? config.currencyCode)}
          </del>
        )}
    </div>
  );
}

/** The verified SKU's description, or the product's. */
export function ProductDetailsDescription({ className }: ProductDetailsPartProps): ReactElement {
  const { selectedSku, product } = useProductDetailsInternal('ProductDetailsDescription');
  return (
    <div className={partClass(className)}>
      <p className='whitespace-pre-line text-base leading-7'>
        {selectedSku?.description ?? product.description}
      </p>
    </div>
  );
}
