/**
 * POST /api/commerce/checkout
 *
 * Thin HTTP wrapper around `createCheckoutSession()` in
 * `lib/commerce/create-checkout-session.ts`. The browser MUST go through this
 * route — never call the checkout subgraph directly. Other server-side code in
 * the same app (e.g. an appointment-booking handler that needs to charge a
 * deposit) should NOT loopback-fetch this endpoint; import
 * `createCheckoutSession` from the lib module and call it in-process so the
 * inbound request's cookies/auth context aren't stripped.
 *
 * Body:
 *   draftOrderId?  - existing cart/draft order to convert to a checkout session
 *   skuId?         - Buy Now path; checkout is built from a single line item
 *   quantity?      - quantity for Buy Now or non-catalog paths (defaults to 1)
 *   lineItemData?  - Non-catalog path; { name, priceData: { unitAmount, currencyCode } }.
 *                    Mutually exclusive with skuId and draftOrderId. No SKU or catalog
 *                    product is created. unitAmount is in the currency's smallest unit.
 *   returnUrl      - where the hosted checkout sends the shopper on cancel/back
 *   successUrl     - where the hosted checkout sends the shopper after payment
 *
 * The caller is responsible for embedding `draftOrderId` (or any business
 * order id) into `successUrl` before posting, e.g.
 *   `${origin}/checkout/success?orderId=${draftOrderId}`
 * GoDaddy's hosted checkout does NOT append the order id to the redirect, so
 * the success page has no way to know which order completed unless it is in
 * the URL the caller supplies here.
 *
 * `storeId` and `channelId` are read server-side from `readCommerceConfig()`
 * and `sourceApp` is set by the server checkout helper — never from the request
 * body, so the client cannot choose which store/channel/source to charge.
 *
 * Response: { url, id, draftOrderId, storeId, channelId, businessId,
 * storeName, sourceApp } from the created checkout session. The route returns
 * 500 if checkout-api does not preserve the configured store/channel binding.
 * Browser callers should redirect to `response.url`; this route does not
 * return a `redirectUrl` field.
 */
import type { Request, Response } from 'express';
import { validateCommerceCartScope } from '@/lib/commerce/cart-scope';
import { type CommerceConfig, commerceConfigurationForResponse } from '@/lib/commerce/config';

import {
  type CreateCheckoutSessionParams,
  createCheckoutSession,
} from '@/lib/commerce/create-checkout-session';

type CheckoutBody = Partial<CreateCheckoutSessionParams>;

export default async function handler(req: Request, res: Response): Promise<void> {
  try {
    const configuration = commerceConfigurationForResponse(res);
    const body = (req.body ?? {}) as CheckoutBody;
    const { draftOrderId, skuId, quantity, lineItemData, returnUrl, successUrl } = body;

    if (!returnUrl || !successUrl) {
      res.status(400).json({ error: 'missing returnUrl or successUrl' });
      return;
    }

    const checkoutSourceCount = [draftOrderId, skuId, lineItemData].filter(Boolean).length;
    if (checkoutSourceCount !== 1) {
      res.status(400).json({ error: 'exactly one of draftOrderId, skuId, or lineItemData is required' });
      return;
    }

    if (req.headers?.['x-commerce-scope'] !== undefined) {
      const config: CommerceConfig = configuration.read();
      if (!validateCommerceCartScope(req, res, config)) return;
    }

    const session = await createCheckoutSession(
      {
        draftOrderId,
        skuId,
        quantity,
        lineItemData,
        returnUrl,
        successUrl,
      },
      configuration,
    );

    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create checkout session',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
