/**
 * GET /api/commerce/config
 * Public binding configuration for the shared CommerceProvider.
 * Store/channel IDs and credentials stay server-side. Do not cache across bindings.
 */
import type { Request, Response } from 'express';
import { getCommerceCartScope } from '@/lib/commerce/cart-scope';
import { commerceRoute } from '@/lib/commerce/commerce-route';
import {
  type CommerceConfig,
  commerceConfigurationForResponse,
  readCommerceConnectionState,
  readReadyCommerceConfig,
} from '@/lib/commerce/config';

async function readPublicConfig(_req: Request, res: Response): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  const configuration = commerceConfigurationForResponse(res);
  const state = readCommerceConnectionState(configuration);
  if (state === 'unbound' || state === 'connecting') {
    res.json({ state });
    return;
  }
  const config: CommerceConfig = readReadyCommerceConfig(configuration);
  res.json({
    ...(state === 'ready' ? { state } : {}),
    cartScope: getCommerceCartScope(config),
    currencyCode: config.currencyCode,
  });
}

export default commerceRoute('Failed to load Commerce configuration', readPublicConfig);
