import { useQuery } from '@tanstack/react-query';
import {
  type CSSProperties,
  createContext,
  type ReactElement,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ApiError, CartIdStorage, checkedFetch, message, request, type StorefrontConfig } from './api';
import { type AddToCartItemInput, addToCart, type CartOrder } from './cart-model';

interface CartResponse {
  cart: CartOrder | null;
}
export interface CommerceContextValue {
  connection: 'loading' | 'ready' | 'error';
  connectionError: string | null;
  retryConnection: () => void;
  theme: StorefrontTheme;
  config: StorefrontConfig;
  cart: CartOrder | null;
  open: boolean;
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
}

async function loadConfig(
  signal: AbortSignal,
): Promise<Pick<StorefrontConfig, 'cartScope' | 'currencyCode'>> {
  const config = await request<Pick<StorefrontConfig, 'cartScope' | 'currencyCode'>>('/config', { signal });
  if (
    !config ||
    typeof config.cartScope !== 'string' ||
    !config.cartScope.trim() ||
    typeof config.currencyCode !== 'string' ||
    !/^[A-Z]{3}$/.test(config.currencyCode)
  ) {
    throw new Error('The store returned invalid configuration.');
  }
  return config;
}

export function CommerceProvider({
  children,
  catalogPath = '/shop',
  productPath = '/products',
  checkoutSuccessPath,
  theme = {},
}: CommerceProviderProps): ReactElement {
  const config = useQuery({
    retry: false,
    queryKey: ['commerce', 'configuration'],
    queryFn: ({ signal }) => loadConfig(signal),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
  return (
    <BoundCommerceProvider
      config={{
        cartScope: '',
        currencyCode: 'USD',
        ...config.data,
        catalogPath,
        productPath,
        checkoutSuccessPath,
      }}
      connection={config.isError ? 'error' : config.data ? 'ready' : 'loading'}
      connectionError={config.isError ? message(config.error) : null}
      retryConnection={() => {
        void config.refetch();
      }}
      theme={theme}
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
}: {
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
  const session = useMemo(() => ({ cartIdStorage, ready }), [cartIdStorage, ready]);
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
  }, [cartIdStorage, ready]);

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
      setOpen(true);
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
      {children}
      <span className='commerce-sr-only' role='status' aria-live='polite'>
        {announcement}
      </span>
    </CommerceContext.Provider>
  );
}
