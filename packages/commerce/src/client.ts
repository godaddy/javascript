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

const INITIAL: CommerceSnapshot = Object.freeze({
  cart: null,
  status: 'idle',
  pending: 0,
  error: null,
  checkout: null,
  checkoutSource: null,
  checkoutComplete: false,
});

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

/** An isolated client. Creating it does not read browser storage or make requests. */
export class CommerceClient {
  readonly config: Readonly<CommerceConfig>;
  readonly storageKey: string;
  private snapshot = INITIAL;
  private listeners = new Set<() => void>();
  private queue: Promise<unknown> = Promise.resolve();
  private cartId: string | null = null;
  private hydrated = false;
  private listening = false;
  private checkoutPromise: Promise<Session> | null = null;
  private checkoutIntent: string | null = null;

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
    this.storageKey = `gddy:cart:v1:${[apiHost, this.config.clientId, this.config.storeId, this.config.channelId].map(encodeURIComponent).join(':')}`;
  }

  getSnapshot = (): CommerceSnapshot => this.snapshot;
  getServerSnapshot = (): CommerceSnapshot => INITIAL;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private update(patch: Partial<CommerceSnapshot>): void {
    this.snapshot = freeze({ ...this.snapshot, ...patch });
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

  private async readCart(): Promise<Cart | null> {
    if (!this.cartId) {
      this.update({ cart: null });
      return null;
    }
    const { storeId, clientId, channelId, apiHost } = this.config;
    const result = await api.getCartOrder(
      this.cartId,
      storeId,
      clientId,
      apiHost
    );
    const cart = result.orderById;
    if (!cart) {
      this.saveId(null);
      this.update({ cart: null });
      return null;
    }
    if (
      cart.context?.storeId !== storeId ||
      cart.context?.channelId !== channelId
    ) {
      this.saveId(null);
      this.update({ cart: null });
      throw new CommerceError(
        'CART_SCOPE_MISMATCH',
        'The saved cart belongs to a different storefront'
      );
    }
    this.update({ cart });
    return cart;
  }

  private run<T>(operation: () => Promise<T>): Promise<T> {
    this.update({
      pending: this.snapshot.pending + 1,
      error: null,
      status: 'loading',
    });
    const execute = async () => {
      // Web Locks serialize tabs on browsers that support them. Mutations are never automatically retried.
      if (typeof navigator !== 'undefined' && navigator.locks) {
        return navigator.locks.request(this.storageKey, operation);
      }
      return operation();
    };
    const result = this.queue.then(execute).then(
      value => {
        this.update({
          pending: this.snapshot.pending - 1,
          status: this.snapshot.pending > 1 ? 'loading' : 'ready',
          error: null,
        });
        return value;
      },
      error => {
        const failure =
          error instanceof Error ? error : new Error(String(error));
        this.update({
          pending: this.snapshot.pending - 1,
          status: 'error',
          error: failure,
        });
        throw failure;
      }
    );
    this.queue = result.catch(() => undefined);
    return result;
  }

  private async hydrate(): Promise<void> {
    if (!this.listening && typeof window !== 'undefined') {
      window.addEventListener('storage', this.onStorage);
      this.listening = true;
    }
    const id = this.readId();
    if (!this.hydrated || id !== this.cartId) {
      this.cartId = id;
      await this.readCart();
      this.hydrated = true;
    }
  }

  ready(): Promise<void> {
    return this.run(() => this.hydrate());
  }
  refresh(): Promise<Cart | null> {
    return this.run(async () => {
      this.cartId = this.readId();
      const cart = await this.readCart();
      this.hydrated = true;
      return cart;
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
      await this.hydrate();
      // Fetch again after acquiring the tab lock to avoid stale quantity updates.
      await this.readCart();
      const { storeId, channelId, clientId, apiHost } = this.config;
      const { sku } = await api.getSku(
        { id: skuId },
        storeId,
        clientId,
        apiHost
      );
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
      if (!this.cartId) {
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
        if (!created.addDraftOrder?.id)
          throw new CommerceError(
            'CART_CREATE_FAILED',
            'Commerce did not return a cart ID'
          );
        // Preserve the ID even if the subsequent SKU add fails.
        this.saveId(created.addDraftOrder.id);
      }
      const orderId = this.cartId;
      if (!orderId)
        throw new CommerceError(
          'CART_CREATE_FAILED',
          'Commerce did not return a cart ID'
        );
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
            name: sku.name,
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
      await this.hydrate();
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
      await this.hydrate();
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

  private startCheckout(
    source: 'cart' | 'buy-now' | 'payment',
    intent: string,
    input: () => Promise<Pick<SessionInput, 'draftOrderId' | 'lineItems'>>
  ): Promise<Session> {
    if (this.checkoutPromise) {
      if (this.checkoutIntent === intent) return this.checkoutPromise;
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
    this.checkoutIntent = intent;
    this.checkoutPromise = this.run(async () => {
      const { getAccessToken, storeId, channelId, apiHost, checkout } =
        this.config;
      if (!getAccessToken)
        throw new CommerceError(
          'OAUTH_REQUIRED',
          'Configure getAccessToken using your existing OAuth client to enable checkout'
        );
      const token = await getAccessToken();
      if (!token)
        throw new CommerceError(
          'OAUTH_REQUIRED',
          'The OAuth client did not return an access token'
        );
      const purchase = await input();
      const currentUrl =
        typeof location === 'undefined' ? undefined : location.href;
      const returnUrl = checkout?.returnUrl || currentUrl;
      const successUrl = checkout?.successUrl || currentUrl;
      if (!returnUrl || !successUrl)
        throw new CommerceError(
          'RETURN_URL_REQUIRED',
          'Checkout requires return and success URLs'
        );
      for (const url of [returnUrl, successUrl]) {
        if (!['https:', 'http:'].includes(new URL(url).protocol))
          throw new CommerceError(
            'INVALID_URL',
            'Checkout navigation URLs must use HTTP or HTTPS'
          );
      }
      const session = await api.createCheckoutSession(
        { ...checkout, ...purchase, storeId, channelId, returnUrl, successUrl },
        { accessToken: token, apiHost }
      );
      if (!session?.id || !session.token || !session.url)
        throw new CommerceError(
          'CHECKOUT_CREATE_FAILED',
          'Commerce did not return a complete checkout session'
        );
      if (session.storeId !== storeId || session.channelId !== channelId)
        throw new CommerceError(
          'CHECKOUT_SCOPE_MISMATCH',
          'Checkout does not match the configured storefront'
        );
      const completeSession = {
        ...session,
        id: session.id,
        token: session.token,
        url: session.url,
      };
      this.update({
        checkout: completeSession,
        checkoutSource: source,
        checkoutComplete: false,
      });
      return completeSession;
    }).finally(() => {
      this.checkoutPromise = null;
      this.checkoutIntent = null;
    });
    return this.checkoutPromise;
  }

  checkout(): Promise<Session> {
    return this.startCheckout('cart', 'cart', async () => {
      await this.hydrate();
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
      'buy-now',
      JSON.stringify(['buy-now', skuId, count]),
      async () => ({
        lineItems: [{ skuId, quantity: count }],
      })
    );
  }

  pay(reference: string): Promise<Session> {
    identifier(reference, 'payment reference');
    return this.startCheckout(
      'payment',
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

  /** Called only after the Checkout component reports accepted confirmation, never from a return URL. */
  completeCheckout(): void {
    if (!this.snapshot.checkout || this.snapshot.checkoutComplete) return;
    const purchasedId =
      this.snapshot.checkoutSource === 'cart'
        ? this.snapshot.checkout.draftOrder?.id
        : null;
    if (
      purchasedId &&
      this.cartId === purchasedId &&
      this.readId() === purchasedId
    ) {
      this.saveId(null);
      this.update({ cart: null });
    }
    this.update({ checkoutComplete: true });
  }

  closeCheckout(): void {
    this.update({
      checkout: null,
      checkoutSource: null,
      checkoutComplete: false,
    });
  }
}
