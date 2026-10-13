import type { ReactElement } from 'react';
import { message } from './api';
import { AddToCartButton, buttonClass, inputClass } from './cart';
import type { SKU } from './catalog-model';
import {
  cx,
  type ProductPartProps,
  type PurchaseStatus,
  useProductDetailsInternal,
  useProductOption,
  useSkuOptionRegistration,
} from './product-details-context';

const disabledReasons: Record<Exclude<PurchaseStatus, 'ready'>, string> = {
  incomplete: 'Select all options to add this item to your cart.',
  checking: 'Checking this variant…',
  'variant-error': 'Availability for this selection could not be checked.',
  unavailable: 'This combination is unavailable. Choose different options.',
  'not-purchasable': 'This product is not currently available to purchase.',
};

/** The packaged purchase area: options, status, availability, quantity, and add to cart. */
export function ProductPurchase({ className }: ProductPartProps): ReactElement {
  useProductDetailsInternal('ProductPurchase');
  return (
    <div className={cx('space-y-6', className)}>
      <ProductOptions />
      <ProductPurchaseStatus />
      <ProductAvailability />
      <ProductQuantity />
      <ProductAddToCart />
    </div>
  );
}

/** A select for every product attribute, or the SKU list for products without attributes. */
export function ProductOptions({ className }: ProductPartProps): ReactElement | null {
  const { attributes, skuOptions } = useProductDetailsInternal('ProductOptions');
  if (attributes.length === 0 && skuOptions.length === 0) return null;
  return (
    <div className={cx('space-y-6', className)}>
      {attributes.map((attribute) => (
        <ProductOption key={attribute.id || attribute.name} attribute={attribute.name} />
      ))}
      {skuOptions.length > 0 && <SkuOption />}
    </div>
  );
}

function SkuOption(): ReactElement {
  const { fieldId, skuOptions, explicitSkuId, selectSku } = useProductDetailsInternal('ProductOptions');
  useSkuOptionRegistration();
  return (
    <div>
      <label htmlFor={`${fieldId}-sku-option`} className='mb-2 block font-medium'>
        Option
      </label>
      <select
        id={`${fieldId}-sku-option`}
        className={`${inputClass} w-full`}
        value={explicitSkuId}
        onChange={(event) => selectSku(event.target.value)}
      >
        <option value=''>Select an option</option>
        {skuOptions.map((sku: SKU) => (
          <option key={sku.id} value={sku.id ?? ''}>
            {sku.label?.trim() || sku.name?.trim()}
          </option>
        ))}
      </select>
    </div>
  );
}

export interface ProductOptionProps extends ProductPartProps {
  /** The attribute `name`, such as `color`. Renders nothing when the product has no such attribute. */
  attribute: string;
}

/** A select for one product attribute. Use `useProductOption` for swatches or other custom controls. */
export function ProductOption({ attribute, className }: ProductOptionProps): ReactElement | null {
  const option = useProductOption(attribute);
  if (!option) return null;
  return (
    <fieldset className={className}>
      <legend className='mb-2 font-medium'>{option.label}</legend>
      <select
        className={`${inputClass} w-full`}
        aria-label={option.label}
        value={option.selected ?? ''}
        onChange={(event) => option.select(event.target.value || null)}
      >
        <option value=''>Select {option.label.toLowerCase()}</option>
        {option.values.map((value) => (
          <option key={value.name} value={value.name}>
            {value.label}
          </option>
        ))}
      </select>
    </fieldset>
  );
}

/** The single message explaining why the selection is not yet purchasable. Renders nothing when ready. */
export function ProductPurchaseStatus({ className }: ProductPartProps): ReactElement | null {
  const { status, variantError, retryVariant } = useProductDetailsInternal('ProductPurchaseStatus');
  switch (status) {
    case 'ready':
      return null;
    case 'variant-error':
      return (
        <div role='alert' className={cx('text-red-700', className)}>
          <p>{message(variantError)}</p>
          <button type='button' className='min-h-11 bg-white text-red-700 underline' onClick={retryVariant}>
            Retry availability
          </button>
        </div>
      );
    case 'unavailable':
      return (
        <p role='status' className={cx('text-sm text-red-700', className)}>
          {disabledReasons[status]}
        </p>
      );
    case 'not-purchasable':
      return <p className={cx('text-sm', className)}>{disabledReasons[status]}</p>;
    case 'checking':
      return (
        <p role='status' className={className}>
          {disabledReasons[status]}
        </p>
      );
    case 'incomplete':
      return (
        <p role='status' className={cx('text-sm', className)}>
          {disabledReasons[status]}
        </p>
      );
  }
}

/** Stock for the verified SKU. Renders nothing until a SKU is verified. */
export function ProductAvailability({ className }: ProductPartProps): ReactElement | null {
  const { selectedSku, availableQuantity } = useProductDetailsInternal('ProductAvailability');
  if (!selectedSku) return null;
  return (
    <p className={cx('text-sm', className)} aria-live='polite'>
      {availableQuantity === null
        ? 'Available to order'
        : availableQuantity === 0
          ? 'This variant is out of stock'
          : `${availableQuantity} available`}
    </p>
  );
}

/** Quantity for the verified SKU. Renders nothing until a SKU is verified. */
export function ProductQuantity({ className }: ProductPartProps): ReactElement | null {
  const { fieldId, selectedSku, availableQuantity, quantity, setQuantity } =
    useProductDetailsInternal('ProductQuantity');
  if (!selectedSku) return null;
  return (
    <div className={className}>
      <label htmlFor={`${fieldId}-quantity`} className='mb-2 block font-medium'>
        Quantity
      </label>
      <input
        id={`${fieldId}-quantity`}
        type='number'
        min={1}
        max={availableQuantity ?? undefined}
        step={1}
        className={`${inputClass} w-28`}
        value={Number.isNaN(quantity) ? '' : quantity}
        onChange={(event) => setQuantity(event.target.valueAsNumber)}
      />
    </div>
  );
}

/** Adds the verified SKU and quantity. While disabled, its accessible description says why. */
export function ProductAddToCart({ className }: ProductPartProps): ReactElement {
  const { fieldId, selectedSku, name, quantity, status } = useProductDetailsInternal('ProductAddToCart');
  return (
    <div className={className}>
      {selectedSku ? (
        <AddToCartButton sku={selectedSku} name={name} quantity={quantity} />
      ) : (
        <>
          <button
            type='button'
            className={`${buttonClass} w-full`}
            disabled
            aria-describedby={`${fieldId}-purchase-reason`}
          >
            Add to cart
          </button>
          <span id={`${fieldId}-purchase-reason`} hidden>
            {status === 'ready' ? '' : disabledReasons[status]}
          </span>
        </>
      )}
    </div>
  );
}
