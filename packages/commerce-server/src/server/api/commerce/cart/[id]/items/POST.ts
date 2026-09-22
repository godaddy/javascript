/**
 * POST /api/commerce/cart/:id/items
 *
 * Append a line item to an existing cart. Use after the first add-to-cart
 * (which creates the cart via POST /api/commerce/cart); subsequent adds
 * for the same cart go here.
 *
 * Body: { skuId: string, name: string, quantity: number }
 *
 * Response: { cart: CartOrder | null }
 *   The underlying `addLineItemBySkuId` GraphQL mutation only returns the
 *   newly-created `CartLineItem` — it has no order-level totals, taxes, or
 *   discounts. The route discards that response, re-fetches the full cart
 *   via `orderById`, and returns it under the same `cart` key as
 *   GET /api/commerce/cart/:id so clients only ever read one shape.
 */
import type { Request, Response } from 'express';
import { validateCommerceCartScope } from '@/lib/commerce/cart-scope';
import { type CommerceConfig, readCommerceConfigForResponse } from '@/lib/commerce/config';
import { gqlRequest, storefrontHeaders } from '@/lib/commerce/gql';
import {
  type AddLineItemBySkuIdResult,
  type AddLineItemBySkuIdVariables,
  type AddToCartItemInput,
  buildAddLineItemBySkuIdInput,
  type GetCartOrderResult,
  type GetCartOrderVariables,
  getCartOrderQuery,
  orderStorefrontEndpoint,
} from '@/lib/commerce/order-subgraph';

const addLineItemBySkuIdMutation = `
  mutation AddLineItemBySkuId($input: AddLineItemInput!) {
    addLineItemBySkuId(input: $input) {
      id
    }
  }
`;

export default async function handler(req: Request, res: Response): Promise<void> {
  try {
    const cartId: unknown = req.params.id;
    if (typeof cartId !== 'string' || !cartId) {
      res.status(400).json({ error: 'Missing cart id' });
      return;
    }

    const body = (req.body ?? {}) as Partial<AddToCartItemInput>;
    if (!body.skuId || !body.name || typeof body.quantity !== 'number') {
      res.status(400).json({ error: 'Missing required fields: skuId, name, quantity' });
      return;
    }

    const config: CommerceConfig = readCommerceConfigForResponse(res);
    if (!validateCommerceCartScope(req, res, config)) return;
    const { storeId, clientId, apiBaseUrl } = config;
    const endpoint = orderStorefrontEndpoint({ apiBaseUrl });
    const headers = storefrontHeaders({ storeId, clientId });

    // Mutation only returns the new CartLineItem (no order totals). Discard
    // it and re-fetch the full cart so the response matches the shape of
    // GET /api/commerce/cart/:id.
    await gqlRequest<AddLineItemBySkuIdResult, AddLineItemBySkuIdVariables>({
      endpoint,
      query: addLineItemBySkuIdMutation,
      variables: {
        input: buildAddLineItemBySkuIdInput(cartId, {
          skuId: body.skuId,
          name: body.name,
          quantity: body.quantity,
        }),
      },
      headers,
    });

    const hydrated = await gqlRequest<GetCartOrderResult, GetCartOrderVariables>({
      endpoint,
      query: getCartOrderQuery,
      variables: { id: cartId },
      headers,
    });

    res.status(201).json({ cart: hydrated.orderById ?? null });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to add line item',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
