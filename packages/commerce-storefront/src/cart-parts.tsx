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
import { type CartItemState, type CartState, useCart } from './cart-state';
import { buttonClass, errorActionClass, errorNoticeClass, secondaryButtonClass } from './class-names';
import { CartDrawerRegistry, useCommerce, useMoney } from './commerce-provider';
import {
  hasChildren,
  type PartLabel,
  type PartRegistry,
  partProps,
  renderLabel,
  usePartRegistry,
} from './part';
import { useSampleCart } from './sample-cart';
import { CommerceStatus, StorefrontSurface } from './storefront-surface';

/** Props shared by every cart part. `className` is added to the part's outer element. */
export interface CartPartProps {
  className?: string;
}

/** Props for a cart part whose text the host can replace, with or without the sample wording. */
export interface CartTextPartProps extends CartPartProps {
  /** Replaces the text. A function receives whether the cart is the sample cart. */
  children?: PartLabel<{ isSample: boolean }>;
}

/** Props for a cart button whose label the host can replace. The button keeps its behavior and state. */
export interface CartActionPartProps extends CartPartProps {
  /** Replaces the button label. A function receives whether the action is running. */
  children?: PartLabel<{ busy: boolean }>;
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
          <section
            {...partProps('cart-root', className)}
            data-commerce-source={isSample ? 'sample' : undefined}
          >
            {children}
          </section>
        </CartProvider>
      ) : (
        // Host classes stay on while connecting, so the layout does not jump when the cart replaces the status.
        <div {...partProps('cart-root', className)}>
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
          <Dialog.Overlay className='fixed inset-0 z-40 bg-neutral-950/40 motion-safe:animate-commerce-fade-in' />
          {/* Positions the panel, so the panel itself carries no package layout that host classes would lose to. */}
          <div className='pointer-events-none fixed inset-0 z-50 flex justify-end'>
            <Dialog.Content
              data-commerce-source={connection === 'unbound' ? 'sample' : undefined}
              {...(described ? {} : { 'aria-describedby': undefined })}
              {...partProps('cart-drawer-root', 'pointer-events-auto', className)}
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

/**
 * "Your cart", or "Sample cart" before a store is connected, as an H2, with the item count once there are items.
 * In the drawer it names the dialog.
 */
export function CartTitle({ className, children }: CartTextPartProps): ReactElement {
  const { isSample, itemCount } = useCartInternal('CartTitle');
  const Heading = useContext(CartDrawerContext) ? Dialog.Title : 'h2';
  return (
    <div {...partProps('cart-title', className)}>
      <Heading className='text-lg font-semibold tracking-tight'>
        {renderLabel(
          children,
          { isSample },
          <>
            {isSample ? 'Sample cart' : 'Your cart'}
            {itemCount > 0 && <span className='font-normal text-commerce-muted'> ({itemCount})</span>}
          </>,
        )}
      </Heading>
    </div>
  );
}

/** One line about the cart. In the drawer it describes the dialog. */
export function CartDescription({ className, children }: CartTextPartProps): ReactElement {
  const { isSample } = useCartInternal('CartDescription');
  const drawer = useContext(CartDrawerContext);
  const register = drawer?.register;
  useEffect(() => register?.('description'), [register]);
  const text: ReactNode = renderLabel(
    children,
    { isSample },
    isSample
      ? 'Example products and prices in USD. Nothing can be purchased.'
      : 'Review your items before checkout.',
  );
  return (
    <div {...partProps('cart-description', className)}>
      {drawer ? (
        <Dialog.Description className='text-sm text-commerce-muted'>{text}</Dialog.Description>
      ) : (
        <p className='text-sm text-commerce-muted'>{text}</p>
      )}
    </div>
  );
}

/** The drawer's close button. Renders nothing outside the drawer. */
export function CartClose({ className }: CartPartProps): ReactElement | null {
  useCartInternal('CartClose');
  if (!useContext(CartDrawerContext)) return null;
  return (
    <div {...partProps('cart-close', className)}>
      <Dialog.Close
        className='inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-commerce-muted transition-colors hover:bg-commerce-tint hover:text-inherit focus-visible:outline focus-visible:outline-2 focus-visible:outline-current'
        aria-label='Close cart'
      >
        <svg aria-hidden='true' viewBox='0 0 20 20' className='h-5 w-5'>
          <path
            d='M5 5l10 10M15 5L5 15'
            fill='none'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
          />
        </svg>
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
    <div {...partProps('cart-notices', className)}>
      <div className='flex flex-col gap-4'>
        {storageWarning && (
          <p role='status' className='rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900'>
            {storageWarning}
          </p>
        )}
        {error && (
          <div role='alert' className={errorNoticeClass}>
            <p>{error}</p>
            <button
              type='button'
              className={errorActionClass}
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
      {hydrating && (
        <p role='status' className='py-4 text-sm text-commerce-muted'>
          Loading your cart…
        </p>
      )}
      {/* A `<ul>` needs a package margin and padding reset, which would beat host classes here. */}
      <div role='list' {...partProps('cart-items', className)}>
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
      <div role='listitem' {...partProps('cart-item-root', className)} data-testid='cart-item'>
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
    <div {...partProps('cart-item-image', className)}>
      <img src={imageUrl} alt='' className='h-20 w-20 bg-commerce-tint object-cover' />
    </div>
  );
}

/** The product name as an H3. */
export function CartItemName({ className }: CartPartProps): ReactElement {
  const { name } = useCartItemInternal('CartItemName');
  return (
    <div {...partProps('cart-item-name', className)}>
      <h3 className='break-words text-sm font-medium leading-6'>{name}</h3>
    </div>
  );
}

/** The selected options on one line, such as "Color: Blue · Size: M". Renders nothing without options. */
export function CartItemOptions({ className }: CartPartProps): ReactElement | null {
  const { options } = useCartItemInternal('CartItemOptions');
  if (!options.length) return null;
  return (
    <div {...partProps('cart-item-options', className)}>
      <p className='text-sm text-commerce-muted'>
        {options.map((option, index) => (
          <span key={`${option.attribute}:${option.values.join(',')}`}>
            {index > 0 && ' · '}
            {option.attribute}: {option.values.join(', ')}
          </span>
        ))}
      </p>
    </div>
  );
}

/** The line total. */
export function CartItemPrice({ className }: CartPartProps): ReactElement {
  const { subtotal, currency } = useCartItemInternal('CartItemPrice');
  const money = useMoney();
  return (
    <div {...partProps('cart-item-price', className)}>
      <p className='text-sm leading-6 tabular-nums'>
        {subtotal === null ? 'Price unavailable' : money(subtotal, currency)}
      </p>
    </div>
  );
}

// Transparent, so the stepper reads in the drawer and on a cart page over any host background.
const stepperButtonClass: string =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-colors hover:bg-commerce-tint focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-current disabled:cursor-not-allowed disabled:text-commerce-muted disabled:hover:bg-transparent';

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

/** Decrease and increase buttons around the line's quantity. */
export function CartItemQuantity({ className }: CartPartProps): ReactElement {
  const { id, name, quantity } = useCartItemInternal('CartItemQuantity');
  const { action, locked, run, changeQuantity } = useCartInternal('CartItemQuantity');
  return (
    <div {...partProps('cart-item-quantity', className)}>
      <div className='inline-flex items-center rounded-lg border border-commerce-edge'>
        <button
          type='button'
          className={stepperButtonClass}
          aria-label={`Decrease quantity of ${name}`}
          data-commerce-control='decrease'
          disabled={action === `decrease:${id}` || !id || quantity <= 1}
          aria-disabled={locked || !id || quantity <= 1}
          aria-busy={action === `decrease:${id}`}
          onClick={() => run(`decrease:${id}`, () => changeQuantity(id, quantity - 1))}
        >
          <StepperIcon />
        </button>
        <span className='min-w-8 text-center text-sm tabular-nums'>
          <span className='sr-only'>Quantity: </span>
          {quantity}
        </span>
        <button
          type='button'
          className={stepperButtonClass}
          aria-label={`Increase quantity of ${name}`}
          data-commerce-control='increase'
          disabled={action === `increase:${id}` || !id}
          aria-disabled={locked || !id}
          aria-busy={action === `increase:${id}`}
          onClick={() => run(`increase:${id}`, () => changeQuantity(id, quantity + 1))}
        >
          <StepperIcon plus />
        </button>
      </div>
    </div>
  );
}

/** Removes the line. */
export function CartItemRemove({ className, children }: CartActionPartProps): ReactElement {
  const { id, name } = useCartItemInternal('CartItemRemove');
  const { action, locked, run, removeItem } = useCartInternal('CartItemRemove');
  return (
    <div {...partProps('cart-item-remove', className)}>
      <button
        type='button'
        className='min-h-11 rounded-sm px-1 text-sm text-commerce-muted underline-offset-4 transition-colors hover:text-inherit hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-current disabled:cursor-not-allowed disabled:hover:no-underline'
        disabled={action === `remove:${id}` || !id}
        aria-disabled={locked || !id}
        aria-busy={action === `remove:${id}`}
        onClick={() => run(`remove:${id}`, () => removeItem(id))}
      >
        {/* The name is visible text plus hidden text, not an `aria-label`, so it always starts with the label shown. */}
        {renderLabel(children, { busy: action === `remove:${id}` }, 'Remove')}
        <span className='sr-only'> {name}</span>
      </button>
    </div>
  );
}

const packagedItem: ReactElement = (
  <CartItemRoot className='flex gap-4 py-5'>
    <CartItemImage className='shrink-0' />
    <div className='flex min-w-0 flex-1 flex-col'>
      <div className='flex items-start justify-between gap-4'>
        <div className='min-w-0'>
          <CartItemName />
          <CartItemOptions />
        </div>
        <CartItemPrice className='shrink-0' />
      </div>
      <div className='mt-3 flex items-center justify-between gap-2'>
        <CartItemQuantity />
        <CartItemRemove />
      </div>
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
    <div {...partProps('cart-empty', className)}>
      {hasChildren(children) ? (
        children
      ) : (
        <>
          <div className='mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-commerce-tint text-commerce-muted'>
            <svg aria-hidden='true' viewBox='0 0 20 20' className='h-6 w-6'>
              <path
                d='M4.5 6.5h11l-.8 9.1a1.5 1.5 0 0 1-1.5 1.4H6.8a1.5 1.5 0 0 1-1.5-1.4L4.5 6.5ZM7.5 6.5V6a2.5 2.5 0 0 1 5 0v.5'
                fill='none'
                stroke='currentColor'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </div>
          <p className='text-base font-semibold'>Your cart is empty</p>
          <p className='mt-1 text-sm text-commerce-muted'>
            {isSample
              ? 'Add a sample product to try the cart.'
              : 'Add something you love and it will show up here.'}
          </p>
          <Link className={`${secondaryButtonClass} mt-6`} to={catalogPath} onClick={close}>
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
  return <div {...partProps('cart-summary', className)}>{children}</div>;
}

/** The subtotal, labeled "Sample subtotal" for samples. Renders nothing until the server prices the cart. */
export function CartSubtotal({ className }: CartPartProps): ReactElement | null {
  const { items, subtotal, currency, isSample } = useCartInternal('CartSubtotal');
  const money = useMoney();
  if (!items.length || subtotal === null) return null;
  return (
    <div {...partProps('cart-subtotal', className)}>
      <dl>
        <div className='flex justify-between gap-4 font-semibold'>
          <dt>{isSample ? 'Sample subtotal' : 'Subtotal'}</dt>
          <dd className='tabular-nums'>{money(subtotal, currency)}</dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * A row under the subtotal: "Shipping, taxes & discounts", "Calculated at checkout". Has the stable
 * `commerce-cart-checkout-adjustments-note` class. Renders nothing for samples or an empty cart.
 */
export function CartCheckoutNote({ className }: CartPartProps): ReactElement | null {
  const { items, isSample } = useCartInternal('CartCheckoutNote');
  if (isSample || !items.length) return null;
  // The stable class is on the outer element, so hiding it also removes the host's spacing.
  return (
    <div {...partProps('cart-checkout-note', 'commerce-cart-checkout-adjustments-note', className)}>
      <dl className='flex justify-between gap-4 text-sm text-commerce-muted'>
        <dt>Shipping, taxes &amp; discounts</dt>
        <dd>Calculated at checkout</dd>
      </dl>
    </div>
  );
}

/**
 * The checkout button when `checkoutSuccessPath` is set; otherwise a message that checkout is unavailable.
 * Samples never check out. Renders nothing for an empty cart.
 */
export function CartCheckout({ className, children }: CartActionPartProps): ReactElement | null {
  const { items, isSample, checkoutEnabled, checkoutReady, hydrating, action, locked, run, checkout } =
    useCartInternal('CartCheckout');
  if (!items.length) return null;
  let content: ReactElement;
  if (isSample)
    content = (
      <p className='text-sm text-commerce-muted'>Example total in USD. Checkout is not set up yet.</p>
    );
  else if (!checkoutEnabled)
    content = <p className='text-sm text-commerce-muted'>Checkout is not available yet.</p>;
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
        {renderLabel(
          children,
          { busy: action === 'checkout' },
          action === 'checkout' ? 'Opening checkout…' : 'Proceed to checkout',
        )}
      </button>
    );
  return <div {...partProps('cart-checkout', className)}>{content}</div>;
}

/**
 * "Continue shopping": closes the drawer, or on a cart page links to the catalog. Renders nothing for an empty cart,
 * whose `CartEmpty` links to the catalog.
 */
export function CartContinueShopping({ className, children }: CartTextPartProps): ReactElement | null {
  const { items, isSample, catalogPath } = useCartInternal('CartContinueShopping');
  const inDrawer: boolean = !!useContext(CartDrawerContext);
  if (!items.length) return null;
  const label: ReactNode = renderLabel(children, { isSample }, 'Continue shopping');
  const linkClass: string =
    'inline-flex min-h-11 w-full items-center justify-center rounded-lg px-5 py-2 text-sm font-medium transition-colors hover:bg-commerce-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current';
  return (
    <div {...partProps('cart-continue-shopping', className)}>
      {inDrawer ? (
        <Dialog.Close className={linkClass}>{label}</Dialog.Close>
      ) : (
        <Link className={linkClass} to={catalogPath}>
          {label}
        </Link>
      )}
    </div>
  );
}

// The live drawer needs no description; the sample one says nothing can be bought.
function SampleDescription({ className }: CartPartProps): ReactElement | null {
  const { isSample } = useCartInternal('CartDescription');
  return isSample ? <CartDescription className={className} /> : null;
}

/** The packaged cart drawer. Compose `CartDrawerRoot` and the cart parts for a custom drawer. */
export function CartDrawer(): ReactElement {
  return (
    <CartDrawerRoot className='flex w-full max-w-md flex-col bg-white text-neutral-900 shadow-2xl motion-safe:animate-commerce-drawer-in'>
      <div className='flex items-start justify-between gap-4 border-b border-commerce-line py-3 pl-6 pr-3'>
        <div className='min-w-0 pt-2.5'>
          <CartTitle />
          <SampleDescription className='mt-0.5' />
        </div>
        <CartClose />
      </div>
      <div className='flex-1 overflow-y-auto px-6'>
        <CartNotices className='mt-6' />
        <CartItems className='divide-y divide-commerce-line' />
        <CartEmpty className='py-20 text-center' />
      </div>
      <CartSummary className='border-t border-commerce-line px-6 pb-6 pt-4'>
        <CartSubtotal />
        <CartCheckoutNote className='mt-1' />
        <CartCheckout className='mt-5' />
        <CartContinueShopping className='mt-2' />
      </CartSummary>
    </CartDrawerRoot>
  );
}
