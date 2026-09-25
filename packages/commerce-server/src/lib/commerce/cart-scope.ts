// SERVER ONLY: uses node:crypto. Browser code receives cartScope from GET /api/commerce/config.
import { createHash } from 'node:crypto';
import type { Request, Response } from 'express';
import type { CommerceConfig } from './config';

type CartBinding = Pick<CommerceConfig, 'apiBaseUrl' | 'storeId' | 'channelId'>;

/** Public cache/storage scope, not an authorization credential. */
export function getCommerceCartScope(config: CartBinding): string {
  return createHash('sha256')
    .update(JSON.stringify([config.apiBaseUrl, config.storeId, config.channelId]))
    .digest('hex')
    .slice(0, 32);
}

/** Existing custom clients may omit the header; managed components always send it. */
export function validateCommerceCartScope(req: Request, res: Response, config: CartBinding): boolean {
  const suppliedScope: string | string[] | undefined = req.headers?.['x-commerce-scope'];
  if (suppliedScope === undefined || suppliedScope === getCommerceCartScope(config)) return true;
  res.status(409).json({ error: 'The connected store changed. Reload the page before continuing.' });
  return false;
}
