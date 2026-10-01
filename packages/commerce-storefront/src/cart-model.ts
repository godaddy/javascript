export interface Money {
  value?: number | null;
  currencyCode?: string | null;
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

export async function addToCart(
  cartId: string | null,
  item: AddToCartItemInput,
  fetchFn: typeof globalThis.fetch = globalThis.fetch,
): Promise<{ cart: CartOrder | null }> {
  const url = cartId ? `/api/commerce/cart/${encodeURIComponent(cartId)}/items` : '/api/commerce/cart';
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
