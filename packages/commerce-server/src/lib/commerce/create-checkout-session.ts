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
 * Server-only. Credentials and integration settings come from the host configuration.
 */

import {
  authorizationHeaders,
  buildBuyNowCheckoutInput,
  buildCartCheckoutInput,
  buildNonCatalogCheckoutInput,
  type CheckoutSessionLineItemDataInput,
  type CreateCheckoutSessionResult,
  type CreateCheckoutSessionVariables,
  checkoutGraphqlEndpoint,
  DEFAULT_CHECKOUT_PAYMENT_METHODS,
  getOAuthAccessToken,
} from './checkout-subgraph';
import { type CommerceConfiguration, createRuntimeCommerceConfiguration } from './config';
import { gqlRequest } from './gql';

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
  /** Sales channel id returned by checkout-api after it accepts the session. */
  channelId: string;
  /** Commerce business that owns the selected store. */
  businessId: string | null;
  /** Store display name returned by checkout-api. */
  storeName: string | null;
  /** Server-owned source identifier used for transaction attribution. */
  sourceApp: string | null;
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

  const {
    storeId,
    channelId,
    clientId,
    clientSecret,
    apiBaseUrl,
    sourceApp,
    owner,
    currencyCode: configCurrencyCode,
  } = configuration.read();
  const checkoutOAuthScope: string = 'commerce.product:read';
  const token = await getOAuthAccessToken({
    clientId,
    clientSecret,
    apiBaseUrl,
    scope: checkoutOAuthScope,
  });

  const attribution = { sourceApp, owner };
  const catalogCheckoutOverrides = {
    ...attribution,
    paymentMethods: DEFAULT_CHECKOUT_PAYMENT_METHODS,
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
            ...attribution,
            paymentMethods: DEFAULT_CHECKOUT_PAYMENT_METHODS,
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
