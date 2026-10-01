import { useQuery } from '@tanstack/react-query';
import { type ReactElement, useId, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { message, money, request } from './api';
import { AddToCartButton, buttonClass, inputClass } from './cart';
import { ProductImage } from './catalog';
import {
  getAvailableInventoryQuantity,
  getImageUrls,
  getLabeledSkuOptions,
  getProductAttributes,
  getSingleMatchedSku,
  type SKU,
  type SkuGroupResult,
} from './catalog-model';
import { useCommerce } from './commerce-provider';
import { CommerceStatus, StorefrontSurface } from './storefront-surface';

export function ProductDetails(): ReactElement {
  const { productId = '' } = useParams();
  const { connection } = useCommerce();
  return (
    <StorefrontSurface>
      {connection === 'ready' ? (
        <ProductDetailsContent key={productId} productId={productId} />
      ) : (
        <CommerceStatus />
      )}
    </StorefrontSurface>
  );
}

function ProductDetailsContent({ productId }: { productId: string }): ReactElement {
  const { config } = useCommerce();
  const fieldId = useId();
  const [params, setParams] = useSearchParams();
  const [quantity, setQuantity] = useState<number>(1);
  const [imageIndex, setImageIndex] = useState<number>(0);
  const product = useQuery({
    retry: false,
    queryKey: ['commerce', config.cartScope, 'product', productId],
    queryFn: ({ signal }) =>
      request<SkuGroupResult>(`/products/${encodeURIComponent(productId)}`, {
        signal,
        headers: { 'X-Commerce-Scope': config.cartScope },
      }),
  });
  const group = product.data?.skuGroup;
  const attributes = getProductAttributes(group);
  const skuOptions: SKU[] = getLabeledSkuOptions(group);
  const explicitSku: SKU | undefined = skuOptions.find((sku: SKU): boolean => sku.id === params.get('sku'));
  const selections: string[] = attributes.map((attribute) => params.get(`option.${attribute.name}`) ?? '');
  const complete: boolean =
    skuOptions.length > 0
      ? !!explicitSku
      : attributes.every((attribute, index) =>
          attribute.values.some((value) => value.name === selections[index]),
        );
  const selectionParams: URLSearchParams = new URLSearchParams();
  selections.filter(Boolean).forEach((value) => {
    selectionParams.append('attributeValues', value);
  });
  const matched = useQuery({
    retry: false,
    queryKey: ['commerce', config.cartScope, 'product-variants', productId, selections],
    queryFn: ({ signal }) =>
      request<SkuGroupResult>(`/products/${encodeURIComponent(productId)}?${selectionParams}`, {
        signal,
        headers: { 'X-Commerce-Scope': config.cartScope },
      }),
    enabled: !!group && attributes.length > 0 && complete,
  });
  const selectionVerified: boolean =
    complete &&
    product.isSuccess &&
    !product.isFetching &&
    (attributes.length === 0 || (matched.isSuccess && !matched.isFetching));
  const selectedSku: SKU | null = selectionVerified
    ? (explicitSku ?? getSingleMatchedSku(attributes.length ? matched.data?.skuGroup : group))
    : null;
  const skuId: string | null = selectedSku?.id ?? null;
  const skuPrice = selectedSku?.prices?.edges?.find((edge) => edge?.node?.value)?.node;
  const selectedImages: string[] = getImageUrls(selectedSku);
  const images: string[] = [...new Set(selectedImages.length ? selectedImages : getImageUrls(group))];
  const available: number | null = getAvailableInventoryQuantity(selectedSku);
  const name: string = group?.label ?? group?.name ?? 'Product';
  const selectOption = (attribute: string, value: string): void => {
    const next: URLSearchParams = new URLSearchParams(params);
    if (value) next.set(`option.${attribute}`, value);
    else next.delete(`option.${attribute}`);
    setParams(next);
    setQuantity(1);
    setImageIndex(0);
  };
  if (product.isPending) return <p role='status'>Loading product…</p>;
  if (product.isError)
    return (
      <div role='alert'>
        <h1 className='text-2xl font-semibold'>Product unavailable</h1>
        <p className='my-4 text-red-700'>{message(product.error)}</p>
        <button type='button' className={buttonClass} onClick={() => void product.refetch()}>
          Retry product
        </button>
      </div>
    );
  if (!group)
    return (
      <div>
        <h1 className='text-2xl font-semibold'>Product not found</h1>
        <Link className={`${buttonClass} mt-4`} to={config.catalogPath}>
          Back to shop
        </Link>
      </div>
    );
  return (
    <article>
      <Link
        className='mb-8 inline-flex min-h-11 items-center text-sm text-inherit underline underline-offset-4 focus-visible:outline focus-visible:outline-2 sm:mb-10'
        to={config.catalogPath}
      >
        ← Back to shop
      </Link>
      <div className='grid items-start gap-8 lg:grid-cols-12 lg:gap-12'>
        <div className='min-w-0 lg:col-span-7'>
          <div className='aspect-square overflow-hidden rounded-lg'>
            <ProductImage
              key={images[imageIndex] ?? images[0]}
              url={images[imageIndex] ?? images[0]}
              name={name}
            />
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
        <div className='min-w-0 lg:col-span-5 lg:py-4'>
          <h1 className='break-words text-4xl font-semibold leading-tight sm:text-5xl'>{name}</h1>
          <div
            aria-live='polite'
            className='mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-2xl font-medium'
            data-testid='product-price'
          >
            {skuPrice?.value?.value != null
              ? money(skuPrice.value.value, skuPrice.value.currencyCode ?? config.currencyCode)
              : group.priceRange?.min != null
                ? `From ${money(group.priceRange.min, config.currencyCode)}`
                : 'Price unavailable'}
            {skuPrice?.compareAtValue?.value != null &&
              skuPrice.value?.value != null &&
              skuPrice.compareAtValue.value > skuPrice.value.value && (
                <del className='text-lg font-normal'>
                  {money(
                    skuPrice.compareAtValue.value,
                    skuPrice.compareAtValue.currencyCode ?? config.currencyCode,
                  )}
                </del>
              )}
          </div>
          <p className='my-8 whitespace-pre-line text-base leading-7'>
            {selectedSku?.description ?? group.description}
          </p>
          <div className='space-y-6 border-t border-neutral-200 pt-8'>
            {attributes.map((attribute, index) => (
              <fieldset key={attribute.id || attribute.name}>
                <legend className='mb-2 font-medium'>{attribute.label}</legend>
                <select
                  className={`${inputClass} w-full`}
                  aria-label={attribute.label}
                  value={selections[index]}
                  onChange={(event) => selectOption(attribute.name, event.target.value)}
                >
                  <option value=''>Select {attribute.label.toLowerCase()}</option>
                  {attribute.values.map((value) => (
                    <option key={value.id || value.name} value={value.name}>
                      {value.label}
                    </option>
                  ))}
                </select>
              </fieldset>
            ))}
            {skuOptions.length > 0 && (
              <div>
                <label htmlFor={`${fieldId}-sku-option`} className='mb-2 block font-medium'>
                  Option
                </label>
                <select
                  id={`${fieldId}-sku-option`}
                  className={`${inputClass} w-full`}
                  value={explicitSku?.id ?? ''}
                  onChange={(event) => {
                    const next: URLSearchParams = new URLSearchParams(params);
                    if (event.target.value) next.set('sku', event.target.value);
                    else next.delete('sku');
                    setParams(next);
                    setQuantity(1);
                    setImageIndex(0);
                  }}
                >
                  <option value=''>Select an option</option>
                  {skuOptions.map((sku: SKU) => (
                    <option key={sku.id} value={sku.id ?? ''}>
                      {sku.label?.trim() || sku.name?.trim()}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {matched.isError ? (
              <div role='alert' className='text-red-700'>
                <p>{message(matched.error)}</p>
                <button
                  type='button'
                  className='min-h-11 bg-white text-red-700 underline'
                  onClick={() => {
                    if (matched.isError) void matched.refetch();
                  }}
                >
                  Retry availability
                </button>
              </div>
            ) : null}
            {!complete && (
              <p id={`${fieldId}-variant-guidance`} role='status' className='text-sm'>
                Select all options to add this item to your cart.
              </p>
            )}
            {selectionVerified && attributes.length > 0 && !skuId && (
              <p role='status' className='text-sm text-red-700'>
                This combination is unavailable. Choose different options.
              </p>
            )}
            {selectionVerified && attributes.length === 0 && !skuId && (
              <p className='text-sm'>This product is not currently available to purchase.</p>
            )}
            {complete && (product.isFetching || matched.isFetching) && (
              <p role='status'>Checking this variant…</p>
            )}
            {selectedSku && (
              <>
                <p className='text-sm' aria-live='polite'>
                  {available === null
                    ? 'Available to order'
                    : available === 0
                      ? 'This variant is out of stock'
                      : `${available} available`}
                </p>
                <div>
                  <label htmlFor={`${fieldId}-quantity`} className='mb-2 block font-medium'>
                    Quantity
                  </label>
                  <input
                    id={`${fieldId}-quantity`}
                    type='number'
                    min={1}
                    max={available ?? undefined}
                    step={1}
                    className={`${inputClass} w-28`}
                    value={Number.isNaN(quantity) ? '' : quantity}
                    onChange={(event) => setQuantity(event.target.valueAsNumber)}
                  />
                </div>
                <AddToCartButton sku={selectedSku} name={name} quantity={quantity} />
              </>
            )}
            {!selectedSku && (
              <button
                type='button'
                className={`${buttonClass} w-full`}
                disabled
                aria-describedby={!complete ? `${fieldId}-variant-guidance` : undefined}
              >
                Add to cart
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
