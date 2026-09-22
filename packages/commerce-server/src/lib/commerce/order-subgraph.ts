/**
 * GoDaddy Commerce order-storefront-subgraph kit.
 *
 * Used by the cart proxy routes under `src/server/api/commerce/cart/**` to
 * read and mutate draft orders (carts). The wire transport (`gqlRequest`)
 * lives in `gql.ts`; types and view-model helpers here are isomorphic and
 * safe to import from client components for shaping props.
 *
 * Domain notes:
 * - A "cart" is a draft order — same id throughout pending/paid lifecycle.
 *   The customer app owns persistence of `draftOrderId` (typically localStorage).
 * - `addDraftOrder` creates a cart with optional initial line items.
 *   Subsequent additions go through `addLineItemBySkuId`.
 * - Money values are integers in the currency's smallest unit (cents for USD).
 */

import type { Money } from './gql';

export interface OrderStorefrontEndpointInput {
  apiBaseUrl: string;
}

export interface DraftOrderContext {
  storeId?: string | null;
  channelId?: string | null;
  owner?: string | null;
}

export interface OrderTotals {
  subTotal?: Money | null;
  shippingTotal?: Money | null;
  taxTotal?: Money | null;
  discountTotal?: Money | null;
  productDiscountTotal?: Money | null;
  shippingDiscountTotal?: Money | null;
  feeTotal?: Money | null;
  total?: Money | null;
}

export interface LineItemTotals {
  subTotal?: Money | null;
  taxTotal?: Money | null;
  discountTotal?: Money | null;
  feeTotal?: Money | null;
}

export interface CartSelectedOption {
  attribute?: string | null;
  values?: string[] | null;
}

export interface CartSelectedAddonValue {
  name?: string | null;
  costAdjustment?: Money | null;
}

export interface CartSelectedAddon {
  attribute?: string | null;
  sku?: string | null;
  values?: CartSelectedAddonValue[] | null;
}

export interface CartLineItemDetails {
  productAssetUrl?: string | null;
  sku?: string | null;
  unitOfMeasure?: string | null;
  selectedOptions?: CartSelectedOption[] | null;
  selectedAddons?: CartSelectedAddon[] | null;
}

export interface CartDiscount {
  id?: string | null;
  name?: string | null;
  code?: string | null;
  amount?: Money | null;
  ratePercentage?: string | null;
  appliedBeforeTax?: boolean | null;
}

export interface CartTax {
  id?: string | null;
  name?: string | null;
  amount?: Money | null;
  ratePercentage?: string | null;
  included?: boolean | null;
  exempted?: boolean | null;
}

export interface CartNote {
  id?: string | null;
  content?: string | null;
  author?: string | null;
  authorType?: string | null;
  createdAt?: string | null;
}

export interface CartLineItem {
  id?: string | null;
  name?: string | null;
  quantity?: number | null;
  skuId?: string | null;
  type?: string | null;
  fulfillmentMode?: string | null;
  details?: CartLineItemDetails | null;
  totals?: LineItemTotals | null;
  discounts?: CartDiscount[] | null;
  taxes?: CartTax[] | null;
  notes?: CartNote[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CartAddress {
  addressLine1?: string | null;
  addressLine2?: string | null;
  addressLine3?: string | null;
  adminArea1?: string | null;
  adminArea2?: string | null;
  adminArea3?: string | null;
  adminArea4?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
}

export interface CartShippingInfo {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  address?: CartAddress | null;
}

export interface CartOrder {
  id?: string | null;
  customerId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  context?: DraftOrderContext | null;
  lineItems?: CartLineItem[] | null;
  totals?: OrderTotals | null;
  discounts?: CartDiscount[] | null;
  taxes?: CartTax[] | null;
  shipping?: CartShippingInfo | null;
  notes?: CartNote[] | null;
  tags?: string[] | null;
}

export interface AddCartOrderInput {
  customerId?: string | null;
  context: DraftOrderContext;
  totals: OrderTotals;
  lineItems?: CreateDraftLineItemInput[] | null;
}

export interface LineItemDetailsInput {
  productAssetUrl?: string;
  sku?: string;
  unitOfMeasure?: string;
  selectedOptions?: CartSelectedOption[];
  selectedAddons?: CartSelectedAddon[];
}

// Cart line item inputs come in two distinct GraphQL shapes that look
// superficially similar but are NOT interchangeable. Reusing one interface
// for both compiles cleanly but fails at runtime when the API rejects
// extraneous or missing fields.
//
// CreateDraftLineItemInput — nested inside `addDraftOrder`'s AddDraftOrderInput
//   - No `orderId` (the order is being created in this call)
//   - No `status` (server defaults it on the new draft)
//   - Caller MUST supply `totals` and `unitAmount`; the server does not
//     resolve pricing from the SKU during draft order creation
//
// AddLineItemBySkuIdInput — input to the standalone `addLineItemBySkuId`
//   - Requires `orderId` (target an existing draft order)
//   - Server looks up pricing from `skuId`; do NOT pass totals/unitAmount
//   - Optional `status` may be passed when seeding
//
// Keep these as separate types so a misuse (e.g. passing an addLineItemBySkuId
// payload into addDraftOrder) is caught by the compiler.
export interface CreateDraftLineItemInput {
  skuId: string;
  name: string;
  quantity: number;
  unitAmount: Money;
  totals: LineItemTotals;
  fulfillmentMode?: string;
  type?: string;
  details?: LineItemDetailsInput;
}

export interface AddLineItemBySkuIdInput {
  orderId: string;
  skuId: string;
  name: string;
  quantity: number;
  fulfillmentMode?: string;
  status?: string;
  type?: string;
  details?: LineItemDetailsInput;
}

export interface UpdateLineItemByIdInput {
  id: string;
  orderId: string;
  name?: string;
  quantity?: number;
  fulfillmentMode?: string;
  status?: string;
  type?: string;
  details?: LineItemDetailsInput;
}

export interface GetCartOrderVariables {
  id: string;
}

export interface GetOrderStatusVariables {
  id: string;
}

export interface GetOrderStatusResult {
  orderById?: CartOrder | null;
}

export interface DeleteLineItemByIdVariables {
  id: string;
  orderId: string;
}

export interface AddCartOrderVariables {
  input: AddCartOrderInput;
}

export interface AddLineItemBySkuIdVariables {
  input: AddLineItemBySkuIdInput;
}

export interface UpdateLineItemByIdVariables {
  input: UpdateLineItemByIdInput;
}

export interface ApplyDiscountCodesInput {
  orderId: string;
  discountCodes: string[];
}

export interface ApplyDiscountCodesVariables {
  input: ApplyDiscountCodesInput;
}

export interface AddCartOrderResult {
  addDraftOrder?: CartOrder | null;
}

export interface AddLineItemBySkuIdResult {
  addLineItemBySkuId?: CartLineItem | null;
}

export interface UpdateLineItemByIdResult {
  updateLineItemById?: CartLineItem | null;
}

export interface DeleteLineItemByIdResult {
  deleteLineItemById?: boolean | null;
}

// The applyDiscountCodes mutation only selects `id` — the route discards this
// result and re-fetches the full cart. Do not widen this to CartOrder.
export interface ApplyDiscountCodesResult {
  applyDiscountCodes?: { id?: string | null } | null;
}

export interface GetCartOrderResult {
  orderById?: CartOrder | null;
}

export interface EmptyCartOrderInput {
  storeId: string;
  owner?: string;
  channelId?: string;
  currencyCode?: string;
}

export interface AddToCartItemInput {
  skuId: string;
  name: string;
  quantity: number;
}

export interface CartSummaryTotals {
  itemCount: number;
  currencyCode: string;
  subtotal: number;
  shipping: number;
  taxes: number;
  discount: number;
  total: number;
}

function createMoney(value: number, currencyCode: string): { value: number; currencyCode: string } {
  return { value, currencyCode };
}

export function orderStorefrontEndpoint({ apiBaseUrl }: OrderStorefrontEndpointInput): string {
  return new URL('/v1/commerce/order-storefront-subgraph', apiBaseUrl).toString();
}

export function buildEmptyCartOrderInput({
  storeId,
  channelId,
  currencyCode = 'USD',
  owner,
}: EmptyCartOrderInput): AddCartOrderInput {
  return {
    context: {
      storeId,
      channelId: channelId || '',
      ...(owner ? { owner } : {}),
    },
    totals: {
      subTotal: createMoney(0, currencyCode),
      shippingTotal: createMoney(0, currencyCode),
      discountTotal: createMoney(0, currencyCode),
      feeTotal: createMoney(0, currencyCode),
      taxTotal: createMoney(0, currencyCode),
      total: createMoney(0, currencyCode),
    },
  };
}

export function buildAddLineItemBySkuIdInput(
  orderId: string,
  item: AddToCartItemInput,
): AddLineItemBySkuIdInput {
  return {
    orderId,
    skuId: item.skuId,
    name: item.name,
    quantity: item.quantity,
    fulfillmentMode: 'NONE',
    status: 'DRAFT',
  };
}

// Use only when seeding a brand-new draft order via `addDraftOrder`. Caller
// must supply pricing (`unitAmount` + `totals`) because the draft-order
// mutation does not resolve SKU prices server-side. For adding items to an
// already-existing cart, use `buildAddLineItemBySkuIdInput` instead.
export interface BuildCreateDraftLineItemInputOptions {
  item: AddToCartItemInput;
  unitAmount: Money;
  totals?: LineItemTotals;
  fulfillmentMode?: string;
}

export function buildCreateDraftLineItemInput({
  item,
  unitAmount,
  totals,
  fulfillmentMode = 'NONE',
}: BuildCreateDraftLineItemInputOptions): CreateDraftLineItemInput {
  const currencyCode = unitAmount.currencyCode || 'USD';
  const unitValue = unitAmount.value || 0;
  return {
    skuId: item.skuId,
    name: item.name,
    quantity: item.quantity,
    unitAmount,
    totals: totals ?? {
      subTotal: createMoney(unitValue * item.quantity, currencyCode),
      taxTotal: createMoney(0, currencyCode),
      discountTotal: createMoney(0, currencyCode),
      feeTotal: createMoney(0, currencyCode),
    },
    fulfillmentMode,
  };
}

/**
 * Add one item to the cart. When `cartId` is null a new cart is created;
 * otherwise the item is appended to the existing cart. Both paths accept the
 * same `AddToCartItemInput` shape and return `{ cart: CartOrder | null }`.
 *
 * Use this helper everywhere instead of calling the two routes directly so
 * the payload shape stays consistent and callers can't accidentally diverge.
 */
export async function addToCart(
  cartId: string | null,
  item: AddToCartItemInput,
  fetchFn: typeof globalThis.fetch = globalThis.fetch,
): Promise<{ cart: CartOrder | null }> {
  const url = cartId ? `/api/commerce/cart/${cartId}/items` : '/api/commerce/cart';
  const body = cartId ? item : { lineItems: [item] };
  const res = await fetchFn(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json() as Promise<{ cart: CartOrder | null }>;
}

export function getCartSummaryTotals(order: CartOrder | null | undefined): CartSummaryTotals {
  const lineItems = order?.lineItems ?? [];
  const currencyCode = order?.totals?.total?.currencyCode || 'USD';

  return {
    itemCount: lineItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
    currencyCode,
    subtotal: order?.totals?.subTotal?.value || 0,
    shipping: order?.totals?.shippingTotal?.value || 0,
    taxes: order?.totals?.taxTotal?.value || 0,
    discount: order?.totals?.discountTotal?.value || 0,
    total: order?.totals?.total?.value || 0,
  };
}

// Read-only receipt enrichment. The order storefront schema does not expose
// payment status; neither this query nor cart hydration can prove payment.
export const orderStatusQuery = `
  query GetOrderStatus($id: ID!) {
    orderById(id: $id) {
      id
      createdAt
      updatedAt
      totals {
        total {
          value
          currencyCode
        }
      }
      lineItems {
        id
        name
        quantity
        skuId
      }
    }
  }
`;

// Full draft-order query — mirrored across the cart proxy routes so every
// mutation can re-fetch the cart and return a fully-populated `CartOrder`
// (totals, taxes, discounts) under a single canonical `orderById` key.
// The individual mutations (`addLineItemBySkuId`, `updateLineItemById`,
// `deleteLineItemById`, `applyDiscountCodes`) return either a `CartLineItem`
// or a partial order shape that omits order-level totals — never trust the
// raw mutation response for state.
export const getCartOrderQuery = `
  query GetCartOrder($id: ID!) {
    orderById(id: $id) {
      id
      customerId
      createdAt
      updatedAt
      context {
        storeId
        channelId
      }
      lineItems {
        id
        name
        quantity
        skuId
        type
        fulfillmentMode
        details {
          productAssetUrl
          sku
          unitOfMeasure
          selectedOptions {
            attribute
            values
          }
          selectedAddons {
            attribute
            sku
            values {
              name
              costAdjustment {
                value
                currencyCode
              }
            }
          }
        }
        totals {
          subTotal {
            value
            currencyCode
          }
          taxTotal {
            value
            currencyCode
          }
          discountTotal {
            value
            currencyCode
          }
          feeTotal {
            value
            currencyCode
          }
        }
        discounts {
          id
          name
          code
          amount {
            value
            currencyCode
          }
          ratePercentage
        }
        taxes {
          id
          name
          amount {
            value
            currencyCode
          }
          ratePercentage
        }
        notes {
          id
          content
          author
          authorType
        }
      }
      totals {
        subTotal {
          value
          currencyCode
        }
        shippingTotal {
          value
          currencyCode
        }
        taxTotal {
          value
          currencyCode
        }
        discountTotal {
          value
          currencyCode
        }
        productDiscountTotal {
          value
          currencyCode
        }
        shippingDiscountTotal {
          value
          currencyCode
        }
        feeTotal {
          value
          currencyCode
        }
        total {
          value
          currencyCode
        }
      }
      discounts {
        id
        name
        code
        amount {
          value
          currencyCode
        }
        ratePercentage
        appliedBeforeTax
      }
      taxes {
        id
        name
        amount {
          value
          currencyCode
        }
        ratePercentage
        included
        exempted
      }
      shipping {
        firstName
        lastName
        email
        phone
        companyName
        address {
          addressLine1
          addressLine2
          addressLine3
          adminArea1
          adminArea2
          adminArea3
          adminArea4
          postalCode
          countryCode
        }
      }
      notes {
        id
        content
        author
        authorType
        createdAt
      }
      tags
    }
  }
`;
