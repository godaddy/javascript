/**
 * Server-side `createCheckoutSession` orchestrator.
 *
 * Mints an OAuth Bearer token (client_credentials grant) and creates a GoDaddy
 * hosted checkout session. This is the single source of truth for the checkout
 * call — both the `/api/commerce/checkout` HTTP route and any other server-side
 * caller in the customer app (e.g. an appointment-booking handler that needs to
 * charge a deposit) should call this function directly. Doing a same-origin
 * loopback `fetch('/api/commerce/checkout', ...)` from inside another handler
 * strips the inbound request's cookies/auth headers and burns an extra HTTP
 * hop for no reason.
 *
 * Server-only. Reads `clientSecret` from `/local/config.json` via
 * `readCommerceConfig()` — never import this file from the browser.
 */

import {
  AAB_CHECKOUT_DEFAULT_PAYMENT_METHODS,
  authorizationHeaders,
  buildBuyNowCheckoutInput,
  buildCartCheckoutInput,
  buildNonCatalogCheckoutInput,
  type CheckoutSessionLineItemDataInput,
  type CreateCheckoutSessionResult,
  type CreateCheckoutSessionVariables,
  checkoutGraphqlEndpoint,
  getOAuthAccessToken,
} from './checkout-subgraph';
import { type CommerceConfiguration, createRuntimeCommerceConfiguration } from './config';
import { gqlRequest } from './gql';

const BINDING_FIELDS: ReadonlyArray<keyof CommerceBindingFields> = ['storeId', 'channelId', 'currencyCode'];
const MAX_CONFIG_ATTEMPTS = 5;
const CONFIG_RETRY_DELAY_MS = 2000;

export interface CreateCheckoutSessionParams {
  /** Where the hosted checkout sends the shopper on cancel/back. */
  returnUrl: string;
  /** Where the hosted checkout sends the shopper after payment. */
  successUrl: string;
  /** Existing cart/draft order to convert to a checkout session. */
  draftOrderId?: string;
  /** Buy-Now path; checkout is built from a single SKU line item. */
  skuId?: string;
  /** Quantity for Buy-Now / non-catalog paths. Defaults to 1. */
  quantity?: number;
  /**
   * Non-catalog path; price the customer pays directly without a SKU or
   * catalog product. Mutually exclusive with `skuId` and `draftOrderId`.
   */
  lineItemData?: CheckoutSessionLineItemDataInput;
}

export interface CheckoutSession {
  /** Hosted checkout URL to redirect the shopper to. */
  url: string;
  /** Checkout session id (not the order id). */
  id: string;
  /**
   * Draft order id when the API created one (cart + Buy-Now flows). `null` for
   * non-catalog sessions, which have no draft order.
   */
  draftOrderId: string | null;
  /** Store id returned by checkout-api after it accepts the session. */
  storeId: string;
  /** AAB channel id returned by checkout-api after it accepts the session. */
  channelId: string;
  /** Commerce business that owns the selected store. */
  businessId: string | null;
  /** Store display name returned by checkout-api. */
  storeName: string | null;
  /** Server-owned source identifier used for transaction attribution. */
  sourceApp: string | null;
}

interface CommerceBindingFields {
  readonly storeId: string;
  readonly channelId: string;
  readonly currencyCode: string;
}

interface ExpectedCommerceBindingFields {
  readonly storeId?: string;
  readonly channelId?: string;
  readonly currencyCode?: string;
}

export class CommerceConfigPendingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CommerceConfigPendingError';
  }
}

function expectedCommerceBindingConfig(
  configuration: CommerceConfiguration,
): ExpectedCommerceBindingFields | null {
  const checkoutConfiguration = configuration.readCheckout();
  const storeId = checkoutConfiguration.storeId?.trim();
  const channelId = checkoutConfiguration.channelId?.trim();
  const currencyCode = checkoutConfiguration.currencyCode?.trim().toUpperCase();
  if (!storeId && !channelId && !currencyCode) return null;
  return {
    ...(storeId ? { storeId } : {}),
    ...(channelId ? { channelId } : {}),
    ...(currencyCode ? { currencyCode } : {}),
  };
}

function readCommerceBindingConfig(configuration: CommerceConfiguration): CommerceBindingFields | null {
  try {
    const config = configuration.read();
    return {
      storeId: config.storeId,
      channelId: config.channelId,
      currencyCode: config.currencyCode,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes('GODADDY_STORE_ID is missing') ||
      message.includes('GODADDY_CHANNEL_ID is missing')
    ) {
      return null;
    }
    throw error;
  }
}

function bindingMatchesExpected(
  binding: CommerceBindingFields,
  configuration: CommerceConfiguration,
): boolean {
  const expected = expectedCommerceBindingConfig(configuration);
  if (!expected) return true;
  if (expected.storeId && binding.storeId !== expected.storeId) return false;
  if (expected.channelId && binding.channelId !== expected.channelId) return false;
  if (expected.currencyCode && binding.currencyCode !== expected.currencyCode) return false;
  return true;
}

async function waitForCommerceBindingConfig(configuration: CommerceConfiguration): Promise<void> {
  for (let attempt = 1; attempt <= MAX_CONFIG_ATTEMPTS; attempt += 1) {
    const binding = readCommerceBindingConfig(configuration);
    if (
      binding !== null &&
      BINDING_FIELDS.every((field) => Boolean(binding[field])) &&
      bindingMatchesExpected(binding, configuration)
    ) {
      return;
    }

    if (attempt === MAX_CONFIG_ATTEMPTS) {
      throw new CommerceConfigPendingError(
        'Commerce binding configuration is not yet available in /local/config.json',
      );
    }

    await new Promise<void>((resolve) => setTimeout(resolve, CONFIG_RETRY_DELAY_MS));
  }
}

// IMPORTANT: MutationCreateCheckoutSessionInput is the GDC checkout GraphQL schema type.
// Do NOT rename it to CreateCheckoutSessionInput (the local TypeScript interface name) —
// using the wrong name causes the GDC API to return an opaque "Internal server error".
const createCheckoutSessionMutation = `
  mutation CreateCheckoutSession($input: MutationCreateCheckoutSessionInput!) {
    createCheckoutSession(input: $input) {
      id
      token
      url
      sourceApp
      returnUrl
      successUrl
      storeId
      businessId
      channelId
      customerId
      storeName
      environment
      enableTips
      enabledLocales
      enableSurcharge
      enableLocalPickup
      enableShipping
      enablePhoneCollection
      enableNotesCollection
      enablePromotionCodes
      enableTaxCollection
      enableShippingAddressCollection
      enableBillingAddressCollection
      enableAddressAutocomplete
      paymentMethods {
        card {
          processor
          checkoutTypes
        }
        ccavenue {
          processor
          checkoutTypes
        }
        express {
          processor
          checkoutTypes
        }
        applePay {
          processor
          checkoutTypes
        }
        googlePay {
          processor
          checkoutTypes
        }
        paypal {
          processor
          checkoutTypes
        }
        paze {
          processor
          checkoutTypes
        }
        offline {
          processor
          checkoutTypes
        }
        mercadopago {
          processor
          checkoutTypes
        }
        ach {
          processor
          checkoutTypes
        }
      }
      draftOrder {
        id
        statuses {
          status
        }
        totals {
          total {
            currencyCode
            value
          }
        }
      }
    }
  }
`;

function promotionCodesEnabled(configuration: object): boolean {
  return 'enablePromotionCodes' in configuration && configuration.enablePromotionCodes === true;
}

interface LegacyShippingOriginAddress {
  readonly addressLine1: string;
  readonly addressLine2?: string;
  readonly adminArea1?: string;
  readonly adminArea2: string;
  readonly postalCode?: string;
  readonly countryCode: string;
}

function addressPart(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized: string = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function legacyShippingOriginAddress(value: unknown): LegacyShippingOriginAddress | undefined {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const candidate: Record<string, unknown> = value as Record<string, unknown>;
  const addressLine1: string | undefined = addressPart(candidate.addressLine1);
  const addressLine2: string | undefined = addressPart(candidate.addressLine2);
  const adminArea1: string | undefined = addressPart(candidate.adminArea1);
  const adminArea2: string | undefined = addressPart(candidate.adminArea2);
  const postalCode: string | undefined = addressPart(candidate.postalCode);
  const countryCode: string | undefined = addressPart(candidate.countryCode)?.toUpperCase();
  if (!addressLine1 || !adminArea2 || !countryCode || !/^[A-Z]{2}$/.test(countryCode)) {
    return undefined;
  }
  if ((countryCode === 'US' || countryCode === 'CA') && (!adminArea1 || !postalCode)) {
    return undefined;
  }
  return {
    addressLine1,
    ...(addressLine2 ? { addressLine2 } : {}),
    ...(adminArea1 ? { adminArea1 } : {}),
    adminArea2,
    ...(postalCode ? { postalCode } : {}),
    countryCode,
  };
}

function shippingOriginConfiguration(configuration: object): {
  readonly resolveFromStore: boolean;
  readonly legacyOriginAddress?: LegacyShippingOriginAddress;
} {
  if (!('shipping' in configuration)) return { resolveFromStore: false };
  const shipping: unknown = configuration.shipping;
  if (shipping === null || typeof shipping !== 'object' || Array.isArray(shipping)) {
    return { resolveFromStore: false };
  }
  const candidate: Record<string, unknown> = shipping as Record<string, unknown>;
  if (candidate.originAddressConfigured === true && candidate.originAddressContractVersion === 1) {
    return { resolveFromStore: true };
  }
  const legacyOriginAddress: LegacyShippingOriginAddress | undefined = legacyShippingOriginAddress(
    candidate.originAddress,
  );
  return legacyOriginAddress ? { resolveFromStore: false, legacyOriginAddress } : { resolveFromStore: false };
}

export async function createCheckoutSession(
  params: CreateCheckoutSessionParams,
  configuration: CommerceConfiguration = createRuntimeCommerceConfiguration(),
): Promise<CheckoutSession> {
  const { draftOrderId, skuId, quantity, lineItemData, returnUrl, successUrl } = params;

  if (!returnUrl || !successUrl) {
    throw new Error('createCheckoutSession: returnUrl and successUrl are required');
  }

  const checkoutSourceCount = [draftOrderId, skuId, lineItemData].filter(Boolean).length;
  if (checkoutSourceCount !== 1) {
    throw new Error('createCheckoutSession: exactly one of draftOrderId, skuId, or lineItemData is required');
  }

  await waitForCommerceBindingConfig(configuration);

  const {
    storeId,
    channelId,
    clientId,
    clientSecret,
    apiBaseUrl,
    currencyCode: configCurrencyCode,
  } = configuration.read();
  const checkoutConfiguration = configuration.readCheckout();
  const enablePromotionCodes: boolean = promotionCodesEnabled(checkoutConfiguration);
  const catalogShippingEnabled: boolean = lineItemData === undefined && checkoutConfiguration.enableShipping;
  const shippingOrigin = shippingOriginConfiguration(checkoutConfiguration);
  if (
    catalogShippingEnabled &&
    !shippingOrigin.resolveFromStore &&
    shippingOrigin.legacyOriginAddress === undefined
  ) {
    throw new Error('Commerce shipping origin is not configured');
  }

  const checkoutOAuthScope: string = 'commerce.product:read';
  const token = await getOAuthAccessToken({
    clientId,
    clientSecret,
    apiBaseUrl,
    scope: checkoutOAuthScope,
  });

  const catalogCheckoutOverrides = {
    enablePromotionCodes,
    enableTaxCollection: checkoutConfiguration.enableTaxCollection,
    enableShipping: checkoutConfiguration.enableShipping,
    enableShippingAddressCollection: checkoutConfiguration.enableShipping,
    paymentMethods: AAB_CHECKOUT_DEFAULT_PAYMENT_METHODS,
    shipping:
      catalogShippingEnabled && shippingOrigin.legacyOriginAddress
        ? { originAddress: shippingOrigin.legacyOriginAddress }
        : undefined,
  };

  const resolvedLineItemData: typeof lineItemData =
    lineItemData !== undefined
      ? {
          ...lineItemData,
          priceData: {
            ...lineItemData.priceData,
            currencyCode: configCurrencyCode,
          },
        }
      : undefined;

  const input = draftOrderId
    ? buildCartCheckoutInput(
        {
          storeId,
          channelId,
          draftOrderId,
          returnUrl,
          successUrl,
        },
        catalogCheckoutOverrides,
      )
    : resolvedLineItemData
      ? buildNonCatalogCheckoutInput(
          {
            storeId,
            channelId,
            lineItemData: resolvedLineItemData,
            quantity: quantity ?? 1,
            returnUrl,
            successUrl,
          },
          {
            enableTaxCollection: checkoutConfiguration.enableTaxCollection,
            paymentMethods: AAB_CHECKOUT_DEFAULT_PAYMENT_METHODS,
          },
        )
      : buildBuyNowCheckoutInput(
          {
            storeId,
            channelId,
            skuId: skuId as string,
            quantity: quantity ?? 1,
            returnUrl,
            successUrl,
          },
          catalogCheckoutOverrides,
        );

  let result: CreateCheckoutSessionResult;
  try {
    result = await gqlRequest<CreateCheckoutSessionResult, CreateCheckoutSessionVariables>({
      endpoint: checkoutGraphqlEndpoint({ apiBaseUrl }),
      query: createCheckoutSessionMutation,
      variables: { input },
      headers: authorizationHeaders({ accessToken: token.access_token }),
    });
  } catch (error) {
    throw new Error('Commerce checkout session could not be created', { cause: error });
  }

  const session = result.createCheckoutSession;
  if (!session?.url || !session.id) {
    throw new Error('Checkout session was not created');
  }

  if (session.storeId !== storeId || session.channelId !== channelId) {
    throw new Error(
      `Checkout session binding mismatch: expected store ${storeId} and channel ${channelId}, received store ${session.storeId ?? 'missing'} and channel ${session.channelId ?? 'missing'}`,
    );
  }

  const expectedShipping = lineItemData === undefined && checkoutConfiguration.enableShipping;
  const expectedPromotionCodes: boolean = lineItemData === undefined && enablePromotionCodes;
  if (expectedPromotionCodes && session.enablePromotionCodes !== true) {
    throw new Error('Checkout session did not enable configured promotion codes');
  }
  if (checkoutConfiguration.enableTaxCollection && session.enableTaxCollection !== true) {
    throw new Error('Checkout session did not enable configured tax collection');
  }
  if (
    expectedShipping &&
    (session.enableShipping !== true || session.enableShippingAddressCollection !== true)
  ) {
    throw new Error('Checkout session did not enable configured shipping and address collection');
  }

  if (!session.paymentMethods?.card?.processor) {
    throw new Error('Checkout session did not configure payment methods.');
  }

  return {
    url: session.url,
    id: session.id,
    draftOrderId: session.draftOrder?.id ?? null,
    storeId,
    channelId,
    businessId: session.businessId ?? null,
    storeName: session.storeName ?? null,
    sourceApp: session.sourceApp ?? null,
  };
}
