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
import { ApiError, CartIdStorage, checkedFetch, message, request, type StorefrontConfig } from './api';
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
  config: StorefrontConfig;
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

export type StorefrontTheme = CSSProperties & {
  '--commerce-accent'?: string;
  '--commerce-accent-hover'?: string;
  '--commerce-on-accent'?: string;
  '--commerce-surface'?: string;
  '--commerce-text'?: string;
  '--commerce-radius'?: string;
};

export interface CommerceProviderProps {
  children: ReactNode;
  catalogPath?: string;
  productPath?: string;
  /** Applied to storefront surfaces and the portalled cart drawer. */
  theme?: StorefrontTheme;
  /** Set only when your server has enabled checkout and this return route exists. */
  checkoutSuccessPath?: string;
  /**
   * Called after an item is added, live or sample. With a drawer mounted, the drawer also opens. Without one, such as
   * on a site with a cart page, use it to confirm the add.
   */
  onItemAdded?: (item: AddedCartItem) => void;
}

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
  onItemAdded,
}: CommerceProviderProps): ReactElement {
  const config = useQuery({
    retry: false,
    queryKey: ['commerce', 'configuration'],
    queryFn: ({ signal }) => loadConfig(signal),
    staleTime: 30_000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    // Errors after an unbound response also need recovery; stale data never grants eligibility.
    refetchInterval: (query) =>
      query.state.data?.state === 'unbound' || query.state.data?.state === 'connecting' ? 5_000 : false,
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
      connectionError={connection === 'error' ? message(config.error) : null}
      retryConnection={() => {
        void config.refetch();
      }}
      theme={theme}
      onItemAdded={onItemAdded}
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
  onItemAdded,
}: {
  onItemAdded?: (item: AddedCartItem) => void;
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

  const added = useRef(onItemAdded);
  added.current = onItemAdded;
  const drawers = useRef<number>(0);
  const registerDrawer = useCallback((): (() => void) => {
    drawers.current += 1;
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
  function run(operation: () => Promise<void>, loading: boolean = false): Promise<boolean> {
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
        if (isActive()) setError(message(cause));
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
    return run(hydrate, true);
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
    return run(async (): Promise<void> => {
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
      added.current?.({ name: item.name, quantity: item.quantity, isSample: false });
    });
  }

  function mutateItem(itemId: string, method: string, quantity?: number): Promise<boolean> {
    return run(async (): Promise<void> => {
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
    });
  }

  function applyDiscount(code: string): Promise<boolean> {
    return run(async (): Promise<void> => {
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
    });
  }

  function checkout(): Promise<boolean> {
    return run(async (): Promise<void> => {
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
          onAdd={(name) => {
            setAnnouncement(`${name} added to your sample cart.`);
            openDrawer();
            added.current?.({ name, quantity: 1, isSample: true });
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
