import { type ComponentProps, type ReactElement, useId } from 'react';
import { message } from './api';
import { AddToCartButton, buttonClass, inputClass, quantityProblem } from './cart';
import type { SKU } from './catalog-model';
import { partClass } from './part';
import {
  type ProductDetailsPartProps,
  type ProductDetailsStatus,
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

/** The packaged purchase area: options, status, availability, quantity, and add to cart. */
export function ProductDetailsPurchase({ className }: ProductDetailsPartProps): ReactElement {
  const { attributes, skuOptions } = useProductDetailsInternal('ProductDetailsPurchase');
  // The status and stock messages describe the selection. Their -16px margin collapses with the 24px above to 8px.
  const belowOptions: string | undefined = attributes.length || skuOptions.length ? '-mt-4' : undefined;
  // `space-y-6` styles the children, not this element, so host display, gap and grid classes here still apply.
  return (
    <div className={partClass('space-y-6', className)}>
      <OptionControls />
      <ProductDetailsPurchaseStatus className={belowOptions} />
      <ProductDetailsAvailability className={belowOptions} />
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

// Unwrapped so the packaged purchase area spaces the controls with its other parts. Each control's outer element
// is a part, which the CSS reset skips, so the spacing margin applies to it.
function OptionControls(): ReactElement {
  const { attributes, skuOptions } = useProductDetailsInternal('ProductDetailsOptions');
  return (
    <>
      {attributes.map((attribute) => (
        <ProductDetailsOption key={attribute.id || attribute.name} attribute={attribute.name} />
      ))}
      {skuOptions.length > 0 && <SkuOption />}
    </>
  );
}

// The native arrow sits against the border and ignores padding, so draw our own 12px in from the edge.
function Select({ children, ...props }: Omit<ComponentProps<'select'>, 'className'>): ReactElement {
  return (
    <div className='relative'>
      <select className={`${inputClass} w-full appearance-none pr-10`} {...props}>
        {children}
      </select>
      <svg
        aria-hidden='true'
        viewBox='0 0 16 16'
        className='pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600'
      >
        <path
          d='M4 6l4 4 4-4'
          fill='none'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    </div>
  );
}

function SkuOption(): ReactElement {
  const { skuOptions, explicitSkuId, selectSku } = useProductDetailsInternal('ProductDetailsOptions');
  const id = useId();
  useSkuOptionRegistration();
  return (
    <div className={partClass()}>
      <label htmlFor={id} className='mb-2 block font-medium'>
        Option
      </label>
      <Select id={id} value={explicitSkuId} onChange={(event) => selectSku(event.target.value)}>
        <option value=''>Select an option</option>
        {skuOptions.map((sku: SKU) => (
          <option key={sku.id} value={sku.id ?? ''}>
            {sku.label?.trim() || sku.name?.trim()}
          </option>
        ))}
      </Select>
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
        <Select
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
        </Select>
      </fieldset>
    </div>
  );
}

/** The single message explaining why the selection is not yet purchasable. Renders nothing when ready. */
export function ProductDetailsPurchaseStatus({ className }: ProductDetailsPartProps): ReactElement | null {
  const { status, variantError, retryVariant } = useProductDetailsInternal('ProductDetailsPurchaseStatus');
  let content: ReactElement;
  switch (status) {
    case 'ready':
      return null;
    case 'variant-error':
      content = (
        <div role='alert' className='text-red-700'>
          <p>{message(variantError)}</p>
          <button type='button' className='min-h-11 bg-white text-red-700 underline' onClick={retryVariant}>
            Retry availability
          </button>
        </div>
      );
      break;
    case 'unavailable':
      content = (
        <p role='status' className='text-sm text-red-700'>
          {disabledReasons[status]}
        </p>
      );
      break;
    case 'not-purchasable':
      content = <p className='text-sm'>{disabledReasons[status]}</p>;
      break;
    case 'incomplete':
    case 'checking':
      content = (
        <p role='status' className='text-sm'>
          {disabledReasons[status]}
        </p>
      );
      break;
  }
  // No default case: a new status leaves `content` unassigned, which TypeScript reports.
  return <div className={partClass(className)}>{content}</div>;
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

/** Quantity for the verified SKU, with a message when it cannot be added. Renders nothing until a SKU is verified. */
export function ProductDetailsQuantity({ className }: ProductDetailsPartProps): ReactElement | null {
  const { selectedSku, availableQuantity, quantity, setQuantity } =
    useProductDetailsInternal('ProductDetailsQuantity');
  const id = useId();
  const problemId = useId();
  if (!selectedSku) return null;
  // A sold-out SKU has no quantity to fix; its availability and button say so.
  const problem: string | null =
    availableQuantity === 0 ? null : quantityProblem(quantity, availableQuantity);
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
        aria-invalid={problem ? true : undefined}
        aria-describedby={problem ? problemId : undefined}
        onChange={(event) => setQuantity(event.target.valueAsNumber)}
      />
      {problem && (
        <p id={problemId} className='mt-2 text-sm text-red-700'>
          {problem}
        </p>
      )}
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
