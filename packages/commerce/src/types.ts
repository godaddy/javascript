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

export interface CommerceConfig {
  clientId: string;
  storeId: string;
  channelId: string;
  /** Host name only, for example api.ote-godaddy.com. */
  apiHost?: string;
  locale?: string;
  /** Use the existing OAuth client. Never put a client secret in browser code. */
  getAccessToken?: () => Promise<string>;
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
  /** Resolve application-priced invoices/deposits on your server, using an application reference. */
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
