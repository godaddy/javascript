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
  readonly status: 'idle' | 'loading' | 'ready' | 'error';
  readonly pending: number;
  readonly error: Error | null;
  readonly checkout: Session | null;
  readonly checkoutSource: 'cart' | 'buy-now' | 'payment' | null;
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
