import { useQuery } from '@tanstack/react-query';
import {
  type CSSProperties,
  createContext,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ApiError, CartIdStorage, checkedFetch, message, money, request, type StorefrontConfig } from './api';
import { type AddToCartItemInput, addToCart, type CartOrder } from './cart-model';
import { SampleCartProvider } from './sample-cart';

interface CartResponse {
  cart: CartOrder | null;
}
export interface CommerceContextValue {
  connection: 'loading' | 'unbound' | 'connecting' | 'ready' | 'error';
  connectionError: string | null;
  retryConnection: () => void;
  theme: StorefrontTheme;
  /** The host's swatch lookup, or `undefined` when options render as buttons. */
  getSwatch: GetSwatch | undefined;
  config: StorefrontConfig;
  /** The BCP 47 locale that prices are formatted in, such as `en-US`. */
  locale: string;
  cart: CartOrder | null;
  /** Whether the cart drawer is open. Always `false` when no `CartDrawer` or `CartDrawerRoot` is mounted. */
  open: boolean;
  /** Opens or closes the cart drawer. Opening does nothing without a mounted drawer. */
  setOpen: (open: boolean) => void;
  /** Restores the initiating control after the cart drawer closes. */
  restoreFocus: () => void;
  pending: boolean;
  hydrating: boolean;
  error: string | null;
  storageWarning: string | null;
  announcement: string;
  addItem: (item: AddToCartItemInput) => Promise<boolean>;
  changeQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  applyDiscount: (code: string) => Promise<boolean>;
  refresh: () => Promise<boolean>;
  checkout: () => Promise<boolean>;
}

const CommerceContext = createContext<CommerceContextValue | null>(null);

/** Lets a mounted cart drawer register itself, so adds open it only when one exists. Not public. */
export const CartDrawerRegistry = createContext<(() => () => void) | null>(null);

export function useCommerce(): CommerceContextValue {
  const context: CommerceContextValue | null = useContext(CommerceContext);
  if (!context)
    throw new Error('Mount CommerceProvider once around the header and page outlet, inside the router.');
  return context;
}

/**
 * Formats minor units, such as cents, in the provider's `locale`, the way the package's own parts do. Uses the
 * store's currency unless `currency` is given.
 */
export function useMoney(): (value: number, currency?: string) => string {
  const { locale, config } = useCommerce();
  const { currencyCode } = config;
  return useCallback(
    (value: number, currency: string = currencyCode): string => money(value, currency, locale),
    [locale, currencyCode],
  );
}

export type StorefrontTheme = CSSProperties & {
  '--commerce-accent'?: string;
  '--commerce-accent-hover'?: string;
  '--commerce-on-accent'?: string;
  '--commerce-surface'?: string;
  '--commerce-text'?: string;
  '--commerce-radius'?: string;
  /** Fills the Sale badge. Defaults to a red that white text reads on. */
  '--commerce-sale'?: string;
  /** Text on the Sale badge. Defaults to white. */
  '--commerce-on-sale'?: string;
};

/** The attribute value a host can give a swatch, such as `{ attribute: 'color', name: 'forest', label: 'Forest' }`. */
export interface SwatchValue {
  readonly attribute: string;
  readonly name: string;
  readonly label: string;
}

/**
 * Returns a CSS `background` for a value, such as `'#3f6352'` or `'url(/swatches/linen.png) center / cover'`, or
 * nothing for no swatch. An attribute shows swatches only when every value has one.
 */
export type GetSwatch = (value: SwatchValue) => string | null | undefined;

export interface CommerceProviderProps {
  children: ReactNode;
  catalogPath?: string;
  productPath?: string;
  /** Applied to storefront surfaces and the portalled cart drawer. */
  theme?: StorefrontTheme;
  /**
   * Swatches for attribute values, off by default. Attributes whose values all have a swatch render as swatches on
   * the product page, and cards show them as dots. See `GetSwatch`.
   */
  getSwatch?: GetSwatch;
  /** Set only when your server has enabled checkout and this return route exists. */
  checkoutSuccessPath?: string;
  /**
   * The BCP 47 locale for formatting prices, such as `de-DE`. Defaults to `en-US`; an invalid tag falls back to it.
   * It never selects UI text: localized text will be a separate, opt-in prop, so setting `locale` cannot change wording.
   */
  locale?: string;
  /**
   * Called after an item is added, live or sample. With a drawer mounted, the drawer also opens. Without one, such as
   * on a site with a cart page, use it to confirm the add.
   */
  onItemAdded?: (item: AddedCartItem) => void;
  /** Called for every cart change and failure, such as for analytics. See `CommerceEvent`. */
  onEvent?: (event: CommerceEvent) => void;
}

/** A cart operation that can fail. */
export type CommerceOperation = 'add' | 'change-quantity' | 'remove' | 'discount' | 'refresh' | 'checkout';

/**
 * What `onEvent` reports. Live changes are reported once the server returns the updated cart; sample changes have
 * `isSample: true` and never reach the store. New event types may be added, so ignore types you do not handle.
 */
export type CommerceEvent =
  | {
      readonly type: 'item-added';
      /** `null` for a sample product, which is not a SKU. */
      readonly skuId: string | null;
      readonly name: string;
      readonly quantity: number;
      readonly isSample: boolean;
    }
  | {
      readonly type: 'quantity-changed';
      readonly itemId: string;
      readonly quantity: number;
      readonly isSample: boolean;
    }
  | { readonly type: 'item-removed'; readonly itemId: string; readonly isSample: boolean }
  | { readonly type: 'discount-applied'; readonly code: string }
  /** Sent just before the browser leaves for checkout. */
  | { readonly type: 'checkout-started'; readonly cartId: string }
  /** `message` is the one the cart shows. */
  | { readonly type: 'error'; readonly operation: CommerceOperation; readonly message: string };

/** The item passed to `onItemAdded`. */
export interface AddedCartItem {
  readonly name: string;
  readonly quantity: number;
  /** `true` for the sample cart, before a store is connected. */
  readonly isSample: boolean;
}

type PublicConfiguration =
  | { state: 'unbound' | 'connecting' }
  | ({ state: 'ready' } & Pick<StorefrontConfig, 'cartScope' | 'currencyCode'>);

const CONNECTING_FAILURE_GRACE_MS = 60_000;
/** Polls every five seconds for five minutes after the page loads, then every minute, and stops at thirty. */
const FAST_POLL_FOR_MS = 5 * 60_000;
const STOP_POLLING_AT_MS = 30 * 60_000;
/** A failed retry keeps showing connecting this long so the click visibly does something. */
const RETRY_FEEDBACK_MS = 1_000;

/** `locale` as a canonical tag, or `en-US` when it is not a valid one, so one bad prop cannot break every price. */
function resolveLocale(locale: string | undefined): string {
  if (!locale) return 'en-US';
  try {
    return Intl.getCanonicalLocales(locale)[0] ?? 'en-US';
  } catch {
    if (process.env.NODE_ENV !== 'production')
      console.warn(`[gd-commerce-storefront] "${locale}" is not a valid locale, so prices use en-US.`);
    return 'en-US';
  }
}

const logCallbackFailure = (cause: unknown): void =>
  console.error('[gd-commerce-storefront] A storefront callback threw.', cause);

/**
 * Runs a host callback so that its failure cannot fail the cart operation that triggered it. An async callback is
 * not awaited; its rejection is logged instead of becoming an unhandled rejection.
 */
function callHost(callback: () => unknown): void {
  try {
    const result: unknown = callback();
    if (typeof (result as PromiseLike<unknown> | null)?.then === 'function')
      Promise.resolve(result).catch(logCallbackFailure);
  } catch (cause: unknown) {
    logCallbackFailure(cause);
  }
}

async function loadConfig(signal: AbortSignal): Promise<PublicConfiguration> {
  const config = await request<Record<string, unknown>>('/config', { signal });
  if (config?.state === 'unbound' || config?.state === 'connecting') {
    if ('cartScope' in config || 'currencyCode' in config)
      throw new Error('The store returned invalid configuration.');
    return { state: config.state };
  }
  if (
    !config ||
    (config.state !== undefined && config.state !== 'ready') ||
    typeof config.cartScope !== 'string' ||
    !config.cartScope.trim() ||
    typeof config.currencyCode !== 'string' ||
    !/^[A-Z]{3}$/.test(config.currencyCode)
  ) {
    throw new Error('The store returned invalid configuration.');
  }
  return { state: 'ready', cartScope: config.cartScope, currencyCode: config.currencyCode };
}

export function CommerceProvider({
  children,
  catalogPath = '/shop',
  productPath = '/products',
  checkoutSuccessPath,
  theme = {},
  getSwatch,
  locale,
  onItemAdded,
  onEvent,
}: CommerceProviderProps): ReactElement {
  const resolvedLocale: string = useMemo(() => resolveLocale(locale), [locale]);
  // Polling is timed from load, and a retry starts it over.
  const [pollingSince, setPollingSince] = useState(Date.now);
  const [pollingStopped, setPollingStopped] = useState<boolean>(false);
  const [retrying, setRetrying] = useState<boolean>(false);
  useEffect(() => {
    setPollingStopped(false);
    const timeout = setTimeout(() => setPollingStopped(true), pollingSince + STOP_POLLING_AT_MS - Date.now());
    return () => clearTimeout(timeout);
  }, [pollingSince]);
  const config = useQuery({
    retry: false,
    queryKey: ['commerce', 'configuration'],
    queryFn: ({ signal }) => loadConfig(signal),
    staleTime: 30_000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    // Errors after an unbound response also need recovery; stale data never grants eligibility.
    // A site can stay unbound for days, so polling ends; reloading the page or retrying starts it again.
    refetchInterval: (query) => {
      const waiting = query.state.data?.state === 'unbound' || query.state.data?.state === 'connecting';
      const elapsed = Date.now() - pollingSince;
      if (!waiting || elapsed >= STOP_POLLING_AT_MS) return false;
      return elapsed < FAST_POLL_FOR_MS ? 5_000 : 60_000;
    },
    refetchIntervalInBackground: false,
  });
  // Hosts may restart while connecting a store. Keep the connecting state through brief
  // refresh failures; it never shows samples, and polling continues until the grace ends.
  const holdConnecting: boolean =
    config.isError &&
    config.data?.state === 'connecting' &&
    config.errorUpdatedAt - config.dataUpdatedAt < CONNECTING_FAILURE_GRACE_MS;
  let connection: CommerceContextValue['connection'] = config.data?.state ?? 'loading';
  if (config.isError) connection = holdConnecting ? 'connecting' : 'error';
  // Nothing refreshes a connecting page once polling stops, so offer a retry instead of waiting forever.
  const stalled: boolean = pollingStopped && connection === 'connecting';
  if (stalled) connection = 'error';
  // Retrying only ever shows connecting; readiness still comes from the refreshed response.
  if (retrying) connection = 'connecting';
  return (
    <BoundCommerceProvider
      config={{
        cartScope: '',
        currencyCode: 'USD',
        ...(config.data?.state === 'ready' ? config.data : {}),
        catalogPath,
        productPath,
        checkoutSuccessPath,
      }}
      connection={connection}
      connectionError={
        connection !== 'error'
          ? null
          : stalled
            ? 'The store is taking too long to connect.'
            : message(config.error)
      }
      retryConnection={() => {
        const started = Date.now();
        setPollingSince(started);
        setRetrying(true);
        void config.refetch().then(async (result) => {
          if (result.isError)
            await new Promise((resolve) => setTimeout(resolve, started + RETRY_FEEDBACK_MS - Date.now()));
          setRetrying(false);
        });
      }}
      theme={theme}
      getSwatch={getSwatch}
      locale={resolvedLocale}
      onItemAdded={onItemAdded}
      onEvent={onEvent}
    >
      {children}
    </BoundCommerceProvider>
  );
}

function BoundCommerceProvider({
  config,
  children,
  connection,
  connectionError,
  retryConnection,
  theme,
  getSwatch,
  locale,
  onItemAdded,
  onEvent,
}: {
  getSwatch: GetSwatch | undefined;
  locale: string;
  onItemAdded?: (item: AddedCartItem) => void;
  onEvent?: (event: CommerceEvent) => void;
  connection: CommerceContextValue['connection'];
  connectionError: string | null;
  retryConnection: () => void;
  theme: StorefrontTheme;
  config: StorefrontConfig;
  children: ReactNode;
}): ReactElement {
  const storageKey: string = `godaddy:commerce-storefront:cart:${config.cartScope}`;
  const cartIdStorage = useMemo(() => new CartIdStorage(storageKey), [storageKey]);
  const ready = connection === 'ready';
  const session = useMemo(() => ({ cartIdStorage, connection }), [cartIdStorage, connection]);
  const currentSession = useRef(session);
  currentSession.current = session;
  const readyRef = useRef(ready);
  readyRef.current = ready;
  const [cart, setCart] = useState<CartOrder | null>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [pending, setPending] = useState<boolean>(false);
  const [hydrating, setHydrating] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState<string>('');
  const id = useRef<string | null>(null);
  const currentCart = useRef<CartOrder | null>(null);
  const queue = useRef<Promise<boolean>>(Promise.resolve(true));
  const alive = useRef<boolean>(true);
  const opener = useRef<HTMLElement | null>(null);

  const callbacks = useRef({ onItemAdded, onEvent });
  callbacks.current = { onItemAdded, onEvent };
  /** Reports an event to the host. A callback that throws is logged, and the operation still succeeds. */
  function emit(event: CommerceEvent): void {
    if (event.type === 'item-added') {
      const { name, quantity, isSample } = event;
      callHost(() => callbacks.current.onItemAdded?.({ name, quantity, isSample }));
    }
    callHost(() => callbacks.current.onEvent?.(event));
  }
  const drawers = useRef<number>(0);
  const registerDrawer = useCallback((): (() => void) => {
    drawers.current += 1;
    if (process.env.NODE_ENV !== 'production' && drawers.current === 2)
      console.warn(
        '[gd-commerce-storefront] More than one cart drawer is mounted, so every add opens all of them. ' +
          'CommerceStorefront already mounts CartDrawer; use CommerceProvider to mount your own CartDrawerRoot.',
      );
    return () => {
      drawers.current -= 1;
      if (drawers.current === 0) setOpen(false);
    };
  }, []);

  /** Opens the drawer for an add, if one is mounted. */
  function openDrawer(): void {
    if (drawers.current === 0) return;
    rememberOpener();
    setOpen(true);
  }

  function rememberOpener(): void {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }

  function isActive(): boolean {
    return alive.current && currentSession.current === session && readyRef.current;
  }

  function boundRequest<T>(path: string, init?: RequestInit): Promise<T> {
    const headers: Headers = new Headers(init?.headers);
    headers.set('X-Commerce-Scope', config.cartScope);
    return request<T>(path, { ...init, headers });
  }

  function readId(): string | null {
    try {
      return cartIdStorage.read();
    } catch {
      setStorageWarning('Your browser cannot save the cart. Keep this page open while shopping.');
      return id.current;
    }
  }

  function commit(next: CartOrder | null): void {
    if (!isActive()) return;
    id.current = next?.id ?? null;
    currentCart.current = next;
    setCart(next);
    try {
      cartIdStorage.write(id.current);
      setStorageWarning(null);
    } catch {
      setStorageWarning('Your browser cannot save the cart. Keep this page open while shopping.');
    }
  }

  async function hydrate(): Promise<void> {
    const storedId: string | null = readId();
    id.current = storedId;
    if (!storedId) {
      commit(null);
      return;
    }
    try {
      const data: CartResponse = await boundRequest<CartResponse>(`/cart/${encodeURIComponent(storedId)}`);
      commit(data.cart);
    } catch (cause: unknown) {
      if (cause instanceof ApiError && (cause.status === 404 || cause.status === 410)) {
        commit(null);
        return;
      }
      throw cause;
    }
  }

  // All mutations share this queue, including the first add that creates the order.
  // Never retry writes automatically: a failed response can follow a successful write.
  function run(
    kind: CommerceOperation,
    operation: () => Promise<void>,
    loading: boolean = false,
  ): Promise<boolean> {
    const task: Promise<boolean> = queue.current.then(async (): Promise<boolean> => {
      if (!isActive()) return false;
      setPending(true);
      if (loading) setHydrating(true);
      setError(null);
      try {
        // The browser lock also serializes mutations from other tabs for this binding.
        if (navigator.locks)
          await navigator.locks.request(storageKey, async (): Promise<void> => {
            if (isActive()) await operation();
          });
        else await operation();
        return isActive();
      } catch (cause: unknown) {
        if (isActive()) {
          const text: string = message(cause);
          setError(text);
          emit({ type: 'error', operation: kind, message: text });
        }
        return false;
      } finally {
        if (isActive()) {
          setPending(false);
          setHydrating(false);
        }
      }
    });
    queue.current = task;
    return task;
  }

  function refresh(): Promise<boolean> {
    return run('refresh', hydrate, true);
  }

  // The subscription belongs to a store connection; render-local operations use that session.
  // biome-ignore lint/correctness/useExhaustiveDependencies: Restart only when the scope or readiness changes, not on cart state updates.
  useEffect((): (() => void) => {
    alive.current = true;
    id.current = null;
    currentCart.current = null;
    queue.current = Promise.resolve(true);
    setCart(null);
    setOpen(false);
    setError(null);
    setStorageWarning(null);
    setAnnouncement('');
    setPending(false);
    setHydrating(ready);
    if (ready) void refresh();
    const onStorage = (event: StorageEvent): void => {
      if (event.key === storageKey || event.key === null) void refresh();
    };
    const onFocus = (): void => {
      void refresh();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    return (): void => {
      alive.current = false;
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
    };
  }, [cartIdStorage, connection]);

  function addItem(item: AddToCartItemInput): Promise<boolean> {
    rememberOpener();
    return run('add', async (): Promise<void> => {
      if (!item.skuId || !item.name || !Number.isInteger(item.quantity) || item.quantity < 1)
        throw new Error('Select a product variant and a positive quantity.');
      await hydrate();
      if (!isActive()) return;
      const fetchCart: typeof globalThis.fetch = (
        input: RequestInfo | URL,
        init?: RequestInit,
      ): Promise<Response> => {
        const headers: Headers = new Headers(init?.headers);
        headers.set('X-Commerce-Scope', config.cartScope);
        return checkedFetch(input, { ...init, headers });
      };
      const result: CartResponse = await addToCart(
        id.current,
        { skuId: item.skuId, name: item.name, quantity: item.quantity },
        fetchCart,
      );
      if (!result.cart?.id || !result.cart.lineItems?.length)
        throw new Error('Commerce did not return a cart with items. Refresh before retrying.');
      if (!isActive()) return;
      commit(result.cart);
      setAnnouncement(`${item.name} added to your cart.`);
      openDrawer();
      emit({
        type: 'item-added',
        skuId: item.skuId,
        name: item.name,
        quantity: item.quantity,
        isSample: false,
      });
    });
  }

  function mutateItem(itemId: string, method: 'PATCH' | 'DELETE', quantity?: number): Promise<boolean> {
    return run(method === 'DELETE' ? 'remove' : 'change-quantity', async (): Promise<void> => {
      await hydrate();
      if (!isActive()) return;
      if (!id.current || !currentCart.current?.lineItems?.some((item) => item.id === itemId))
        throw new Error('This item is no longer in the cart.');
      if (quantity !== undefined && (!Number.isInteger(quantity) || quantity < 1))
        throw new Error('Quantity must be a positive whole number.');
      const result: CartResponse = await boundRequest<CartResponse>(
        `/cart/${encodeURIComponent(id.current)}/items/${encodeURIComponent(itemId)}`,
        {
          method,
          ...(quantity !== undefined ? { body: JSON.stringify({ quantity }) } : {}),
        },
      );
      if (!result.cart?.id)
        throw new Error('Commerce did not return the updated cart. Refresh before retrying.');
      if (!isActive()) return;
      commit(result.cart);
      setAnnouncement(method === 'DELETE' ? 'Item removed from cart.' : 'Cart quantity updated.');
      emit(
        method === 'DELETE'
          ? { type: 'item-removed', itemId, isSample: false }
          : { type: 'quantity-changed', itemId, quantity: quantity ?? 0, isSample: false },
      );
    });
  }

  function applyDiscount(code: string): Promise<boolean> {
    return run('discount', async (): Promise<void> => {
      await hydrate();
      if (!isActive()) return;
      if (!id.current || !code.trim()) throw new Error('Add an item and enter a promotion code.');
      const codes: string[] = [
        ...new Set([
          ...(currentCart.current?.discounts?.flatMap((discount) => (discount.code ? [discount.code] : [])) ??
            []),
          code.trim(),
        ]),
      ];
      const result: CartResponse = await boundRequest<CartResponse>(
        `/cart/${encodeURIComponent(id.current)}/discounts`,
        { method: 'POST', body: JSON.stringify({ discountCodes: codes }) },
      );
      if (!result.cart?.id) throw new Error('Commerce did not return the updated cart.');
      if (!isActive()) return;
      commit(result.cart);
      setAnnouncement('Promotion codes updated.');
      emit({ type: 'discount-applied', code: code.trim() });
    });
  }

  function checkout(): Promise<boolean> {
    return run('checkout', async (): Promise<void> => {
      if (!config.checkoutSuccessPath) throw new Error('Checkout has not been enabled for this store.');
      await hydrate();
      if (!isActive()) return;
      if (!id.current || !currentCart.current?.lineItems?.length)
        throw new Error('Add an item before checking out.');
      const origin: string = window.location.origin;
      const successUrl: URL = new URL(config.checkoutSuccessPath, origin);
      successUrl.searchParams.set('orderId', id.current);
      const session: { url?: unknown } = await boundRequest('/checkout', {
        method: 'POST',
        body: JSON.stringify({
          draftOrderId: id.current,
          returnUrl: new URL(config.catalogPath, origin).href,
          successUrl: successUrl.href,
        }),
      });
      if (!isActive()) return;
      if (typeof session.url !== 'string' || !session.url.trim())
        throw new Error('Commerce did not return a checkout URL.');
      const url: URL = new URL(session.url, origin);
      if (url.protocol !== 'https:') throw new Error('Commerce returned an invalid checkout URL.');
      emit({ type: 'checkout-started', cartId: id.current });
      window.location.assign(url.href);
    });
  }

  return (
    <CommerceContext.Provider
      value={{
        config,
        connection,
        connectionError,
        retryConnection,
        theme,
        getSwatch,
        locale,
        cart,
        open,
        setOpen: (next) => {
          if (next && drawers.current === 0) return;
          if (next) rememberOpener();
          setOpen(next);
        },
        restoreFocus: () => {
          opener.current?.focus();
        },
        pending,
        hydrating,
        error,
        storageWarning,
        announcement,
        addItem,
        changeQuantity: (itemId, quantity) => mutateItem(itemId, 'PATCH', quantity),
        removeItem: (itemId) => mutateItem(itemId, 'DELETE'),
        applyDiscount,
        refresh,
        checkout,
      }}
    >
      <CartDrawerRegistry.Provider value={registerDrawer}>
        <SampleCartProvider
          enabled={connection === 'unbound'}
          announce={setAnnouncement}
          emit={emit}
          onAdd={(name) => {
            setAnnouncement(`${name} added to your sample cart.`);
            openDrawer();
            emit({ type: 'item-added', skuId: null, name, quantity: 1, isSample: true });
          }}
        >
          {children}
        </SampleCartProvider>
      </CartDrawerRegistry.Provider>
      <span className='commerce-sr-only' role='status' aria-live='polite'>
        {announcement}
      </span>
    </CommerceContext.Provider>
  );
}
