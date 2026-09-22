/**
 * DELETE /api/commerce/cart/:id/items/:itemId
 *
 * Remove a line item from the cart — wired to the trash icon in the
 * cart drawer.
 *
 * Response: { cart: CartOrder | null }
 *   The underlying `deleteLineItemById` GraphQL mutation only returns a
 *   boolean. The route discards that response, re-fetches the full cart
 *   via `orderById`, and returns it under the same `cart` key as
 *   GET /api/commerce/cart/:id so clients only ever read one shape.
 */
import type { Request, Response } from 'express';
import { validateCommerceCartScope } from '@/lib/commerce/cart-scope';
import { type CommerceConfig, readCommerceConfigForResponse } from '@/lib/commerce/config';
import { gqlRequest, storefrontHeaders } from '@/lib/commerce/gql';
import {
  type DeleteLineItemByIdResult,
  type DeleteLineItemByIdVariables,
  type GetCartOrderResult,
  type GetCartOrderVariables,
  getCartOrderQuery,
  orderStorefrontEndpoint,
} from '@/lib/commerce/order-subgraph';

const deleteLineItemByIdMutation = `
  mutation DeleteLineItemById($id: ID!, $orderId: ID!) {
    deleteLineItemById(id: $id, orderId: $orderId)
  }
`;

export default async function handler(req: Request, res: Response): Promise<void> {
  try {
    const cartId: unknown = req.params.id;
    const itemId: unknown = req.params.itemId;
    if (typeof cartId !== 'string' || !cartId || typeof itemId !== 'string' || !itemId) {
      res.status(400).json({ error: 'Missing cart id or item id' });
      return;
    }

    const config: CommerceConfig = readCommerceConfigForResponse(res);
    if (!validateCommerceCartScope(req, res, config)) return;
    const { storeId, clientId, apiBaseUrl } = config;
    const endpoint = orderStorefrontEndpoint({ apiBaseUrl });
    const headers = storefrontHeaders({ storeId, clientId });

    await gqlRequest<DeleteLineItemByIdResult, DeleteLineItemByIdVariables>({
      endpoint,
      query: deleteLineItemByIdMutation,
      variables: { id: itemId, orderId: cartId },
      headers,
    });

    const hydrated = await gqlRequest<GetCartOrderResult, GetCartOrderVariables>({
      endpoint,
      query: getCartOrderQuery,
      variables: { id: cartId },
      headers,
    });

    res.json({ cart: hydrated.orderById ?? null });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete line item',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
