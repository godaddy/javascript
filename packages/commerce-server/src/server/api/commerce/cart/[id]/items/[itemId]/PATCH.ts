/**
 * PATCH /api/commerce/cart/:id/items/:itemId
 *
 * Update an existing cart line item — typically the quantity stepper in the
 * cart drawer.
 *
 * Body: { quantity?: number, name?: string, fulfillmentMode?, status?, type?, details? }
 *
 * Response: { cart: CartOrder | null }
 *   The underlying `updateLineItemById` GraphQL mutation only returns the
 *   updated `CartLineItem` — it has no order-level totals. The route
 *   discards that response, re-fetches the full cart via `orderById`, and
 *   returns it under the same `cart` key as GET /api/commerce/cart/:id so
 *   clients only ever read one shape.
 */
import type { Request, Response } from 'express';
import { validateCommerceCartScope } from '../../../../../../../lib/commerce/cart-scope';
import { type CommerceConfig, readCommerceConfigForResponse } from '../../../../../../../lib/commerce/config';
import { gqlRequest, storefrontHeaders } from '../../../../../../../lib/commerce/gql';
import {
  type GetCartOrderResult,
  type GetCartOrderVariables,
  getCartOrderQuery,
  orderStorefrontEndpoint,
  type UpdateLineItemByIdInput,
  type UpdateLineItemByIdResult,
  type UpdateLineItemByIdVariables,
} from '../../../../../../../lib/commerce/order-subgraph';

const updateLineItemByIdMutation = `
  mutation UpdateLineItemById($input: UpdateLineItemByIdInput!) {
    updateLineItemById(input: $input) {
      id
    }
  }
`;

type UpdateLineItemBody = Omit<UpdateLineItemByIdInput, 'id' | 'orderId'>;

export default async function handler(req: Request, res: Response): Promise<void> {
  try {
    const cartId: unknown = req.params.id;
    const itemId: unknown = req.params.itemId;
    if (typeof cartId !== 'string' || !cartId || typeof itemId !== 'string' || !itemId) {
      res.status(400).json({ error: 'Missing cart id or item id' });
      return;
    }

    const body = (req.body ?? {}) as UpdateLineItemBody;
    const config: CommerceConfig = readCommerceConfigForResponse(res);
    if (!validateCommerceCartScope(req, res, config)) return;
    const { storeId, clientId, apiBaseUrl } = config;
    const endpoint = orderStorefrontEndpoint({ apiBaseUrl });
    const headers = storefrontHeaders({ storeId, clientId });

    await gqlRequest<UpdateLineItemByIdResult, UpdateLineItemByIdVariables>({
      endpoint,
      query: updateLineItemByIdMutation,
      variables: {
        input: {
          id: itemId,
          orderId: cartId,
          name: body.name,
          quantity: body.quantity,
          fulfillmentMode: body.fulfillmentMode,
          status: body.status,
          type: body.type,
          details: body.details,
        },
      },
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
      error: 'Failed to update line item',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
