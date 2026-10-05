// SERVER ONLY: uses node:crypto. Browser code receives cartScope from GET /api/commerce/config.
import { createHash } from 'node:crypto';
import type { Request } from 'express';
import type { CommerceConfig } from './config';
import { ScopeMismatchError } from './errors';

type CartBinding = Pick<CommerceConfig, 'apiBaseUrl' | 'storeId' | 'channelId' | 'currencyCode'>;

/** Public cache/storage scope, not an authorization credential. */
export function getCommerceCartScope(config: CartBinding): string {
  return createHash('sha256')
    .update(JSON.stringify([config.apiBaseUrl, config.storeId, config.channelId, config.currencyCode]))
    .digest('hex')
    .slice(0, 32);
}

/** Existing custom clients may omit the header; managed components always send it. */
export function assertCommerceCartScope(req: Request, config: CartBinding): void {
  const suppliedScope: string | string[] | undefined = req.headers?.['x-commerce-scope'];
  if (suppliedScope === undefined || suppliedScope === getCommerceCartScope(config)) return;
  throw new ScopeMismatchError();
}
