/**
 * GET /api/commerce/config
 * Public binding configuration for the shared CommerceProvider.
 * Store/channel IDs and credentials stay server-side. Do not cache across bindings.
 */
import type { Request, Response } from 'express';
import { getCommerceCartScope } from '@/lib/commerce/cart-scope';
import { type CommerceConfig, commerceConfigurationForResponse } from '@/lib/commerce/config';

export default async function handler(_req: Request, res: Response): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const configuration = commerceConfigurationForResponse(res);
    const state = configuration.readConnectionState?.();
    if (state === 'unbound' || state === 'connecting') {
      res.json({ state });
      return;
    }
    if (state !== undefined && state !== 'ready') throw new Error('Invalid Commerce connection state.');
    const config: CommerceConfig = configuration.read();
    res.json({
      ...(state === 'ready' ? { state } : {}),
      cartScope: getCommerceCartScope(config),
      currencyCode: config.currencyCode,
    });
  } catch (cause: unknown) {
    res.status(503).json({
      error: 'Commerce configuration is unavailable. Complete the store connection before continuing.',
      message: cause instanceof Error ? cause.message : 'Invalid Commerce configuration.',
    });
  }
}
