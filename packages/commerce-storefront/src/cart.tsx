import { type ReactElement, type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { useCart } from './cart-state';
import type { SKU } from './catalog-model';
import { getAvailableInventoryQuantity } from './catalog-model';
import { buttonClass, errorNoticeClass } from './class-names';
import { useCommerce } from './commerce-provider';
import { type PartLabel, renderLabel } from './part';
import { StorefrontSurface } from './storefront-surface';

export interface CartButtonProps {
  /**
   * Replaces the bag icon and count badge with a visible label. A function receives the item count. Keep the count in
   * the label.
   */
  children?: PartLabel<{ itemCount: number }>;
}

/**
 * Opens the cart drawer: a bag icon with a count badge that pops when the count changes. Its accessible name is
 * "Cart, 2 items". With `children`, a labeled button instead.
 */
export function CartButton({ children }: CartButtonProps = {}): ReactElement {
  const { setOpen, open, connection } = useCommerce();
  const { itemCount } = useCart();
  // Bumped on each change after the first render, so the badge remounts and replays its pop.
  const [bump, setBump] = useState<number>(0);
  const previous = useRef<number>(itemCount);
  useEffect(() => {
    if (previous.current !== itemCount) setBump((count) => count + 1);
    previous.current = itemCount;
  }, [itemCount]);
  const custom: ReactNode = renderLabel(children, { itemCount }, null);
  // Transparent, like the header it usually sits in, so it takes that header's text color.
  return (
    <StorefrontSurface className='commerce-inline'>
      <button
        type='button'
        className={`relative inline-flex min-h-11 items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors hover:bg-commerce-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current disabled:cursor-not-allowed disabled:text-commerce-muted disabled:hover:bg-transparent ${custom === null ? 'min-w-11' : 'px-4'}`}
        disabled={connection !== 'ready' && connection !== 'unbound'}
        aria-haspopup='dialog'
        aria-expanded={open}
        aria-label={custom === null ? `Cart, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}` : undefined}
        data-commerce-part='cart-button'
        onClick={() => setOpen(true)}
      >
        {custom ?? (
          <>
            <BagIcon />
            {itemCount > 0 && (
              <span
                key={bump}
                aria-hidden='true'
                className='absolute right-0 top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-commerce-accent px-1 text-[11px] font-semibold tabular-nums text-commerce-on-accent motion-safe:animate-commerce-pop'
              >
                {itemCount}
              </span>
            )}
          </>
        )}
      </button>
    </StorefrontSurface>
  );
}

function BagIcon(): ReactElement {
  return (
    <svg aria-hidden='true' viewBox='0 0 20 20' className='h-5 w-5 shrink-0'>
      <path
        d='M4.5 6.5h11l-.8 9.1a1.5 1.5 0 0 1-1.5 1.4H6.8a1.5 1.5 0 0 1-1.5-1.4L4.5 6.5ZM7.5 6.5V6a2.5 2.5 0 0 1 5 0v.5'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}

/** Whether tracked stock is used up. Oversold SKUs report a negative count. */
export const isSoldOut = (available: number | null): boolean => available !== null && available <= 0;

/** Why `quantity` cannot be added, or `null` when it can. `available` is `null` when stock is not tracked. */
export function quantityProblem(quantity: number, available: number | null): string | null {
  if (!Number.isInteger(quantity) || quantity < 1) return 'Enter a whole number of 1 or more.';
  if (available !== null && available > 0 && quantity > available) return `Only ${available} available.`;
  return null;
}

/** What an add-to-cart label can depend on. */
export interface AddToCartLabelState {
  /** The add is running. */
  readonly busy: boolean;
  /** Tracked stock is used up, so the button stays disabled. */
  readonly soldOut: boolean;
}

export interface AddToCartButtonProps {
  sku: SKU;
  name: string;
  quantity?: number;
  /** Replaces the label. A function receives `busy` and `soldOut`; the button keeps its rules either way. */
  children?: PartLabel<AddToCartLabelState>;
}

export function AddToCartButton(props: AddToCartButtonProps): ReactElement {
  return <AddToCart {...props} className={buttonClass} />;
}

/**
 * `AddToCartButton` with the package's button style chosen by the caller, such as the quieter card style. `block`
 * fills the container's width; the public button stays inline wherever a host places it.
 */
export function AddToCart({
  sku,
  name,
  quantity = 1,
  children,
  className,
  block = false,
  label,
  labelName,
}: AddToCartButtonProps & {
  className: string;
  block?: boolean;
  /** The package's own label while the button can add, in place of "Add to cart". */
  label?: ReactNode;
  /** The accessible name for `label`, when its text does not read well, such as "Add to cart, $64.00". */
  labelName?: string;
}): ReactElement {
  const { addItem, pending, hydrating, error, open, connection } = useCommerce();
  const [adding, setAdding] = useState<boolean>(false);
  const reasonId = useId();
  const available: number | null = getAvailableInventoryQuantity(sku);
  const soldOut: boolean = isSoldOut(available);
  // Sold out needs no description: the button says so.
  let reason: string | null = null;
  if (connection === 'unbound') reason = 'Connect a store to add items to the cart.';
  else if (connection === 'error') reason = 'The store could not be reached.';
  else if (connection !== 'ready') reason = 'Connecting to the store…';
  else if (!sku.id) reason = 'This item cannot be added to the cart.';
  else if (!soldOut) reason = hydrating ? 'Loading your cart…' : quantityProblem(quantity, available);
  const disabled: boolean = adding || soldOut || reason !== null;
  // Only while the package's own `label` shows; a host label is the name as it reads.
  const ownLabel: boolean =
    !!labelName && !soldOut && !adding && renderLabel(children, { busy: false, soldOut }, null) === null;
  async function handleAdd(): Promise<void> {
    if (disabled || pending || !sku.id) return;
    setAdding(true);
    try {
      await addItem({ skuId: sku.id, name, quantity });
    } finally {
      setAdding(false);
    }
  }
  return (
    <StorefrontSurface className={block ? '' : 'commerce-inline'}>
      <button
        type='button'
        className={`${className} w-full`}
        disabled={disabled}
        aria-disabled={disabled || pending}
        aria-busy={adding}
        aria-describedby={reason ? reasonId : undefined}
        aria-label={ownLabel ? labelName : undefined}
        data-commerce-part='add-to-cart-button'
        onClick={() => void handleAdd()}
      >
        {renderLabel(
          children,
          { busy: adding, soldOut },
          soldOut ? 'Out of stock' : adding ? 'Adding…' : (label ?? 'Add to cart'),
        )}
      </button>
      {reason && (
        <span id={reasonId} hidden>
          {reason}
        </span>
      )}
      {error && !open && (
        <p role='alert' className={`mt-3 ${errorNoticeClass}`}>
          {error}
        </p>
      )}
    </StorefrontSurface>
  );
}
