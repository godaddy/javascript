/**
 * GET /api/commerce/cart/:id
 *
 * Read the current cart (draft order). Call on app load with the
 * `draftOrderId` persisted in localStorage to hydrate the cart UI.
 *
 * Response: { cart: CartOrder | null }
 *   - The route normalises the GraphQL `orderById` field into a stable
 *     `cart` key so the client never has to know which subgraph query
 *     produced the data. Read `data.cart`, not `data.orderById` and not
 *     `data.getDraftOrder`.
 *   - Pass `cart` (when non-null) to `getCartSummaryTotals` for view-model
 *     totals.
 *   - When the cart is not found or has expired, `cart` is `null` and the
 *     HTTP status is still 200 (not 404). The client should check `cart === null`
 *     and clear the persisted `draftOrderId` when that is the case.
 */
import type { Request, Response } from 'express';
import { assertCommerceCartScope } from '@/lib/commerce/cart-scope';
import { commerceRoute } from '@/lib/commerce/commerce-route';
import { type CommerceConfig, readCommerceConfigForResponse } from '@/lib/commerce/config';
import { InvalidRequestError } from '@/lib/commerce/errors';
import { gqlRequest, storefrontHeaders } from '@/lib/commerce/gql';
import {
  type GetCartOrderResult,
  type GetCartOrderVariables,
  getCartOrderQuery,
  orderStorefrontEndpoint,
} from '@/lib/commerce/order-subgraph';
import { classifyCartUpstreamError, isCartNotFoundError } from '@/lib/commerce/upstream-errors';

async function readCart(req: Request, res: Response): Promise<void> {
  const cartId: unknown = req.params.id;
  if (typeof cartId !== 'string' || !cartId) {
    throw new InvalidRequestError('Missing cart id');
  }

  const config: CommerceConfig = readCommerceConfigForResponse(res);
  assertCommerceCartScope(req, config);
  const { storeId, clientId, apiBaseUrl } = config;

  let data: GetCartOrderResult;
  try {
    data = await gqlRequest<GetCartOrderResult, GetCartOrderVariables>({
      endpoint: orderStorefrontEndpoint({ apiBaseUrl }),
      query: getCartOrderQuery,
      variables: { id: cartId },
      headers: storefrontHeaders({ storeId, clientId }),
    });
  } catch (error) {
    if (isCartNotFoundError(error)) {
      res.status(200).json({ cart: null });
      return;
    }
    throw error;
  }

  // Normalise to a stable `cart` key so client code never has to know that
  // the underlying GraphQL field is `orderById`. See docblock at the top
  // of this file.
  res.json({ cart: data.orderById ?? null });
}

export default commerceRoute('Failed to load cart', readCart, {
  classifyUpstreamError: classifyCartUpstreamError,
});
