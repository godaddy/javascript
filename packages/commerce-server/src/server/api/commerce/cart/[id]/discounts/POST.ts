/**
 * POST /api/commerce/cart/:id/discounts
 *
 * Apply one or more promo codes to the cart. Optional — only wire up if
 * the design includes a promo-code field in the cart drawer.
 *
 * Body: { discountCodes: string[] }
 *
 * Response: { cart: CartOrder | null }
 *   `applyDiscountCodes` returns a partial CartOrder shape (id, discounts,
 *   totals only). Rather than rely on that subset, the route discards it
 *   and re-fetches the full cart via `orderById`, returning it under the
 *   same `cart` key as GET /api/commerce/cart/:id so clients only ever
 *   read one shape.
 */
import type { Request, Response } from 'express';
import { validateCommerceCartScope } from '../../../../../../lib/commerce/cart-scope';
import { type CommerceConfig, readCommerceConfigForResponse } from '../../../../../../lib/commerce/config';
import { gqlRequest, storefrontHeaders } from '../../../../../../lib/commerce/gql';
import {
  type ApplyDiscountCodesResult,
  type ApplyDiscountCodesVariables,
  type GetCartOrderResult,
  type GetCartOrderVariables,
  getCartOrderQuery,
  orderStorefrontEndpoint,
} from '../../../../../../lib/commerce/order-subgraph';

const applyDiscountCodesMutation = `
  mutation ApplyDiscountCodes($input: ApplyDiscountCodesInput!) {
    applyDiscountCodes(input: $input) {
      id
    }
  }
`;

interface ApplyDiscountsBody {
  discountCodes?: unknown;
}

export default async function handler(req: Request, res: Response): Promise<void> {
  try {
    const cartId: unknown = req.params.id;
    if (typeof cartId !== 'string' || !cartId) {
      res.status(400).json({ error: 'Missing cart id' });
      return;
    }

    const body = (req.body ?? {}) as ApplyDiscountsBody;
    const codes = Array.isArray(body.discountCodes)
      ? body.discountCodes.filter((code): code is string => typeof code === 'string' && code.length > 0)
      : [];

    if (codes.length === 0) {
      res.status(400).json({ error: 'discountCodes must be a non-empty string array' });
      return;
    }

    const config: CommerceConfig = readCommerceConfigForResponse(res);
    if (!validateCommerceCartScope(req, res, config)) return;
    const { storeId, clientId, apiBaseUrl } = config;
    const endpoint = orderStorefrontEndpoint({ apiBaseUrl });
    const headers = storefrontHeaders({ storeId, clientId });

    await gqlRequest<ApplyDiscountCodesResult, ApplyDiscountCodesVariables>({
      endpoint,
      query: applyDiscountCodesMutation,
      variables: { input: { orderId: cartId, discountCodes: codes } },
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
      error: 'Failed to apply discount codes',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
