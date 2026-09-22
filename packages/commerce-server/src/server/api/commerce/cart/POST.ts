/**
 * POST /api/commerce/cart
 *
 * Create a draft order (cart). The first "Add to cart" click in the UI
 * should call this route with the first line item(s); the response includes
 * the persistent cart id (`data.cart.id`) that the client stores in
 * localStorage (keyed per store/channel) for subsequent operations.
 *
 * IMPORTANT — two-step pattern:
 *   `addDraftOrder` cannot accept SKU-based line items inline. Its
 *   `CreateDraftLineItemInput` requires `totals` + `unitAmount` (pricing
 *   the client doesn't have); only `addLineItemBySkuId` resolves pricing
 *   server-side. So we always:
 *     1. Create an EMPTY cart via `addDraftOrder`.
 *     2. Add each initial SKU via `addLineItemBySkuId` against the new id.
 *     3. Re-fetch the cart so the response carries hydrated totals/items.
 *
 * Body:
 *   currencyCode? - override the configured currency (defaults to GODADDY_CURRENCY_CODE)
 *   lineItems?    - [{ skuId, name, quantity }] added one-by-one after create
 *
 * Response: { cart: CartOrder | null }
 *   Same shape as GET /api/commerce/cart/:id and the other cart mutation
 *   routes. Clients should always read `data.cart` and never the raw
 *   GraphQL field names like `addDraftOrder` or `orderById`.
 */
import type { Request, Response } from 'express';
import { validateCommerceCartScope } from '../../../../lib/commerce/cart-scope';
import { type CommerceConfig, readCommerceConfigForResponse } from '../../../../lib/commerce/config';
import { gqlRequest, storefrontHeaders } from '../../../../lib/commerce/gql';
import {
  type AddCartOrderResult,
  type AddCartOrderVariables,
  type AddLineItemBySkuIdResult,
  type AddLineItemBySkuIdVariables,
  type AddToCartItemInput,
  buildAddLineItemBySkuIdInput,
  buildEmptyCartOrderInput,
  type GetCartOrderResult,
  type GetCartOrderVariables,
  getCartOrderQuery,
  orderStorefrontEndpoint,
} from '../../../../lib/commerce/order-subgraph';

const addCartOrderMutation = `
  mutation AddCartOrder($input: AddDraftOrderInput!) {
    addDraftOrder(input: $input) {
      id
    }
  }
`;

const addLineItemBySkuIdMutation = `
  mutation AddLineItemBySkuId($input: AddLineItemInput!) {
    addLineItemBySkuId(input: $input) {
      id
    }
  }
`;

interface CreateCartBody {
  currencyCode?: string;
  lineItems?: AddToCartItemInput[];
}

export default async function handler(req: Request, res: Response): Promise<void> {
  try {
    const body = (req.body ?? {}) as CreateCartBody;
    const initialItems = Array.isArray(body.lineItems) ? body.lineItems : [];

    // Validate all items BEFORE creating the cart so a bad payload can't
    // produce an orphaned cart (cart created, item add fails, client never
    // gets the id). Mirrors the validation in POST /api/commerce/cart/:id/items.
    for (const item of initialItems) {
      if (!item.skuId || !item.name || typeof item.quantity !== 'number') {
        res.status(400).json({
          error: 'Each lineItem must have skuId, a non-empty name, and a numeric quantity',
        });
        return;
      }
    }

    const config: CommerceConfig = readCommerceConfigForResponse(res);
    if (!validateCommerceCartScope(req, res, config)) return;
    const { storeId, channelId, clientId, apiBaseUrl, currencyCode } = config;

    const endpoint = orderStorefrontEndpoint({ apiBaseUrl });
    const headers = storefrontHeaders({ storeId, clientId });

    // Step 1: create an EMPTY cart. Do not pass `lineItems` here — the
    // `addDraftOrder` mutation expects `CreateDraftLineItemInput` (with
    // server-priced `totals` + `unitAmount`), which the client cannot
    // produce. SKU-based adds must go through `addLineItemBySkuId`.
    const created = await gqlRequest<AddCartOrderResult, AddCartOrderVariables>({
      endpoint,
      query: addCartOrderMutation,
      variables: {
        input: buildEmptyCartOrderInput({
          storeId,
          channelId,
          currencyCode: body.currencyCode ?? currencyCode,
        }),
      },
      headers,
    });

    const newCartId = created.addDraftOrder?.id;
    if (!newCartId) {
      res.status(500).json({ error: 'Failed to create cart: missing id in mutation response' });
      return;
    }

    // Step 2: append each initial SKU one-by-one via `addLineItemBySkuId`.
    // Sequential, not parallel — same-cart line item adds are not safe to
    // race on the server side.
    for (const item of initialItems) {
      await gqlRequest<AddLineItemBySkuIdResult, AddLineItemBySkuIdVariables>({
        endpoint,
        query: addLineItemBySkuIdMutation,
        variables: { input: buildAddLineItemBySkuIdInput(newCartId, item) },
        headers,
      });
    }

    // Step 3: re-hydrate the cart and return it under the canonical `cart`
    // key. Clients always read `data.cart` regardless of which cart route
    // they called.
    const hydrated = await gqlRequest<GetCartOrderResult, GetCartOrderVariables>({
      endpoint,
      query: getCartOrderQuery,
      variables: { id: newCartId },
      headers,
    });

    res.status(201).json({ cart: hydrated.orderById ?? null });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create cart',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
