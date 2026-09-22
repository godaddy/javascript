/**
 * GoDaddy Commerce hosted checkout GraphQL kit.
 *
 * Server-only. Loaded by `src/server/api/commerce/checkout/POST.ts` to mint an
 * OAuth Bearer token (client_credentials grant) and create a hosted checkout
 * session. Never import this file from the browser — `getOAuthAccessToken` would expose `clientSecret`.
 *
 * Common flows handled by the checkout proxy route:
 * - Buy Now: lineItems: [{ skuId, quantity }] in the request body.
 * - Cart checkout: existing draftOrderId in the request body.
 * - Non-catalog: lineItems: [{ lineItemData: { name, priceData }, quantity }] — no SKU, no catalog product.
 * - Existing custom cart: convert your cart into lineItems, then post to the route.
 */

import type { Money } from './gql';

export const AAB_CHECKOUT_SOURCE_APP = 'airo.ai.builder';
export const AAB_CHECKOUT_OWNER = 'urn:com.godaddy:airo.commerce.order';
/**
 * The hosted checkout page will not render a card form without this. GDC's
 * checkout GraphQL accepts a session with no payment methods and returns 200,
 * so an omitted or deleted default fails silently — the shopper sees "No
 * payment methods available" with no error anywhere in the request/response
 * cycle. Do not remove this while debugging an unrelated checkout issue.
 */
export const AAB_CHECKOUT_DEFAULT_PAYMENT_METHODS: CheckoutSessionPaymentMethodsInput = {
  card: {
    processor: 'godaddy',
    checkoutTypes: ['standard'],
  },
};

export interface OAuthTokenResponse {
  access_token: string;
  scope: string;
  expires_in: number;
  token_type?: string;
}

export interface OAuthTokenInput {
  clientId: string;
  clientSecret: string;
  apiBaseUrl: string;
  /** Defaults to commerce.product:read to match current checkout integration. */
  scope?: string;
  fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

export interface CheckoutEndpointInput {
  apiBaseUrl: string;
}

export interface CommerceApiEndpointInput {
  apiBaseUrl: string;
}

export interface AuthorizationHeadersInput {
  accessToken: string;
}

export interface CheckoutSessionLineItemPriceDataInput {
  /** Price per unit in the currency's smallest unit (e.g. cents for USD). */
  unitAmount: number;
  /** ISO 4217 currency code. If omitted, the server injects it from GODADDY_CURRENCY_CODE. */
  currencyCode?: string;
}

export interface CheckoutSessionLineItemDataInput {
  name: string;
  priceData: CheckoutSessionLineItemPriceDataInput;
}

/**
 * Discriminated union: exactly one of skuId or lineItemData per line item.
 * - Catalog flow:     { skuId, quantity }
 * - Non-catalog flow: { lineItemData, quantity }
 * Providing both is a type error.
 */
export type CheckoutSessionLineItemInput =
  | { skuId: string; quantity: number; lineItemData?: never }
  | { lineItemData: CheckoutSessionLineItemDataInput; quantity: number; skuId?: never };

export interface CheckoutCustomerContactInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  address?: {
    addressLine1?: string;
    addressLine2?: string;
    addressLine3?: string;
    adminArea1?: string;
    adminArea2?: string;
    adminArea3?: string;
    adminArea4?: string;
    postalCode?: string;
    countryCode?: string;
  };
}

export interface CheckoutCustomerInput {
  billing?: CheckoutCustomerContactInput;
  shipping?: CheckoutCustomerContactInput;
}

export interface CheckoutSessionPaymentMethodConfigInput {
  processor?: string;
  checkoutTypes?: string[];
}

export interface CheckoutSessionPaymentMethodsInput {
  ach?: CheckoutSessionPaymentMethodConfigInput | null;
  applePay?: CheckoutSessionPaymentMethodConfigInput | null;
  card?: CheckoutSessionPaymentMethodConfigInput | null;
  ccavenue?: CheckoutSessionPaymentMethodConfigInput | null;
  express?: CheckoutSessionPaymentMethodConfigInput | null;
  googlePay?: CheckoutSessionPaymentMethodConfigInput | null;
  mercadopago?: CheckoutSessionPaymentMethodConfigInput | null;
  offline?: CheckoutSessionPaymentMethodConfigInput | null;
  paypal?: CheckoutSessionPaymentMethodConfigInput | null;
  paze?: CheckoutSessionPaymentMethodConfigInput | null;
}

export interface CheckoutAppearanceInput {
  theme?: 'base' | 'orange' | 'purple' | string;
  /** Checkout API expects camelCase CSS variable names. */
  variables?: Record<string, string | number | null | undefined>;
}

export interface CheckoutSessionShippingOptionsInput {
  fulfillmentLocationId?: string;
  originAddress?: Record<string, unknown>;
}

export interface CreateCheckoutSessionInput {
  storeId: string;
  returnUrl: string;
  successUrl: string;
  /** Use draftOrderId for a custom cart/draft-order checkout flow. */
  draftOrderId?: string;
  /** Use lineItems for Buy Now or when building checkout from a custom cart. */
  lineItems?: CheckoutSessionLineItemInput[];
  channelId?: string;
  sourceApp?: string;
  owner?: string;
  customerId?: string;
  customer?: CheckoutCustomerInput;
  storeName?: string;
  environment?: string;
  url?: string;
  expiresAt?: string;
  enabledLocales?: string[];
  enabledPaymentProviders?: string[];
  paymentMethods?: CheckoutSessionPaymentMethodsInput;
  appearance?: CheckoutAppearanceInput;
  enableAddressAutocomplete?: boolean;
  enableBillingAddressCollection?: boolean;
  enableLocalPickup?: boolean;
  enableNotesCollection?: boolean;
  enablePaymentMethodCollection?: boolean;
  enablePhoneCollection?: boolean;
  enablePromotionCodes?: boolean;
  enableShipping?: boolean;
  enableShippingAddressCollection?: boolean;
  enableSurcharge?: boolean;
  enableTaxCollection?: boolean;
  enableTips?: boolean;
  /** Merchant shipping options synchronized server-side from Commerce. */
  shipping?: CheckoutSessionShippingOptionsInput;
  /** Escape hatch for newer checkout fields without updating this copy/paste kit. */
  [key: string]: unknown;
}

export interface CheckoutPaymentMethodConfig {
  processor?: string | null;
  checkoutTypes?: string[] | null;
}

export interface CheckoutSessionResult {
  id?: string | null;
  token?: string | null;
  url?: string | null;
  sourceApp?: string | null;
  returnUrl?: string | null;
  successUrl?: string | null;
  storeId?: string | null;
  businessId?: string | null;
  channelId?: string | null;
  customerId?: string | null;
  storeName?: string | null;
  environment?: string | null;
  enableTips?: boolean | null;
  enabledLocales?: string[] | null;
  enableSurcharge?: boolean | null;
  enableLocalPickup?: boolean | null;
  enableShipping?: boolean | null;
  enablePhoneCollection?: boolean | null;
  enableNotesCollection?: boolean | null;
  enablePromotionCodes?: boolean | null;
  enableTaxCollection?: boolean | null;
  enableShippingAddressCollection?: boolean | null;
  enableBillingAddressCollection?: boolean | null;
  enableAddressAutocomplete?: boolean | null;
  paymentMethods?: Record<string, CheckoutPaymentMethodConfig | null> | null;
  draftOrder?: {
    id?: string | null;
    statuses?: Array<{ status?: string | null } | null> | null;
    totals?: {
      total?: Money | null;
    } | null;
  } | null;
}

export interface CreateCheckoutSessionVariables {
  input: CreateCheckoutSessionInput;
}

export interface CreateCheckoutSessionResult {
  createCheckoutSession?: CheckoutSessionResult | null;
}

export interface CreateCheckoutSessionOptions {
  input: CreateCheckoutSessionInput;
  accessToken: string;
  apiBaseUrl: string;
  fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

export interface CreateCheckoutSessionWithClientCredentialsOptions {
  input: CreateCheckoutSessionInput;
  clientId: string;
  clientSecret: string;
  apiBaseUrl: string;
  scope?: string;
  fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

export interface BuyNowCheckoutInput {
  storeId: string;
  skuId: string;
  quantity?: number;
  returnUrl: string;
  successUrl: string;
  channelId?: string;
}

export interface CartCheckoutInput {
  storeId: string;
  draftOrderId: string;
  returnUrl: string;
  successUrl: string;
  channelId?: string;
}

export interface NonCatalogCheckoutInput {
  storeId: string;
  lineItemData: CheckoutSessionLineItemDataInput;
  quantity?: number;
  returnUrl: string;
  successUrl: string;
  channelId?: string;
}

export type CheckoutSessionOverrides = Partial<
  Omit<
    CreateCheckoutSessionInput,
    'storeId' | 'returnUrl' | 'successUrl' | 'draftOrderId' | 'lineItems' | 'sourceApp' | 'owner'
  >
> & {
  sourceApp?: never;
  owner?: never;
};

function stripUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  ) as Partial<T>;
}

function applyCheckoutDefaults(
  base: CreateCheckoutSessionInput,
  overrides: CheckoutSessionOverrides = {},
): CreateCheckoutSessionInput {
  const definedOverrides = stripUndefined(overrides);
  const result: CreateCheckoutSessionInput = {
    ...base,
    ...definedOverrides,
  };

  result.sourceApp = AAB_CHECKOUT_SOURCE_APP;
  result.owner = AAB_CHECKOUT_OWNER;

  // Backstop only — every caller in this file now sends paymentMethods
  // explicitly (see AAB_CHECKOUT_DEFAULT_PAYMENT_METHODS above). Keep this for
  // any other caller of these builders; do not treat it as the primary source
  // of the default.
  if (result.paymentMethods === undefined) {
    result.paymentMethods = AAB_CHECKOUT_DEFAULT_PAYMENT_METHODS;
  }

  if (result.enablePaymentMethodCollection === undefined) {
    result.enablePaymentMethodCollection = true;
  }

  if (result.enableBillingAddressCollection === undefined) {
    result.enableBillingAddressCollection = true;
  }

  if (result.enableShipping === undefined) {
    result.enableShipping = false;
  }

  if (result.enableShippingAddressCollection === undefined) {
    result.enableShippingAddressCollection = false;
  }

  if (result.enableLocalPickup === undefined) {
    result.enableLocalPickup = false;
  }

  if (result.enablePhoneCollection === undefined) {
    result.enablePhoneCollection = false;
  }

  if (result.enableTaxCollection === undefined) {
    result.enableTaxCollection = false;
  }

  return result;
}

export function commerceApiEndpoint({ apiBaseUrl }: CommerceApiEndpointInput): string {
  return new URL(apiBaseUrl).origin;
}

export function checkoutGraphqlEndpoint({ apiBaseUrl }: CheckoutEndpointInput): string {
  // Sibling subdomain: api.dev-godaddy.com → checkout.commerce.api.dev-godaddy.com
  const { hostname, protocol } = new URL(apiBaseUrl);
  return `${protocol}//checkout.commerce.${hostname}`;
}

export function authorizationHeaders({ accessToken }: AuthorizationHeadersInput): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function getOAuthAccessToken({
  clientId,
  clientSecret,
  apiBaseUrl,
  scope = 'commerce.product:read',
  fetch: fetchImplementation,
}: OAuthTokenInput): Promise<OAuthTokenResponse> {
  if (!clientId || !clientSecret) {
    throw new Error('clientId and clientSecret are required');
  }

  const requestFetch = fetchImplementation ?? fetch;
  const body = new URLSearchParams();
  body.append('grant_type', 'client_credentials');
  body.append('client_id', clientId);
  body.append('client_secret', clientSecret);
  body.append('scope', scope);

  const response = await requestFetch(new URL('/v2/oauth2/token', apiBaseUrl).toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as OAuthTokenResponse;
}

export function buildBuyNowCheckoutInput(
  { storeId, skuId, quantity = 1, returnUrl, successUrl, channelId }: BuyNowCheckoutInput,
  overrides: CheckoutSessionOverrides = {},
): CreateCheckoutSessionInput {
  const base: CreateCheckoutSessionInput = {
    storeId,
    returnUrl,
    successUrl,
    channelId,
    lineItems: [{ skuId, quantity }],
  };

  return applyCheckoutDefaults(base, overrides);
}

export function buildCartCheckoutInput(
  { storeId, draftOrderId, returnUrl, successUrl, channelId }: CartCheckoutInput,
  overrides: CheckoutSessionOverrides = {},
): CreateCheckoutSessionInput {
  const base: CreateCheckoutSessionInput = {
    storeId,
    returnUrl,
    successUrl,
    channelId,
    draftOrderId,
  };

  return applyCheckoutDefaults(base, overrides);
}

export function buildNonCatalogCheckoutInput(
  { storeId, lineItemData, quantity = 1, returnUrl, successUrl, channelId }: NonCatalogCheckoutInput,
  overrides: CheckoutSessionOverrides = {},
): CreateCheckoutSessionInput {
  const base: CreateCheckoutSessionInput = {
    storeId,
    returnUrl,
    successUrl,
    channelId,
    lineItems: [{ lineItemData, quantity }],
  };

  return applyCheckoutDefaults(base, overrides);
}

export const endpoints = {
  commerceApi: commerceApiEndpoint,
  checkoutGraphql: checkoutGraphqlEndpoint,
} as const;

export const headers = {
  authorization: authorizationHeaders,
} as const;

export const helpers = {
  buildBuyNowCheckoutInput,
  buildCartCheckoutInput,
  buildNonCatalogCheckoutInput,
} as const;
