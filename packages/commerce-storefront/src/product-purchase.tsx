import { type ReactElement, type ReactNode, useId } from 'react';
import { message } from './api';
import { AddToCartButton, buttonClass, inputClass } from './cart';
import type { SKU } from './catalog-model';
import {
  type ProductDetailsPartProps,
  type ProductDetailsStatus,
  partClass,
  useProductDetailsInternal,
  useProductDetailsOption,
  useSkuOptionRegistration,
} from './product-details-context';

const disabledReasons: Record<Exclude<ProductDetailsStatus, 'ready'>, string> = {
  incomplete: 'Select all options to add this item to your cart.',
  checking: 'Checking this variant…',
  'variant-error': 'Availability for this selection could not be checked.',
  unavailable: 'This combination is unavailable. Choose different options.',
  'not-purchasable': 'This product is not currently available to purchase.',
};

// In 0.2.0 the purchase area's option fieldsets and text messages were bare <fieldset>/<p> children of
// `space-y-6`, and the package reset's `margin: 0` outranked that zero-specificity rule, so they had no gap.
// Their wrappers now take the gap, so the packaged layout cancels it on those parts to stay visually identical.
const flush = 'mb-0';

/** The packaged purchase area: options, status, availability, quantity, and add to cart. */
export function ProductDetailsPurchase({ className }: ProductDetailsPartProps): ReactElement {
  useProductDetailsInternal('ProductDetailsPurchase');
  return (
    <div className={partClass('space-y-6', className)}>
      <OptionControls />
      <PurchaseStatusMessage textClassName={flush} />
      <ProductDetailsAvailability className={flush} />
      <ProductDetailsQuantity />
      <ProductDetailsAddToCart />
    </div>
  );
}

/** A select for every product attribute, or the SKU list for products without attributes. */
export function ProductDetailsOptions({ className }: ProductDetailsPartProps): ReactElement | null {
  const { attributes, skuOptions } = useProductDetailsInternal('ProductDetailsOptions');
  if (attributes.length === 0 && skuOptions.length === 0) return null;
  return (
    <div className={partClass('space-y-6', className)}>
      <OptionControls />
    </div>
  );
}

// Unwrapped so the packaged layout keeps the controls as direct children of its own spacing container.
function OptionControls(): ReactElement {
  const { attributes, skuOptions } = useProductDetailsInternal('ProductDetailsOptions');
  return (
    <>
      {attributes.map((attribute) => (
        <ProductDetailsOption
          key={attribute.id || attribute.name}
          attribute={attribute.name}
          className={flush}
        />
      ))}
      {skuOptions.length > 0 && <SkuOption />}
    </>
  );
}

function SkuOption(): ReactElement {
  const { skuOptions, explicitSkuId, selectSku } = useProductDetailsInternal('ProductDetailsOptions');
  const id = useId();
  useSkuOptionRegistration();
  return (
    <div>
      <label htmlFor={id} className='mb-2 block font-medium'>
        Option
      </label>
      <select
        id={id}
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

export interface ProductDetailsOptionProps extends ProductDetailsPartProps {
  /** The attribute `name`, such as `color`. Renders nothing when the product has no such attribute. */
  attribute: string;
}

/** A select for one product attribute. Use `useProductDetailsOption` for swatches or other custom controls. */
export function ProductDetailsOption({
  attribute,
  className,
}: ProductDetailsOptionProps): ReactElement | null {
  const option = useProductDetailsOption(attribute);
  if (!option) return null;
  return (
    <div className={partClass(className)}>
      <fieldset>
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
    </div>
  );
}

/** The single message explaining why the selection is not yet purchasable. Renders nothing when ready. */
export function ProductDetailsPurchaseStatus({ className }: ProductDetailsPartProps): ReactElement | null {
  return <PurchaseStatusMessage className={className} />;
}

function PurchaseStatusMessage({
  className,
  textClassName,
}: ProductDetailsPartProps & { textClassName?: string }): ReactElement | null {
  const { status, variantError, retryVariant } = useProductDetailsInternal('ProductDetailsPurchaseStatus');
  const part = (children: ReactNode, partClassName?: string): ReactElement => (
    <div className={partClass(partClassName, className)}>{children}</div>
  );
  switch (status) {
    case 'ready':
      return null;
    case 'variant-error':
      return part(
        <div role='alert' className='text-red-700'>
          <p>{message(variantError)}</p>
          <button type='button' className='min-h-11 bg-white text-red-700 underline' onClick={retryVariant}>
            Retry availability
          </button>
        </div>,
      );
    case 'unavailable':
      return part(
        <p role='status' className='text-sm text-red-700'>
          {disabledReasons[status]}
        </p>,
        textClassName,
      );
    case 'not-purchasable':
      return part(<p className='text-sm'>{disabledReasons[status]}</p>, textClassName);
    case 'checking':
      return part(<p role='status'>{disabledReasons[status]}</p>, textClassName);
    case 'incomplete':
      return part(
        <p role='status' className='text-sm'>
          {disabledReasons[status]}
        </p>,
        textClassName,
      );
  }
}

/** Stock for the verified SKU. Renders nothing until a SKU is verified. */
export function ProductDetailsAvailability({ className }: ProductDetailsPartProps): ReactElement | null {
  const { selectedSku, availableQuantity } = useProductDetailsInternal('ProductDetailsAvailability');
  if (!selectedSku) return null;
  return (
    <div className={partClass(className)}>
      <p className='text-sm' aria-live='polite'>
        {availableQuantity === null
          ? 'Available to order'
          : availableQuantity === 0
            ? 'This variant is out of stock'
            : `${availableQuantity} available`}
      </p>
    </div>
  );
}

/** Quantity for the verified SKU. Renders nothing until a SKU is verified. */
export function ProductDetailsQuantity({ className }: ProductDetailsPartProps): ReactElement | null {
  const { selectedSku, availableQuantity, quantity, setQuantity } =
    useProductDetailsInternal('ProductDetailsQuantity');
  const id = useId();
  if (!selectedSku) return null;
  return (
    <div className={partClass(className)}>
      <label htmlFor={id} className='mb-2 block font-medium'>
        Quantity
      </label>
      <input
        id={id}
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
export function ProductDetailsAddToCart({ className }: ProductDetailsPartProps): ReactElement {
  const { selectedSku, name, quantity, status } = useProductDetailsInternal('ProductDetailsAddToCart');
  const reasonId = useId();
  return (
    <div className={partClass(className)}>
      {selectedSku ? (
        <AddToCartButton sku={selectedSku} name={name} quantity={quantity} />
      ) : (
        <>
          <button type='button' className={`${buttonClass} w-full`} disabled aria-describedby={reasonId}>
            Add to cart
          </button>
          <span id={reasonId} hidden>
            {status === 'ready' ? '' : disabledReasons[status]}
          </span>
        </>
      )}
    </div>
  );
}
