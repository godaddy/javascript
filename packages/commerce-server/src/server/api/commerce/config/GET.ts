/**
 * GET /api/commerce/config
 * Public binding configuration for the shared CommerceProvider.
 * Store/channel IDs and credentials stay server-side. Do not cache across bindings.
 */
import type { Request, Response } from 'express';
import { getCommerceCartScope } from '@/lib/commerce/cart-scope';
import { commerceRoute } from '@/lib/commerce/commerce-route';
import { type CommerceConfig, commerceConfigurationForResponse } from '@/lib/commerce/config';

async function readPublicConfig(_req: Request, res: Response): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  const config: CommerceConfig = commerceConfigurationForResponse(res).read();
  res.json({
    cartScope: getCommerceCartScope(config),
    currencyCode: config.currencyCode,
  });
}

export default commerceRoute('Failed to load Commerce configuration', readPublicConfig);
