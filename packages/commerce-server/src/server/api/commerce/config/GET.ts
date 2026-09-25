/**
 * GET /api/commerce/config
 * Public { cartScope, currencyCode } for the shared CommerceProvider.
 * Store/channel IDs and credentials stay server-side. Do not cache across bindings.
 */
import type { Request, Response } from 'express';
import { getCommerceCartScope } from '@/lib/commerce/cart-scope';
import { type CommerceConfig, readCommerceConfigForResponse } from '@/lib/commerce/config';

export default async function handler(_req: Request, res: Response): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const config: CommerceConfig = readCommerceConfigForResponse(res);
    res.json({ cartScope: getCommerceCartScope(config), currencyCode: config.currencyCode });
  } catch (cause: unknown) {
    res.status(503).json({
      error: 'Commerce configuration is unavailable. Complete the store connection before continuing.',
      message: cause instanceof Error ? cause.message : 'Invalid Commerce configuration.',
    });
  }
}
