import * as api from '@godaddy/react/client';
import {
  type Cart,
  type CommerceConfig,
  CommerceError,
  type CommerceSnapshot,
  type NonCatalogPayment,
  type Session,
  type SessionInput,
} from './types';
import { navigationUrl } from './url';

const INITIAL: CommerceSnapshot = Object.freeze({
  cart: null,
  status: 'idle',
  pending: 0,
  error: null,
  checkout: null,
});

type Purchase = Pick<SessionInput, 'draftOrderId' | 'lineItems'>;

function identifier(value: string, name: string): string {
  if (typeof value !== 'string' || !value.trim())
    throw new CommerceError('INVALID_INPUT', `${name} is required`);
  return value.trim();
}

function quantity(value: number, allowZero = false): number {
  if (!Number.isSafeInteger(value) || value < (allowZero ? 0 : 1)) {
    throw new CommerceError(
      'INVALID_QUANTITY',
      'Quantity must be a positive whole number'
    );
  }
  return value;
}

function freeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) freeze(child);
  }
  return value;
}

/**
 * Commerce may report a deleted or unknown order as a GraphQL error rather than
 * a null result. Treat that like an empty result so a stale saved ID is released.
 */
function isMissingOrderError(error: unknown): boolean {
  if (!(error instanceof Error) || error.name !== 'GraphQLErrorWithCodes')
    return false;
  const { codes = [], messages = [] } = error as Error & {
    codes?: string[];
    messages?: string[];
  };
  return (
    codes.some(code => /NOT_FOUND/i.test(code)) ||
    messages.some(message => /\bnot found\b/i.test(message))
  );
}

/** An isolated client. Creating it does not read browser storage or make requests. */
export class CommerceClient {
  readonly config: Readonly<CommerceConfig>;
  readonly storageKey: string;
  private snapshot = INITIAL;
  private listeners = new Set<() => void>();
  /** Local write queue; also the order in which the cross-tab lock is requested. */
  private queue: Promise<unknown> = Promise.resolve();
  private cartId: string | null = null;
  /** True once the saved cart has been read (or found absent) at least once. */
  private hydrated = false;
  private readyPromise: Promise<void> | null = null;
  private listening = false;
  private activeCheckout: { intent: string; promise: Promise<Session> } | null =
    null;

  constructor(config: CommerceConfig) {
    const apiHost = config.apiHost || 'api.godaddy.com';
    if (!/^[a-z0-9.-]+$/i.test(apiHost))
      throw new CommerceError(
        'INVALID_HOST',
        'apiHost must be a host name without a path or scheme'
      );
    this.config = Object.freeze({
      ...config,
      clientId: identifier(config.clientId, 'clientId'),
      storeId: identifier(config.storeId, 'storeId'),
      channelId: identifier(config.channelId, 'channelId'),
      apiHost,
    });
    const scope = [apiHost, this.config.clientId, this.config.storeId];
    scope.push(this.config.channelId);
    this.storageKey = `gddy:cart:v1:${scope.map(encodeURIComponent).join(':')}`;
  }

  getSnapshot = (): CommerceSnapshot => this.snapshot;
  getServerSnapshot = (): CommerceSnapshot => INITIAL;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private update(patch: Partial<Omit<CommerceSnapshot, 'status'>>): void {
    const next = { ...this.snapshot, ...patch };
    let status: CommerceSnapshot['status'] = this.hydrated ? 'ready' : 'idle';
    if (next.pending > 0) status = 'loading';
    else if (next.error) status = 'error';
    this.snapshot = freeze({ ...next, status });
    for (const listener of this.listeners) listener();
  }

  private readId(): string | null {
    if (typeof window === 'undefined') return this.cartId;
    try {
      return window.localStorage.getItem(this.storageKey);
    } catch {
      return this.cartId;
    }
  }

  private saveId(id: string | null): void {
    this.cartId = id;
    if (typeof window === 'undefined') return;
    try {
      if (id) window.localStorage.setItem(this.storageKey, id);
      else window.localStorage.removeItem(this.storageKey);
    } catch {
      /* In-memory cart remains usable when storage is unavailable. */
    }
  }

  private onStorage = (event: StorageEvent): void => {
    if (event.key !== null && event.key !== this.storageKey) return;
    // Rehydrate inside the same queue as local mutations.
    void this.refresh().catch(() => {
      /* refresh publishes the error to subscribers. */
    });
  };

  dispose(): void {
    if (typeof window !== 'undefined')
      window.removeEventListener('storage', this.onStorage);
    this.listening = false;
    this.listeners.clear();
  }

  /** Follow other tabs' cart changes and pick up the saved cart ID. */
  private sync(): void {
    if (!this.listening && typeof window !== 'undefined') {
      window.addEventListener('storage', this.onStorage);
      this.listening = true;
    }
    this.cartId = this.readId();
  }

  private async readCart(): Promise<Cart | null> {
    const { storeId, clientId, channelId, apiHost } = this.config;
    let cart: Cart | null | undefined = null;
    if (this.cartId) {
      try {
        cart = (await api.getCartOrder(this.cartId, storeId, clientId, apiHost))
          .orderById;
      } catch (error) {
        if (!isMissingOrderError(error)) throw error;
      }
      if (!cart) this.saveId(null);
    }
    this.hydrated = true;
    if (
      cart &&
      (cart.context?.storeId !== storeId ||
        cart.context?.channelId !== channelId)
    ) {
      this.saveId(null);
      this.update({ cart: null });
      throw new CommerceError(
        'CART_SCOPE_MISMATCH',
        'The saved cart belongs to a different storefront'
      );
    }
    this.update({ cart: cart ?? null });
    return cart ?? null;
  }

  /** Publish pending/error state around an operation. */
  private async track<T>(operation: () => Promise<T>): Promise<T> {
    this.update({ pending: this.snapshot.pending + 1, error: null });
    try {
      const value = await operation();
      this.update({ pending: this.snapshot.pending - 1, error: null });
      return value;
    } catch (error) {
      const failure = error instanceof Error ? error : new Error(String(error));
      this.update({ pending: this.snapshot.pending - 1, error: failure });
      throw failure;
    }
  }

  /**
   * Serialize writes behind earlier writes in this tab and, where Web Locks
   * exist, behind writes from other same-origin tabs. Writes are never retried.
   */
  private run<T>(operation: () => Promise<T>): Promise<T> {
    return this.track(() => {
      const result = this.queue.then(() => {
        if (typeof navigator !== 'undefined' && navigator.locks)
          return navigator.locks.request(this.storageKey, operation);
        return operation();
      });
      this.queue = result.catch(() => undefined);
      return result;
    });
  }

  /**
   * Read the saved cart once. Later calls resolve immediately; a failed read can
   * be retried. Reads do not take the write lock.
   */
  ready(): Promise<void> {
    if (this.readyPromise) return this.readyPromise;
    if (this.hydrated) return Promise.resolve();
    this.readyPromise = this.track(async () => {
      this.sync();
      await this.readCart();
    }).finally(() => {
      this.readyPromise = null;
    });
    return this.readyPromise;
  }

  refresh(): Promise<Cart | null> {
    return this.run(() => {
      this.sync();
      return this.readCart();
    });
  }

  private assertEditable(): void {
    if (this.snapshot.checkout)
      throw new CommerceError(
        'CHECKOUT_ACTIVE',
        'Close the current checkout before changing the cart'
      );
  }

  addItem(skuId: string, count = 1): Promise<Cart | null> {
    identifier(skuId, 'skuId');
    quantity(count);
    return this.run(async () => {
      this.assertEditable();
      this.sync();
      const { storeId, channelId, clientId, apiHost } = this.config;
      // Read the cart inside the lock so merged quantities are current; the SKU lookup is independent.
      const [, { sku }] = await Promise.all([
        this.readCart(),
        api.getSku({ id: skuId }, storeId, clientId, apiHost),
      ]);
      const currencyCode = sku?.prices?.edges?.[0]?.node?.value?.currencyCode;
      if (!sku?.id || !sku.name || !currencyCode)
        throw new CommerceError(
          'SKU_UNAVAILABLE',
          'The selected SKU is unavailable or has no price'
        );
      if (
        this.snapshot.cart?.totals?.total?.currencyCode &&
        this.snapshot.cart.totals.total.currencyCode !== currencyCode
      ) {
        throw new CommerceError(
          'CURRENCY_MISMATCH',
          'All cart items must use the same currency'
        );
      }
      let orderId = this.cartId;
      if (!orderId) {
        // Match the storefront API contract: create the draft first, then add
        // the SKU below so Commerce resolves pricing. Inline draft line items
        // require caller-supplied amounts and are not the catalog add path.
        const zero = { value: 0, currencyCode };
        const created = await api.createCartOrder(
          {
            context: { storeId, channelId },
            totals: {
              subTotal: zero,
              shippingTotal: zero,
              taxTotal: zero,
              discountTotal: zero,
              feeTotal: zero,
              total: zero,
            },
          },
          storeId,
          clientId,
          apiHost
        );
        orderId = created.addDraftOrder?.id ?? null;
        if (!orderId)
          throw new CommerceError(
            'CART_CREATE_FAILED',
            'Commerce did not return a cart ID'
          );
        // Preserve the ID even if the subsequent SKU add fails.
        this.saveId(orderId);
      }
      const existing = this.snapshot.cart?.lineItems?.find(
        item => item.skuId === skuId
      );
      if (existing) {
        await api.updateCartLineItem(
          {
            id: existing.id,
            orderId,
            quantity: quantity((existing.quantity || 0) + count),
          },
          storeId,
          clientId,
          apiHost
        );
      } else {
        await api.addCartLineItem(
          {
            orderId,
            skuId,
            // Prefer the merchant-facing label; `name` is the catalog slug.
            name: sku.label || sku.name,
            quantity: count,
            fulfillmentMode: 'NONE',
            status: 'DRAFT',
          },
          storeId,
          clientId,
          apiHost
        );
      }
      return this.readCart();
    });
  }

  setQuantity(lineId: string, count: number): Promise<Cart | null> {
    identifier(lineId, 'lineId');
    quantity(count, true);
    return this.run(async () => {
      this.assertEditable();
      this.sync();
      await this.readCart();
      if (
        !this.cartId ||
        !this.snapshot.cart?.lineItems?.some(item => item.id === lineId)
      )
        throw new CommerceError(
          'LINE_NOT_FOUND',
          'This cart item no longer exists'
        );
      const { storeId, clientId, apiHost } = this.config;
      if (count === 0)
        await api.deleteCartLineItem(
          { id: lineId, orderId: this.cartId },
          storeId,
          clientId,
          apiHost
        );
      else
        await api.updateCartLineItem(
          { id: lineId, orderId: this.cartId, quantity: count },
          storeId,
          clientId,
          apiHost
        );
      return this.readCart();
    });
  }

  removeItem(lineId: string): Promise<Cart | null> {
    return this.setQuantity(lineId, 0);
  }

  applyDiscount(code: string): Promise<Cart | null> {
    return this.run(async () => {
      this.assertEditable();
      this.sync();
      await this.readCart();
      if (!this.cartId)
        throw new CommerceError(
          'EMPTY_CART',
          'Add an item before applying a discount'
        );
      const { storeId, clientId, apiHost } = this.config;
      await api.applyCartDiscountCodes(
        {
          orderId: this.cartId,
          discountCodes: code.trim() ? [code.trim()] : [],
        },
        storeId,
        clientId,
        apiHost
      );
      return this.readCart();
    });
  }

  /** Return and success URLs default to the current page; relative overrides resolve against it. */
  private navigation(): { returnUrl: string; successUrl: string } {
    const page = typeof location === 'undefined' ? undefined : location.href;
    const { checkout } = this.config;
    const returnUrl = checkout?.returnUrl || page;
    const successUrl = checkout?.successUrl || page;
    if (!returnUrl || !successUrl)
      throw new CommerceError(
        'RETURN_URL_REQUIRED',
        'Checkout requires return and success URLs'
      );
    return {
      returnUrl: navigationUrl(returnUrl, page),
      successUrl: navigationUrl(successUrl, page),
    };
  }

  /**
   * One checkout starts at a time. Identical concurrent requests share the
   * in-flight session; different purchases are rejected. The OAuth token is
   * resolved before the cart lock is taken so a slow token callback cannot
   * block cart changes in other tabs.
   */
  private startCheckout(
    intent: string,
    input: () => Promise<Purchase>
  ): Promise<Session> {
    if (this.activeCheckout) {
      if (this.activeCheckout.intent === intent)
        return this.activeCheckout.promise;
      return Promise.reject(
        new CommerceError(
          'CHECKOUT_ACTIVE',
          'Another purchase is starting checkout'
        )
      );
    }
    if (this.snapshot.checkout)
      return Promise.reject(
        new CommerceError('CHECKOUT_ACTIVE', 'A checkout is already open')
      );
    const promise = this.track(async () => {
      const {
        getAccessToken,
        createSession,
        storeId,
        channelId,
        apiHost,
        checkout,
      } = this.config;
      if (!createSession && !getAccessToken)
        throw new CommerceError(
          'OAUTH_REQUIRED',
          'Configure createSession (server-side) or getAccessToken using your existing OAuth client to enable checkout'
        );
      // Resolve credentials before taking the cart lock so a slow callback cannot block other tabs.
      const token = createSession ? null : await getAccessToken?.();
      if (!createSession && !token)
        throw new CommerceError(
          'OAUTH_REQUIRED',
          'The OAuth client did not return an access token'
        );
      const navigation = this.navigation();
      return this.run(async () => {
        const purchase = await input();
        const request: SessionInput = {
          ...checkout,
          ...purchase,
          storeId,
          channelId,
          ...navigation,
        };
        const session = createSession
          ? await createSession(request)
          : await api.createCheckoutSession(request, {
              accessToken: token as string,
              apiHost,
            });
        if (!session?.id || !session.url)
          throw new CommerceError(
            'CHECKOUT_CREATE_FAILED',
            'Commerce did not return a complete checkout session'
          );
        // Server-created sessions may omit scope fields; when present they must match.
        if (
          (session.storeId ?? storeId) !== storeId ||
          (session.channelId ?? channelId) !== channelId
        )
          throw new CommerceError(
            'CHECKOUT_SCOPE_MISMATCH',
            'Checkout does not match the configured storefront'
          );
        const complete = {
          ...session,
          id: session.id,
          url: session.url,
        } as Session;
        this.update({ checkout: complete });
        return complete;
      });
    }).finally(() => {
      this.activeCheckout = null;
    });
    this.activeCheckout = { intent, promise };
    return promise;
  }

  checkout(): Promise<Session> {
    return this.startCheckout('cart', async () => {
      this.sync();
      const cart = await this.readCart();
      if (!cart?.lineItems?.length)
        throw new CommerceError(
          'EMPTY_CART',
          'Add an item before checking out'
        );
      return { draftOrderId: cart.id };
    });
  }

  buyNow(skuId: string, count = 1): Promise<Session> {
    identifier(skuId, 'skuId');
    quantity(count);
    return this.startCheckout(
      JSON.stringify(['buy-now', skuId, count]),
      async () => ({ lineItems: [{ skuId, quantity: count }] })
    );
  }

  pay(reference: string): Promise<Session> {
    identifier(reference, 'payment reference');
    return this.startCheckout(
      JSON.stringify(['payment', reference]),
      async () => {
        if (!this.config.resolvePayment)
          throw new CommerceError(
            'PAYMENT_RESOLVER_REQUIRED',
            'Configure resolvePayment for invoice or deposit payments'
          );
        const payment: NonCatalogPayment =
          await this.config.resolvePayment(reference);
        identifier(payment.name, 'payment name');
        quantity(payment.quantity ?? 1);
        if (
          !Number.isSafeInteger(payment.unitAmount) ||
          payment.unitAmount < 0 ||
          !/^[A-Z]{3}$/.test(payment.currencyCode)
        )
          throw new CommerceError(
            'INVALID_PAYMENT',
            'Payment requires an integer minor-unit amount and an ISO currency code'
          );
        return {
          lineItems: [
            {
              quantity: payment.quantity ?? 1,
              lineItemData: {
                name: payment.name,
                priceData: {
                  unitAmount: payment.unitAmount,
                  currencyCode: payment.currencyCode,
                },
              },
            },
          ],
        };
      }
    );
  }

  /** Release the hosted session so the cart can change again. The saved cart is kept. */
  closeCheckout(): void {
    this.update({ checkout: null });
  }
}
