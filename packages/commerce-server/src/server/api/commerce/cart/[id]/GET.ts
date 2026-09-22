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
import { validateCommerceCartScope } from '@/lib/commerce/cart-scope';
import { type CommerceConfig, readCommerceConfigForResponse } from '@/lib/commerce/config';
import { GraphQLErrorWithCodes, gqlRequest, storefrontHeaders } from '@/lib/commerce/gql';
import {
  type GetCartOrderResult,
  type GetCartOrderVariables,
  getCartOrderQuery,
  orderStorefrontEndpoint,
} from '@/lib/commerce/order-subgraph';

function isCartNotFoundError(error: unknown): boolean {
  if (!(error instanceof GraphQLErrorWithCodes)) {
    return false;
  }

  // A transport failure or an unrelated GraphQL error must not erase a saved cart.
  // A bare HTTP 404 can also mean the upstream endpoint itself is unavailable.
  const isFailure = (status: number | undefined): boolean =>
    status !== undefined && status >= 400 && status !== 404 && status !== 410;
  if (isFailure(error.status) || error.errors.length === 0) return false;

  return error.errors.every(({ code, message, status }): boolean => {
    if (isFailure(status)) return false;
    // Orders throws this exact message for absent or non-draft orders; Apollo
    // supplies its generic code rather than a domain-specific not-found code.
    if (code === 'INTERNAL_SERVER_ERROR' && message === 'Order not found') return true;
    if (code && /^(?:DRAFT[_-]?)?(?:ORDER|CART)[_-]?(?:NOT[_-]?FOUND|EXPIRED)$/i.test(code)) return true;
    if (code && !/^(?:NOT[_-]?FOUND|EXPIRED)$/i.test(code)) return false;
    return /\b(?:cart|(?:draft[ -])?order)\s+(?:(?:is|was|has)\s+)?(?:not found|expired)\b/i.test(
      message ?? '',
    );
  });
}

export default async function handler(req: Request, res: Response): Promise<void> {
  try {
    const cartId: unknown = req.params.id;
    if (typeof cartId !== 'string' || !cartId) {
      res.status(400).json({ error: 'Missing cart id' });
      return;
    }

    const config: CommerceConfig = readCommerceConfigForResponse(res);
    if (!validateCommerceCartScope(req, res, config)) return;
    const { storeId, clientId, apiBaseUrl } = config;

    const data = await gqlRequest<GetCartOrderResult, GetCartOrderVariables>({
      endpoint: orderStorefrontEndpoint({ apiBaseUrl }),
      query: getCartOrderQuery,
      variables: { id: cartId },
      headers: storefrontHeaders({ storeId, clientId }),
    });

    // Normalise to a stable `cart` key so client code never has to know that
    // the underlying GraphQL field is `orderById`. See docblock at the top
    // of this file.
    res.json({ cart: data.orderById ?? null });
  } catch (error) {
    if (isCartNotFoundError(error)) {
      res.status(200).json({ cart: null });
      return;
    }

    res.status(500).json({
      error: 'Failed to load cart',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
