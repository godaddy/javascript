import * as Dialog from '@radix-ui/react-dialog';
import { type ReactElement, useState } from 'react';
import { Link } from 'react-router';
import { money } from './api';
import { type CartSummaryTotals, getCartSummaryTotals } from './cart-model';
import type { SKU } from './catalog-model';
import { getAvailableInventoryQuantity } from './catalog-model';
import { useCommerce } from './commerce-provider';
import { StorefrontSurface } from './storefront-surface';

export const buttonClass: string =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-commerce-accent px-5 py-2 text-sm font-semibold text-commerce-on-accent hover:bg-commerce-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-700 disabled:hover:bg-neutral-200';
export const inputClass: string =
  'min-h-11 rounded-lg border border-neutral-400 bg-white px-3 py-2 text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900';

export function CartButton(): ReactElement {
  const { cart, setOpen, open, connection } = useCommerce();
  const count: number = cart?.lineItems?.reduce((total, item) => total + (item.quantity ?? 0), 0) ?? 0;
  return (
    <StorefrontSurface className='commerce-inline'>
      <button
        type='button'
        className={buttonClass}
        disabled={connection !== 'ready'}
        aria-haspopup='dialog'
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        Cart <span className='rounded-full bg-white px-2 py-0.5 text-xs text-neutral-900'>{count}</span>
      </button>
    </StorefrontSurface>
  );
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
  const available: number | null = getAvailableInventoryQuantity(sku);
  const disabled: boolean =
    connection !== 'ready' ||
    !sku.id ||
    adding ||
    hydrating ||
    available === 0 ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    (available !== null && quantity > available);
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
        onClick={() => void handleAdd()}
      >
        {available === 0 ? 'Out of stock' : adding ? 'Adding…' : 'Add to cart'}
      </button>
      {error && !open && (
        <p role='alert' className='mt-3 bg-white text-sm text-red-700'>
          {error}
        </p>
      )}
    </StorefrontSurface>
  );
}

export function CartDrawer(): ReactElement {
  const {
    config,
    cart,
    open,
    setOpen,
    restoreFocus,
    pending,
    hydrating,
    error,
    storageWarning,
    changeQuantity,
    removeItem,
    refresh,
    checkout,
  } = useCommerce();
  const [drawerAction, setDrawerAction] = useState<string | null>(null);
  const checkingOut: boolean = drawerAction === 'checkout';
  const locked: boolean = pending || hydrating || drawerAction !== null;
  const items = cart?.lineItems ?? [];
  const summary: CartSummaryTotals = getCartSummaryTotals(cart);
  const currency: string = cart?.totals?.total?.currencyCode ?? config.currencyCode;
  async function handleAction(action: string, operation: () => Promise<boolean>): Promise<void> {
    if (locked) return;
    setDrawerAction(action);
    try {
      await operation();
    } finally {
      setDrawerAction(null);
    }
  }
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <StorefrontSurface>
          <Dialog.Overlay className='fixed inset-0 z-40 bg-neutral-950/40' />
          <Dialog.Content
            className='fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white text-neutral-900 shadow-xl'
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              restoreFocus();
            }}
          >
            <div className='flex items-start justify-between border-b border-neutral-200 p-6'>
              <div>
                <Dialog.Title className='text-2xl font-semibold'>Your cart</Dialog.Title>
                <Dialog.Description className='mt-1 text-sm text-neutral-600'>
                  Review your items before checkout.
                </Dialog.Description>
              </div>
              <Dialog.Close
                className='min-h-11 min-w-11 rounded-lg border border-neutral-400 bg-white px-3 text-neutral-900 focus-visible:outline focus-visible:outline-2'
                aria-label='Close cart'
              >
                ✕
              </Dialog.Close>
            </div>
            <div className='flex-1 overflow-y-auto p-6'>
              {storageWarning && (
                <p role='status' className='mb-4 text-sm text-amber-800'>
                  {storageWarning}
                </p>
              )}
              {error && (
                <div role='alert' className='mb-4 rounded-lg bg-red-50 p-4 text-red-800'>
                  <p>{error}</p>
                  <button
                    type='button'
                    className='mt-2 min-h-11 bg-red-50 text-red-800 underline disabled:cursor-not-allowed'
                    disabled={drawerAction === 'refresh'}
                    aria-disabled={locked}
                    aria-busy={drawerAction === 'refresh'}
                    onClick={() => void handleAction('refresh', refresh)}
                  >
                    Refresh cart
                  </button>
                </div>
              )}
              {hydrating && <p role='status'>Loading your cart…</p>}
              {!hydrating && !items.length && (
                <div className='py-16 text-center'>
                  <p className='text-xl font-medium'>Your cart is empty</p>
                  <p className='mt-2 text-neutral-600'>Find something you love in the shop.</p>
                  <Link
                    className={`${buttonClass} mt-6`}
                    to={config.catalogPath}
                    onClick={() => setOpen(false)}
                  >
                    Browse products
                  </Link>
                </div>
              )}
              <ul className='divide-y divide-neutral-200'>
                {items.map((item) => (
                  <li key={item.id} className='py-5 first:pt-0' data-testid='cart-item'>
                    <div className='flex gap-4'>
                      {item.details?.productAssetUrl && (
                        <img
                          src={item.details.productAssetUrl}
                          alt=''
                          className='h-20 w-20 rounded-lg bg-neutral-100 object-cover'
                        />
                      )}
                      <div className='min-w-0 flex-1'>
                        <h3 className='font-semibold'>{item.name}</h3>
                        {item.details?.selectedOptions?.map((option) => (
                          <p
                            key={`${option.attribute}:${option.values?.join(',')}`}
                            className='text-sm text-neutral-600'
                          >
                            {option.attribute}: {option.values?.join(', ')}
                          </p>
                        ))}
                        <p className='mt-1 text-sm'>
                          {typeof item.totals?.subTotal?.value === 'number'
                            ? money(item.totals.subTotal.value, item.totals.subTotal.currencyCode ?? currency)
                            : 'Price unavailable'}
                        </p>
                      </div>
                    </div>
                    <div className='mt-4 flex items-center justify-between gap-2'>
                      <div className='flex items-center rounded-lg border border-neutral-300'>
                        <button
                          type='button'
                          className='min-h-11 min-w-11 rounded-lg bg-white text-neutral-900 focus-visible:outline focus-visible:outline-2 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-600'
                          aria-label={`Decrease quantity of ${item.name}`}
                          disabled={
                            drawerAction === `decrease:${item.id}` || !item.id || (item.quantity ?? 0) <= 1
                          }
                          aria-disabled={locked || !item.id || (item.quantity ?? 0) <= 1}
                          aria-busy={drawerAction === `decrease:${item.id}`}
                          onClick={() =>
                            void handleAction(`decrease:${item.id}`, () =>
                              changeQuantity(item.id ?? '', (item.quantity ?? 1) - 1),
                            )
                          }
                        >
                          −
                        </button>
                        <span className='min-w-8 text-center'>
                          <span className='sr-only'>Quantity: </span>
                          {item.quantity}
                        </span>
                        <button
                          type='button'
                          className='min-h-11 min-w-11 rounded-lg bg-white text-neutral-900 focus-visible:outline focus-visible:outline-2 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-600'
                          aria-label={`Increase quantity of ${item.name}`}
                          disabled={drawerAction === `increase:${item.id}` || !item.id}
                          aria-disabled={locked || !item.id}
                          aria-busy={drawerAction === `increase:${item.id}`}
                          onClick={() =>
                            void handleAction(`increase:${item.id}`, () =>
                              changeQuantity(item.id ?? '', (item.quantity ?? 1) + 1),
                            )
                          }
                        >
                          +
                        </button>
                      </div>
                      <button
                        type='button'
                        className='min-h-11 bg-white px-2 text-sm text-neutral-900 underline focus-visible:outline focus-visible:outline-2 disabled:cursor-not-allowed disabled:text-neutral-600'
                        aria-label={`Remove ${item.name}`}
                        disabled={drawerAction === `remove:${item.id}` || !item.id}
                        aria-disabled={locked || !item.id}
                        aria-busy={drawerAction === `remove:${item.id}`}
                        onClick={() =>
                          void handleAction(`remove:${item.id}`, () => removeItem(item.id ?? ''))
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {items.length > 0 && (
              <div className='border-t border-neutral-200 p-6'>
                <dl className='space-y-2 text-sm'>
                  {(
                    [
                      ['Subtotal', cart?.totals?.subTotal, summary.subtotal],
                      ['Shipping', cart?.totals?.shippingTotal, summary.shipping],
                      ['Tax', cart?.totals?.taxTotal, summary.taxes],
                    ] as const
                  ).map(
                    ([label, amount, value]) =>
                      typeof amount?.value === 'number' && (
                        <div key={label} className='flex justify-between'>
                          <dt>{label}</dt>
                          <dd>{money(value, amount.currencyCode ?? currency)}</dd>
                        </div>
                      ),
                  )}
                  <div className='flex justify-between border-t border-neutral-200 pt-3 text-lg font-semibold'>
                    <dt>Total</dt>
                    <dd data-testid='cart-total'>
                      {typeof cart?.totals?.total?.value === 'number'
                        ? money(summary.total, currency)
                        : 'Unavailable'}
                    </dd>
                  </div>
                </dl>
                <p className='my-3 text-xs text-neutral-600'>Shipping and taxes may change at checkout.</p>
                {config.checkoutSuccessPath ? (
                  <button
                    type='button'
                    className={`${buttonClass} w-full`}
                    disabled={checkingOut || hydrating || cart?.totals?.total?.value == null}
                    aria-disabled={locked || cart?.totals?.total?.value == null}
                    aria-busy={checkingOut}
                    onClick={() => void handleAction('checkout', checkout)}
                  >
                    {checkingOut ? 'Opening checkout…' : 'Continue to checkout'}
                  </button>
                ) : (
                  <p className='text-sm text-neutral-600'>Checkout is not available yet.</p>
                )}
              </div>
            )}
          </Dialog.Content>
        </StorefrontSurface>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
