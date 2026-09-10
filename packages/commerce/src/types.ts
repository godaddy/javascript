import type {
  CheckoutSession,
  CreateCheckoutSessionInputWithKebabCase,
  getCartOrder,
} from '@godaddy/react/client';

export type Cart = NonNullable<
  Awaited<ReturnType<typeof getCartOrder>>['orderById']
>;
export type Session = NonNullable<CheckoutSession> & {
  id: string;
  url: string;
};
export type SessionInput = CreateCheckoutSessionInputWithKebabCase;

/**
 * What `createSession` receives: the complete session input plus the
 * application payment reference for `pay()`. The server owns store, channel,
 * merchant settings, and pricing; treat every field as untrusted browser input.
 */
export type SessionRequest = SessionInput & {
  /**
   * Present for `pay()`. Price the charge on the server from this reference.
   * `lineItems` is omitted unless a browser `resolvePayment` is configured, and
   * even then the server must not trust its amounts.
   */
  reference?: string;
};

export interface CommerceConfig {
  clientId: string;
  storeId: string;
  channelId: string;
  /** Host name only, for example api.ote-godaddy.com. */
  apiHost?: string;
  locale?: string;
  /**
   * Create the hosted checkout session on your own server. This is the
   * supported checkout path: the browser never holds a Commerce OAuth token.
   * Receives the session request; return the session Commerce created (at
   * least its `id` and `url`).
   */
  createSession?: (input: SessionRequest) => Promise<Partial<Session> | null>;
  /**
   * Advanced: create sessions from the browser with a token from this callback.
   * Commerce has no shopper-scoped grant, so any token that can create a
   * session can also act on the merchant's orders. Only use it with a
   * short-lived, checkout-only token, and set `dangerouslyAllowBrowserToken`.
   * Ignored when `createSession` is configured.
   */
  getAccessToken?: () => Promise<string>;
  /**
   * Required to use `getAccessToken`. Confirms the token is safe to expose to
   * every visitor of the page. Do not set this to work around the check.
   */
  dangerouslyAllowBrowserToken?: boolean;
  /** Merchant settings obtained through the existing Commerce configuration APIs. */
  checkout?: Omit<
    SessionInput,
    | 'storeId'
    | 'channelId'
    | 'draftOrderId'
    | 'lineItems'
    | 'returnUrl'
    | 'successUrl'
  > & {
    returnUrl?: string;
    successUrl?: string;
  };
  /**
   * Browser-side resolver for `pay()` when using `getAccessToken`. Not needed
   * with `createSession`, which receives the reference and prices it on the
   * server. A browser resolver is never a price authorization boundary.
   */
  resolvePayment?: (reference: string) => Promise<NonCatalogPayment>;
}

export interface NonCatalogPayment {
  name: string;
  unitAmount: number;
  currencyCode: string;
  quantity?: number;
}

export interface CommerceSnapshot {
  readonly cart: Cart | null;
  /** Derived from `pending`, `error`, and whether the saved cart has been read. */
  readonly status: 'idle' | 'loading' | 'ready' | 'error';
  /** Operations in flight, including hydration and checkout session creation. */
  readonly pending: number;
  /** The most recently settled operation's failure, cleared when the next one starts. */
  readonly error: Error | null;
  /** The hosted checkout session until `closeCheckout()` releases it. */
  readonly checkout: Session | null;
}

export class CommerceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = 'CommerceError';
  }
}
