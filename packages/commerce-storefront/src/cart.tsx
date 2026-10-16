import { type ReactElement, useId, useState } from 'react';
import { useCart } from './cart-state';
import type { SKU } from './catalog-model';
import { getAvailableInventoryQuantity } from './catalog-model';
import { useCommerce } from './commerce-provider';
import { StorefrontSurface } from './storefront-surface';

export const buttonClass: string =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-commerce-accent px-5 py-2 text-sm font-semibold text-commerce-on-accent hover:bg-commerce-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-700 disabled:hover:bg-neutral-200';
export const inputClass: string =
  'min-h-11 rounded-lg border border-neutral-400 bg-white px-3 py-2 text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900';

export function CartButton(): ReactElement {
  const { setOpen, open, connection } = useCommerce();
  const { itemCount } = useCart();
  return (
    <StorefrontSurface className='commerce-inline'>
      <button
        type='button'
        className={buttonClass}
        disabled={connection !== 'ready' && connection !== 'unbound'}
        aria-haspopup='dialog'
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        Cart <span className='rounded-full bg-white px-2 py-0.5 text-xs text-neutral-900'>{itemCount}</span>
      </button>
    </StorefrontSurface>
  );
}

/** Why `quantity` cannot be added, or `null` when it can. `available` is `null` when stock is not tracked. */
export function quantityProblem(quantity: number, available: number | null): string | null {
  if (!Number.isInteger(quantity) || quantity < 1) return 'Enter a whole number of 1 or more.';
  if (available !== null && available > 0 && quantity > available) return `Only ${available} available.`;
  return null;
}

export function AddToCartButton({
  sku,
  name,
  quantity = 1,
}: {
  sku: SKU;
  name: string;
  quantity?: number;
}): ReactElement {
  const { addItem, pending, hydrating, error, open, connection } = useCommerce();
  const [adding, setAdding] = useState<boolean>(false);
  const reasonId = useId();
  const available: number | null = getAvailableInventoryQuantity(sku);
  // Sold out needs no description: the button says so.
  let reason: string | null = null;
  if (connection === 'unbound') reason = 'Connect a store to add items to the cart.';
  else if (connection !== 'ready') reason = 'Connecting to the store…';
  else if (!sku.id) reason = 'This item cannot be added to the cart.';
  else if (available !== 0) reason = hydrating ? 'Loading your cart…' : quantityProblem(quantity, available);
  const disabled: boolean = adding || available === 0 || reason !== null;
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
    <StorefrontSurface className='commerce-inline'>
      <button
        type='button'
        className={`${buttonClass} w-full`}
        disabled={disabled}
        aria-disabled={disabled || pending}
        aria-busy={adding}
        aria-describedby={reason ? reasonId : undefined}
        onClick={() => void handleAdd()}
      >
        {available === 0 ? 'Out of stock' : adding ? 'Adding…' : 'Add to cart'}
      </button>
      {reason && (
        <span id={reasonId} hidden>
          {reason}
        </span>
      )}
      {error && !open && (
        <p role='alert' className='mt-3 bg-white text-sm text-red-700'>
          {error}
        </p>
      )}
    </StorefrontSurface>
  );
}
