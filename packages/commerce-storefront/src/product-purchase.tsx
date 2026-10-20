import { type ComponentProps, type ReactElement, type ReactNode, useId } from 'react';
import { message } from './api';
import { AddToCart, type AddToCartLabelState, isSoldOut, quantityProblem } from './cart';
import { getAvailableInventoryQuantity, type SKU } from './catalog-model';
import { buttonClass, errorActionClass, errorNoticeClass, inputClass } from './class-names';
import { useCommerce, useMoney } from './commerce-provider';
import { type PartLabel, partProps, renderLabel } from './part';
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

/** Above this many values, buttons wrap into a wall, so the option is a select. */
const maxChoiceButtons: number = 8;

/** Lowercases a label for use mid-sentence, leaving acronyms alone: "Size" becomes "size", "US Size" stays. */
const inSentence = (label: string): string =>
  label.replace(/^[A-Z](?=[a-z])/, (first) => first.toLowerCase());

/** The packaged purchase area: options, status, quantity, add to cart, and availability. */
export function ProductDetailsPurchase({ className }: ProductDetailsPartProps): ReactElement {
  const { attributes, skuOptions } = useProductDetailsInternal('ProductDetailsPurchase');
  // The status message describes the selection. Its -16px margin collapses with the 24px above to 8px.
  const belowOptions: string | undefined = attributes.length || skuOptions.length ? '-mt-4' : undefined;
  // `space-y-6` styles the children, not this element, so host display, gap and grid classes here still apply.
  return (
    <div {...partProps('product-details-purchase', 'space-y-6', className)}>
      <OptionControls />
      <ProductDetailsPurchaseStatus className={belowOptions} />
      <div className='flex items-start gap-3'>
        <ProductDetailsQuantity />
        <ProductDetailsAddToCart className='min-w-0 flex-1' />
      </div>
      <ProductDetailsAvailability className='-mt-3' />
    </div>
  );
}

/** A control for every product attribute, or the SKU list for products without attributes. */
export function ProductDetailsOptions({ className }: ProductDetailsPartProps): ReactElement | null {
  const { attributes, skuOptions } = useProductDetailsInternal('ProductDetailsOptions');
  if (attributes.length === 0 && skuOptions.length === 0) return null;
  return (
    <div {...partProps('product-details-options', 'space-y-6', className)}>
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

interface Choice {
  value: string;
  label: string;
  soldOut: boolean;
  swatch: string | null;
}

// The radio sits invisibly over each choice; `peer-*` variants style the visible sibling from its state.
const choiceButtonClass: string =
  'inline-flex min-h-11 min-w-12 items-center justify-center rounded-lg border border-commerce-edge px-4 text-sm font-medium transition-colors group-hover:border-current peer-checked:border-commerce-accent peer-checked:bg-commerce-accent peer-checked:text-commerce-on-accent peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-commerce-accent';
// The checked outline is offset from the swatch, so it shows on any page and around any swatch color.
const swatchClass: string =
  'relative block h-9 w-9 overflow-hidden rounded-full border border-commerce-edge peer-checked:outline peer-checked:outline-2 peer-checked:outline-offset-2 peer-checked:outline-commerce-accent peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-current';

/**
 * One option as buttons (radios), swatches when every value has one, or a select for long lists. Sold-out values are
 * crossed out but stay selectable, so the shopper can change any option in any order.
 */
function ChoiceGroup({
  label,
  selected,
  choices,
  missing,
  onSelect,
}: {
  label: string;
  selected: string;
  choices: Choice[];
  missing: boolean;
  onSelect: (value: string) => void;
}): ReactElement {
  const name = useId();
  const errorId = useId();
  const error: ReactNode = missing && (
    <p id={errorId} className='mt-2 inline-block rounded bg-red-50 px-2 py-1 text-sm text-red-800'>
      Select {inSentence(label)}.
    </p>
  );
  if (choices.length > maxChoiceButtons)
    return (
      <fieldset>
        <legend className='mb-2 text-sm font-medium'>{label}</legend>
        <Select
          aria-label={label}
          aria-invalid={missing || undefined}
          aria-describedby={missing ? errorId : undefined}
          value={selected}
          onChange={(event) => onSelect(event.target.value)}
        >
          <option value=''>Select {inSentence(label)}</option>
          {choices.map((choice) => (
            <option key={choice.value} value={choice.value}>
              {choice.soldOut ? `${choice.label} (sold out)` : choice.label}
            </option>
          ))}
        </Select>
        {error}
      </fieldset>
    );
  const swatches: boolean = choices.every((choice) => choice.swatch);
  const selectedLabel: string | undefined = choices.find((choice) => choice.value === selected)?.label;
  return (
    <fieldset aria-describedby={missing ? errorId : undefined}>
      <legend className='mb-2 flex gap-2 text-sm font-medium'>
        {label}
        {selectedLabel && <span className='font-normal text-commerce-muted'>{selectedLabel}</span>}
      </legend>
      <div className={`flex flex-wrap ${swatches ? 'gap-3' : 'gap-2'}`}>
        {choices.map((choice) => (
          <label
            key={choice.value}
            className='group relative cursor-pointer'
            title={swatches ? `${choice.label}${choice.soldOut ? ', sold out' : ''}` : undefined}
          >
            <input
              type='radio'
              className='peer absolute inset-0 z-10 m-0 cursor-pointer opacity-0'
              name={name}
              value={choice.value}
              checked={choice.value === selected}
              aria-invalid={missing || undefined}
              aria-label={choice.soldOut ? `${choice.label}, sold out` : undefined}
              data-commerce-control='choice'
              onChange={() => onSelect(choice.value)}
            />
            {swatches ? (
              <span
                className={`${swatchClass} ${choice.soldOut ? 'opacity-50' : ''}`}
                style={{ background: choice.swatch ?? undefined }}
              >
                {choice.soldOut && (
                  <span
                    aria-hidden='true'
                    className='absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 rotate-45 bg-current'
                  />
                )}
                <span className='sr-only'>{choice.label}</span>
              </span>
            ) : (
              <span
                className={`${choiceButtonClass} ${choice.soldOut ? 'text-commerce-muted line-through decoration-1' : ''}`}
              >
                {choice.label}
              </span>
            )}
          </label>
        ))}
      </div>
      {error}
    </fieldset>
  );
}

function SkuOption(): ReactElement {
  const { skuOptions, explicitSkuId, selectSku, showMissing } =
    useProductDetailsInternal('ProductDetailsOptions');
  useSkuOptionRegistration();
  const missing: boolean = showMissing && !explicitSkuId;
  return (
    <div {...partProps('product-details-sku-option')} data-commerce-missing={missing || undefined}>
      <ChoiceGroup
        label='Option'
        selected={explicitSkuId}
        missing={missing}
        onSelect={selectSku}
        choices={skuOptions.map((sku: SKU) => ({
          value: sku.id ?? '',
          label: sku.label?.trim() || sku.name?.trim() || '',
          soldOut: isSoldOut(getAvailableInventoryQuantity(sku)),
          swatch: null,
        }))}
      />
    </div>
  );
}

export interface ProductDetailsOptionProps extends ProductDetailsPartProps {
  /** The attribute `name`, such as `color`. Renders nothing when the product has no such attribute. */
  attribute: string;
}

/**
 * One product attribute: buttons, swatches when the provider's `getSwatch` gives every value one, or a select for
 * more than eight values. Use `useProductDetailsOption` for other custom controls.
 */
export function ProductDetailsOption({
  attribute,
  className,
}: ProductDetailsOptionProps): ReactElement | null {
  const option = useProductDetailsOption(attribute);
  if (!option) return null;
  return (
    <div
      {...partProps('product-details-option', className)}
      data-commerce-attribute={option.name}
      data-commerce-missing={option.missing || undefined}
    >
      <ChoiceGroup
        label={option.label}
        selected={option.selected ?? ''}
        missing={option.missing}
        onSelect={(value) => option.select(value || null)}
        choices={option.values.map((value) => ({
          value: value.name,
          label: value.label,
          soldOut: value.soldOut,
          swatch: value.swatch,
        }))}
      />
    </div>
  );
}

/**
 * The single message explaining why the selection is not purchasable. Renders nothing when ready, or before every
 * option is chosen, when the add button names the next one.
 */
export function ProductDetailsPurchaseStatus({ className }: ProductDetailsPartProps): ReactElement | null {
  const { status, variantError, retryVariant } = useProductDetailsInternal('ProductDetailsPurchaseStatus');
  let content: ReactElement;
  switch (status) {
    case 'ready':
    case 'incomplete':
      return null;
    case 'variant-error':
      content = (
        <div role='alert' className={errorNoticeClass}>
          <p>{message(variantError)}</p>
          <button type='button' className={errorActionClass} onClick={retryVariant}>
            Retry availability
          </button>
        </div>
      );
      break;
    case 'unavailable':
      content = (
        <p role='status' className={errorNoticeClass}>
          {disabledReasons[status]}
        </p>
      );
      break;
    case 'not-purchasable':
      content = <p className='text-sm text-commerce-muted'>{disabledReasons[status]}</p>;
      break;
    case 'checking':
      content = (
        <p role='status' className='text-sm text-commerce-muted'>
          {disabledReasons[status]}
        </p>
      );
      break;
  }
  // No default case: a new status leaves `content` unassigned, which TypeScript reports.
  return <div {...partProps('product-details-purchase-status', className)}>{content}</div>;
}

/** Stock for the verified SKU. Renders nothing until a SKU is verified. */
export function ProductDetailsAvailability({ className }: ProductDetailsPartProps): ReactElement | null {
  const { selectedSku, availableQuantity } = useProductDetailsInternal('ProductDetailsAvailability');
  if (!selectedSku) return null;
  return (
    <div {...partProps('product-details-availability', className)}>
      <p className='text-sm text-commerce-muted' aria-live='polite'>
        {availableQuantity === null
          ? 'Available to order'
          : isSoldOut(availableQuantity)
            ? 'This variant is out of stock'
            : `${availableQuantity} available`}
      </p>
    </div>
  );
}

// Transparent, so the stepper reads over any host background.
const stepperButtonClass: string =
  'inline-flex min-h-11 min-w-10 items-center justify-center rounded-lg transition-colors hover:bg-commerce-tint focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-current disabled:cursor-not-allowed disabled:text-commerce-muted disabled:hover:bg-transparent';

function StepperIcon({ plus }: { plus?: boolean }): ReactElement {
  return (
    <svg aria-hidden='true' viewBox='0 0 16 16' className='h-4 w-4'>
      <path
        d={plus ? 'M3.5 8h9M8 3.5v9' : 'M3.5 8h9'}
        fill='none'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
    </svg>
  );
}

/**
 * A quantity stepper, capped at the verified SKU's stock, with a message when a typed quantity cannot be added.
 * Disabled while the verified SKU is sold out.
 */
export function ProductDetailsQuantity({ className }: ProductDetailsPartProps): ReactElement {
  const { selectedSku, availableQuantity, quantity, setQuantity, name } =
    useProductDetailsInternal('ProductDetailsQuantity');
  const id = useId();
  const problemId = useId();
  const soldOut: boolean = !!selectedSku && isSoldOut(availableQuantity);
  const max: number | null =
    selectedSku && availableQuantity !== null && availableQuantity > 0 ? availableQuantity : null;
  // A sold-out SKU has no quantity to fix; its availability and button say so.
  const problem: string | null = soldOut ? null : quantityProblem(quantity, max);
  const current: number = Number.isInteger(quantity) ? quantity : 1;
  return (
    <div {...partProps('product-details-quantity', className)}>
      <label htmlFor={id} className='sr-only'>
        Quantity
      </label>
      <div className='inline-flex items-center rounded-lg border border-commerce-edge'>
        <button
          type='button'
          className={stepperButtonClass}
          aria-label={`Decrease quantity of ${name}`}
          data-commerce-control='decrease'
          disabled={soldOut || current <= 1}
          onClick={() => setQuantity(current - 1)}
        >
          <StepperIcon />
        </button>
        <input
          id={id}
          type='number'
          min={1}
          max={max ?? undefined}
          step={1}
          disabled={soldOut}
          className='min-h-11 w-10 appearance-none bg-transparent text-center text-sm tabular-nums [-moz-appearance:textfield] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-current disabled:text-commerce-muted [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
          value={Number.isNaN(quantity) ? '' : quantity}
          aria-invalid={problem ? true : undefined}
          aria-describedby={problem ? problemId : undefined}
          onChange={(event) => setQuantity(event.target.valueAsNumber)}
        />
        <button
          type='button'
          className={stepperButtonClass}
          aria-label={`Increase quantity of ${name}`}
          data-commerce-control='increase'
          disabled={soldOut || (max !== null && current >= max)}
          onClick={() => setQuantity(current + 1)}
        >
          <StepperIcon plus />
        </button>
      </div>
      {problem && (
        <p id={problemId} className={`mt-2 ${errorNoticeClass}`}>
          {problem}
        </p>
      )}
    </div>
  );
}

export interface ProductDetailsAddToCartProps extends ProductDetailsPartProps {
  /** Replaces the button label. A function receives `busy` and `soldOut`; the button keeps its rules either way. */
  children?: PartLabel<AddToCartLabelState>;
}

/**
 * Adds the verified SKU and quantity, labeled with the total, such as "Add to cart · $64.00". Until every option is
 * chosen it names the next one, such as "Select size", and pressing it marks the missing options and focuses the
 * first. While the selection is checked or unavailable it is disabled, and its accessible description says why.
 */
export function ProductDetailsAddToCart({ className, children }: ProductDetailsAddToCartProps): ReactElement {
  const { selectedSku, name, quantity, status, price, attributes, selections, requestMissing } =
    useProductDetailsInternal('ProductDetailsAddToCart');
  const { config } = useCommerce();
  const money = useMoney();
  const reasonId = useId();
  if (selectedSku) {
    const unit: number | null | undefined = price?.value?.value;
    const total: string | null =
      unit != null
        ? money(
            unit * (Number.isInteger(quantity) && quantity > 0 ? quantity : 1),
            price?.value?.currencyCode ?? config.currencyCode,
          )
        : null;
    return (
      <div {...partProps('product-details-add-to-cart', className)}>
        <AddToCart
          sku={selectedSku}
          name={name}
          quantity={quantity}
          className={buttonClass}
          block
          label={total && `Add to cart · ${total}`}
          labelName={total ? `Add to cart, ${total}` : undefined}
        >
          {children}
        </AddToCart>
      </div>
    );
  }
  if (status === 'incomplete') {
    const next: string | undefined = attributes.find((_, index) => !selections[index])?.label;
    return (
      <div {...partProps('product-details-add-to-cart', className)}>
        <button
          type='button'
          className={`${buttonClass} w-full`}
          data-commerce-part='add-to-cart-button'
          onClick={requestMissing}
        >
          {renderLabel(
            children,
            { busy: false, soldOut: false },
            next ? `Select ${inSentence(next)}` : 'Select an option',
          )}
        </button>
      </div>
    );
  }
  return (
    <div {...partProps('product-details-add-to-cart', className)}>
      <button
        type='button'
        className={`${buttonClass} w-full`}
        disabled
        aria-describedby={reasonId}
        data-commerce-part='add-to-cart-button'
      >
        {renderLabel(children, { busy: false, soldOut: false }, 'Add to cart')}
      </button>
      <span id={reasonId} hidden>
        {status === 'ready' ? '' : disabledReasons[status]}
      </span>
    </div>
  );
}
