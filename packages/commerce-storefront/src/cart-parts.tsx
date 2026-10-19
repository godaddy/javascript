import * as Dialog from '@radix-ui/react-dialog';
import {
  createContext,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link } from 'react-router';
import { money } from './api';
import { buttonClass } from './cart';
import { type CartItemState, type CartState, useCart } from './cart-state';
import { CartDrawerRegistry, useCommerce } from './commerce-provider';
import { hasChildren, type PartRegistry, partClass, usePartRegistry } from './part';
import { useSampleCart } from './sample-cart';
import { CommerceStatus, StorefrontSurface } from './storefront-surface';

/** Props shared by every cart part. `className` is added to the part's outer element. */
export interface CartPartProps {
  className?: string;
}

interface CartDrawerInternal {
  register: PartRegistry['register'];
}

interface CartInternal extends CartState {
  hydrating: boolean;
  error: string | null;
  storageWarning: string | null;
  catalogPath: string;
  checkoutEnabled: boolean;
  /** Whether the server has totalled the cart, which checkout needs. */
  checkoutReady: boolean;
  /** The action in progress from this cart, such as `remove:<id>`. */
  action: string | null;
  /** Any cart action, from here or anywhere else, is running. */
  locked: boolean;
  run: (action: string, operation: () => Promise<boolean>) => void;
  changeQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  refresh: () => Promise<boolean>;
  checkout: () => Promise<boolean>;
  close: () => void;
}

const CartContext = createContext<CartInternal | null>(null);
const CartDrawerContext = createContext<CartDrawerInternal | null>(null);

function useCartInternal(part: string): CartInternal {
  const context = useContext(CartContext);
  if (!context) throw new Error(`${part} must be rendered inside <CartRoot> or <CartDrawerRoot>.`);
  return context;
}

function CartProvider({ children }: { children: ReactNode }): ReactElement {
  const commerce = useCommerce();
  const sample = useSampleCart();
  const state = useCart();
  const [action, setAction] = useState<string | null>(null);
  // Not memoized: the commerce context value is new on every provider render, so a memo would never hit.
  const locked: boolean = commerce.pending || commerce.hydrating || action !== null;
  const value: CartInternal = {
    ...state,
    hydrating: commerce.hydrating,
    error: commerce.error,
    storageWarning: commerce.storageWarning,
    catalogPath: commerce.config.catalogPath,
    checkoutEnabled: !!commerce.config.checkoutSuccessPath,
    checkoutReady: commerce.cart?.totals?.total?.value != null,
    action,
    locked,
    run: (next, operation) => {
      if (locked) return;
      setAction(next);
      void operation().finally(() => setAction(null));
    },
    changeQuantity: state.isSample ? sample.changeQuantity : commerce.changeQuantity,
    removeItem: state.isSample ? sample.remove : commerce.removeItem,
    refresh: commerce.refresh,
    checkout: commerce.checkout,
    close: () => commerce.setOpen(false),
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export interface CartRootProps {
  children: ReactNode;
  /** Added to the root `<section>`. */
  className?: string;
}

/**
 * Provides the cart to cart parts on a page, such as a `/cart` route. While no store is connected it shows the sample
 * cart. Use `CartDrawerRoot` for the drawer.
 */
export function CartRoot({ children, className }: CartRootProps): ReactElement {
  const { connection } = useCommerce();
  const isSample: boolean = connection === 'unbound';
  return (
    <StorefrontSurface>
      {connection === 'ready' || isSample ? (
        <CartProvider>
          <section className={partClass(className)} data-commerce-source={isSample ? 'sample' : undefined}>
            {children}
          </section>
        </CartProvider>
      ) : (
        // Host classes stay on while connecting, so the layout does not jump when the cart replaces the status.
        <div className={partClass(className)}>
          <CommerceStatus />
        </div>
      )}
    </StorefrontSurface>
  );
}

export interface CartDrawerRootProps {
  children: ReactNode;
  /** Added to the drawer panel. The packaged drawer passes its width, background and column layout here. */
  className?: string;
}

/**
 * The cart dialog. Opens when an item is added or a `CartButton` is pressed, and returns focus when it closes.
 * The panel sits at the right edge at full height; `mr-auto` on it moves it to the left. Mount one per provider,
 * in place of `CartDrawer`.
 */
export function CartDrawerRoot({ children, className }: CartDrawerRootProps): ReactElement {
  const { open, setOpen, restoreFocus, connection } = useCommerce();
  // Adds open the drawer only while one is mounted, so a site with a cart page gets no stuck `open` state.
  const registerDrawer = useContext(CartDrawerRegistry);
  useEffect(() => registerDrawer?.(), [registerDrawer]);
  // Radix links its description by default. Radix 1.1 also does so with none mounted, then warns about the missing
  // element, so `aria-describedby={undefined}` turns the link off until a `CartDescription` mounts. Without the
  // override, each Radix version links its own description ID.
  const [described, setDescribed] = useState<boolean>(false);
  const { register, has } = usePartRegistry(
    useCallback((registered: PartRegistry['has']) => setDescribed(registered('description')), []),
  );
  useEffect(() => {
    setDescribed(has('description'));
  }, [has]);
  const drawer = useMemo((): CartDrawerInternal => ({ register }), [register]);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <StorefrontSurface>
          <Dialog.Overlay className='fixed inset-0 z-40 bg-neutral-950/40' />
          {/* Positions the panel, so the panel itself carries no package layout that host classes would lose to. */}
          <div className='pointer-events-none fixed inset-0 z-50 flex justify-end'>
            <Dialog.Content
              data-commerce-source={connection === 'unbound' ? 'sample' : undefined}
              {...(described ? {} : { 'aria-describedby': undefined })}
              className={partClass('pointer-events-auto', className)}
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                restoreFocus();
              }}
            >
              <CartDrawerContext.Provider value={drawer}>
                <CartProvider>{children}</CartProvider>
              </CartDrawerContext.Provider>
            </Dialog.Content>
          </div>
        </StorefrontSurface>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** "Your cart", or "Sample cart" before a store is connected, as an H2. In the drawer it names the dialog. */
export function CartTitle({ className }: CartPartProps): ReactElement {
  const { isSample } = useCartInternal('CartTitle');
  const Heading = useContext(CartDrawerContext) ? Dialog.Title : 'h2';
  return (
    <div className={partClass(className)}>
      <Heading className='text-2xl font-semibold'>{isSample ? 'Sample cart' : 'Your cart'}</Heading>
    </div>
  );
}

/** One line about the cart. In the drawer it describes the dialog. */
export function CartDescription({ className }: CartPartProps): ReactElement {
  const { isSample } = useCartInternal('CartDescription');
  const drawer = useContext(CartDrawerContext);
  const register = drawer?.register;
  useEffect(() => register?.('description'), [register]);
  const text: string = isSample
    ? 'Example products and prices in USD. Nothing can be purchased.'
    : 'Review your items before checkout.';
  return (
    <div className={partClass(className)}>
      {drawer ? (
        <Dialog.Description className='text-sm text-neutral-600'>{text}</Dialog.Description>
      ) : (
        <p className='text-sm text-neutral-600'>{text}</p>
      )}
    </div>
  );
}

/** The drawer's close button. Renders nothing outside the drawer. */
export function CartClose({ className }: CartPartProps): ReactElement | null {
  useCartInternal('CartClose');
  if (!useContext(CartDrawerContext)) return null;
  return (
    <div className={partClass(className)}>
      <Dialog.Close
        className='min-h-11 min-w-11 rounded-lg border border-neutral-400 bg-white px-3 text-neutral-900 focus-visible:outline focus-visible:outline-2'
        aria-label='Close cart'
      >
        ✕
      </Dialog.Close>
    </div>
  );
}

/** A storage warning, and a cart error with a refresh button. Renders nothing when there are neither. */
export function CartNotices({ className }: CartPartProps): ReactElement | null {
  const { storageWarning, error, action, locked, run, refresh } = useCartInternal('CartNotices');
  if (!storageWarning && !error) return null;
  // The gap is on an inner element, so host layout classes on the part still apply. (`space-y-*` would lose to the
  // reset's paragraph margin.)
  return (
    <div className={partClass(className)}>
      <div className='flex flex-col gap-4'>
        {storageWarning && (
          <p role='status' className='text-sm text-amber-800'>
            {storageWarning}
          </p>
        )}
        {error && (
          <div role='alert' className='rounded-lg bg-red-50 p-4 text-red-800'>
            <p>{error}</p>
            <button
              type='button'
              className='mt-2 min-h-11 bg-red-50 text-red-800 underline disabled:cursor-not-allowed'
              disabled={action === 'refresh'}
              aria-disabled={locked}
              aria-busy={action === 'refresh'}
              onClick={() => run('refresh', refresh)}
            >
              Refresh cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const CartItemsContext = createContext<CartItemState | null>(null);
const CartItemsRegistry = createContext<PartRegistry['register'] | null>(null);
const CartItemContext = createContext<CartItemState | null>(null);

function useCartItemInternal(part: string): CartItemState {
  const item = useContext(CartItemContext);
  if (!item) throw new Error(`${part} must be rendered inside <CartItemRoot>.`);
  return item;
}

/** Read the line from inside `CartItemRoot`, for custom item parts. */
export function useCartItem(): CartItemState {
  return useCartItemInternal('useCartItem');
}

export interface CartItemsProps extends CartPartProps {
  /** One item, rendered for every cart line. Defaults to the packaged item. */
  children?: ReactNode;
}

/**
 * The cart lines as a list. `className` goes on the list element whose children are the items. While the saved cart
 * loads, a status message renders just before it.
 */
export function CartItems({ className, children }: CartItemsProps): ReactElement {
  const { items, hydrating } = useCartInternal('CartItems');
  // `{custom && <CartItemRoot>…}` with `custom` false still gets an item, not an empty slot per line.
  const template: ReactNode = hasChildren(children) ? children : packagedItem;
  const registry = usePartRegistry();
  const { has } = registry;
  // Parent effects run after child effects, so every rendered item has registered by now. Development builds only.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' || items.length === 0 || has('item')) return;
    console.warn(
      '[gd-commerce-storefront] The <CartItems> template renders no <CartItemRoot>, so the cart list has no items. ' +
        'Wrap each line in <CartItemRoot>.',
    );
  }, [items.length, has]);
  return (
    <CartItemsRegistry.Provider value={registry.register}>
      {hydrating && <p role='status'>Loading your cart…</p>}
      {/* A `<ul>` needs a package margin and padding reset, which would beat host classes here. */}
      <div role='list' className={partClass(className)}>
        {items.map((item, index) => (
          <CartItemsContext.Provider key={item.id || `line-${index}`} value={item}>
            {template}
          </CartItemsContext.Provider>
        ))}
      </div>
    </CartItemsRegistry.Provider>
  );
}

export interface CartItemRootProps {
  children: ReactNode;
  /** Added to the item's list item element. */
  className?: string;
}

/** One cart line. Render it as the child of `CartItems`, which renders it once for every line. */
export function CartItemRoot({ children, className }: CartItemRootProps): ReactElement {
  const item = useContext(CartItemsContext);
  const register = useContext(CartItemsRegistry);
  useEffect(() => register?.('item'), [register]);
  if (!item) throw new Error('CartItemRoot must be rendered inside <CartItems>.');
  return (
    <CartItemContext.Provider value={item}>
      <div role='listitem' className={partClass(className)} data-testid='cart-item'>
        {/* An item nested inside this one is not a cart line. */}
        <CartItemsContext.Provider value={null}>{children}</CartItemsContext.Provider>
      </div>
    </CartItemContext.Provider>
  );
}

/** The line's product image. Renders nothing without one. */
export function CartItemImage({ className }: CartPartProps): ReactElement | null {
  const { imageUrl } = useCartItemInternal('CartItemImage');
  if (!imageUrl) return null;
  return (
    <div className={partClass(className)}>
      <img src={imageUrl} alt='' className='h-20 w-20 rounded-lg bg-neutral-100 object-cover' />
    </div>
  );
}

/** The product name as an H3. */
export function CartItemName({ className }: CartPartProps): ReactElement {
  const { name } = useCartItemInternal('CartItemName');
  return (
    <div className={partClass(className)}>
      <h3 className='font-semibold'>{name}</h3>
    </div>
  );
}

/** The selected options, one per line, such as "Color: Blue". Renders nothing without options. */
export function CartItemOptions({ className }: CartPartProps): ReactElement | null {
  const { options } = useCartItemInternal('CartItemOptions');
  if (!options.length) return null;
  return (
    <div className={partClass(className)}>
      {options.map((option) => (
        <p key={`${option.attribute}:${option.values.join(',')}`} className='text-sm text-neutral-600'>
          {option.attribute}: {option.values.join(', ')}
        </p>
      ))}
    </div>
  );
}

/** The line total. */
export function CartItemPrice({ className }: CartPartProps): ReactElement {
  const { subtotal, currency } = useCartItemInternal('CartItemPrice');
  return (
    <div className={partClass(className)}>
      <p className='text-sm'>{subtotal === null ? 'Price unavailable' : money(subtotal, currency)}</p>
    </div>
  );
}

const stepperButtonClass: string =
  'min-h-11 min-w-11 rounded-lg bg-white text-neutral-900 focus-visible:outline focus-visible:outline-2 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-600';

/** Decrease and increase buttons around the line's quantity. */
export function CartItemQuantity({ className }: CartPartProps): ReactElement {
  const { id, name, quantity } = useCartItemInternal('CartItemQuantity');
  const { action, locked, run, changeQuantity } = useCartInternal('CartItemQuantity');
  return (
    <div className={partClass(className)}>
      <div className='flex items-center rounded-lg border border-neutral-300'>
        <button
          type='button'
          className={stepperButtonClass}
          aria-label={`Decrease quantity of ${name}`}
          disabled={action === `decrease:${id}` || !id || quantity <= 1}
          aria-disabled={locked || !id || quantity <= 1}
          aria-busy={action === `decrease:${id}`}
          onClick={() => run(`decrease:${id}`, () => changeQuantity(id, quantity - 1))}
        >
          −
        </button>
        <span className='min-w-8 text-center'>
          <span className='sr-only'>Quantity: </span>
          {quantity}
        </span>
        <button
          type='button'
          className={stepperButtonClass}
          aria-label={`Increase quantity of ${name}`}
          disabled={action === `increase:${id}` || !id}
          aria-disabled={locked || !id}
          aria-busy={action === `increase:${id}`}
          onClick={() => run(`increase:${id}`, () => changeQuantity(id, quantity + 1))}
        >
          +
        </button>
      </div>
    </div>
  );
}

/** Removes the line. */
export function CartItemRemove({ className }: CartPartProps): ReactElement {
  const { id, name } = useCartItemInternal('CartItemRemove');
  const { action, locked, run, removeItem } = useCartInternal('CartItemRemove');
  return (
    <div className={partClass(className)}>
      <button
        type='button'
        className='min-h-11 bg-white px-2 text-sm text-neutral-900 underline focus-visible:outline focus-visible:outline-2 disabled:cursor-not-allowed disabled:text-neutral-600'
        aria-label={`Remove ${name}`}
        disabled={action === `remove:${id}` || !id}
        aria-disabled={locked || !id}
        aria-busy={action === `remove:${id}`}
        onClick={() => run(`remove:${id}`, () => removeItem(id))}
      >
        Remove
      </button>
    </div>
  );
}

const packagedItem: ReactElement = (
  <CartItemRoot className='py-5 first:pt-0'>
    <div className='flex gap-4'>
      <CartItemImage />
      <div className='min-w-0 flex-1'>
        <CartItemName />
        <CartItemOptions />
        <CartItemPrice className='mt-1' />
      </div>
    </div>
    <div className='mt-4 flex items-center justify-between gap-2'>
      <CartItemQuantity />
      <CartItemRemove />
    </div>
  </CartItemRoot>
);

export interface CartEmptyProps extends CartPartProps {
  /** Replaces the default message and link. */
  children?: ReactNode;
}

/** Renders only when the cart is empty: a message and a link to the catalog, or its children. */
export function CartEmpty({ className, children }: CartEmptyProps): ReactElement | null {
  const { items, hydrating, isSample, catalogPath, close } = useCartInternal('CartEmpty');
  if (hydrating || items.length) return null;
  return (
    <div className={partClass(className)}>
      {hasChildren(children) ? (
        children
      ) : (
        <>
          <p className='text-xl font-medium'>Your cart is empty</p>
          <p className='mt-2 text-neutral-600'>
            {isSample ? 'Add a sample product to try the cart.' : 'Find something you love in the shop.'}
          </p>
          <Link className={`${buttonClass} mt-6`} to={catalogPath} onClick={close}>
            Browse products
          </Link>
        </>
      )}
    </div>
  );
}

export interface CartSummaryProps extends CartPartProps {
  children: ReactNode;
}

/** A container for the subtotal and checkout. Renders only when the cart has items. */
export function CartSummary({ className, children }: CartSummaryProps): ReactElement | null {
  const { items } = useCartInternal('CartSummary');
  if (!items.length) return null;
  return <div className={partClass(className)}>{children}</div>;
}

/** The subtotal, labeled "Sample subtotal" for samples. Renders nothing until the server prices the cart. */
export function CartSubtotal({ className }: CartPartProps): ReactElement | null {
  const { items, subtotal, currency, isSample } = useCartInternal('CartSubtotal');
  if (!items.length || subtotal === null) return null;
  return (
    <div className={partClass(className)}>
      <dl className='space-y-2 text-sm'>
        <div className='flex justify-between'>
          <dt>{isSample ? 'Sample subtotal' : 'Subtotal'}</dt>
          <dd>{money(subtotal, currency)}</dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * "Shipping, taxes, and discounts are calculated at checkout." Has the stable
 * `commerce-cart-checkout-adjustments-note` class. Renders nothing for samples or an empty cart.
 */
export function CartCheckoutNote({ className }: CartPartProps): ReactElement | null {
  const { items, isSample } = useCartInternal('CartCheckoutNote');
  if (isSample || !items.length) return null;
  // The stable class is on the outer element, so hiding it also removes the host's spacing.
  return (
    <div className={partClass('commerce-cart-checkout-adjustments-note', className)}>
      <p className='text-sm text-neutral-600'>Shipping, taxes, and discounts are calculated at checkout.</p>
    </div>
  );
}

/**
 * The checkout button when `checkoutSuccessPath` is set; otherwise a message that checkout is unavailable.
 * Samples never check out. Renders nothing for an empty cart.
 */
export function CartCheckout({ className }: CartPartProps): ReactElement | null {
  const { items, isSample, checkoutEnabled, checkoutReady, hydrating, action, locked, run, checkout } =
    useCartInternal('CartCheckout');
  if (!items.length) return null;
  let content: ReactElement;
  if (isSample)
    content = <p className='text-sm text-neutral-600'>Example total in USD. Checkout is not set up yet.</p>;
  else if (!checkoutEnabled)
    content = <p className='text-sm text-neutral-600'>Checkout is not available yet.</p>;
  else
    content = (
      <button
        type='button'
        className={`${buttonClass} w-full`}
        disabled={action === 'checkout' || hydrating || !checkoutReady}
        aria-disabled={locked || !checkoutReady}
        aria-busy={action === 'checkout'}
        onClick={() => run('checkout', checkout)}
      >
        {action === 'checkout' ? 'Opening checkout…' : 'Proceed to Checkout'}
      </button>
    );
  return <div className={partClass(className)}>{content}</div>;
}

/** The packaged cart drawer. Compose `CartDrawerRoot` and the cart parts for a custom drawer. */
export function CartDrawer(): ReactElement {
  return (
    <CartDrawerRoot className='flex w-full max-w-lg flex-col bg-white text-neutral-900 shadow-xl'>
      <div className='flex items-start justify-between border-b border-neutral-200 p-6'>
        <div>
          <CartTitle />
          <CartDescription className='mt-1' />
        </div>
        <CartClose />
      </div>
      <div className='flex-1 overflow-y-auto p-6'>
        <CartNotices className='mb-4' />
        <CartItems className='divide-y divide-neutral-200' />
        <CartEmpty className='py-16 text-center' />
      </div>
      <CartSummary className='border-t border-neutral-200 p-6'>
        <CartSubtotal />
        <CartCheckoutNote className='mt-3' />
        <CartCheckout />
      </CartSummary>
    </CartDrawerRoot>
  );
}
