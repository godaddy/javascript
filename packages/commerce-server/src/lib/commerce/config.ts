/** Server-only Commerce configuration. Hosts own secrets and deployment-specific loading. */
import type { Response } from 'express';
import { type CommerceCheckoutConfiguration, parseCommerceCheckoutConfiguration } from './checkout-config';

const DEFAULT_API_BASE_URL = 'https://api.godaddy.com';

export interface CommerceConfig {
  /** Public OAuth client id. */
  clientId: string;
  /** Server-only OAuth client secret. Never expose to the browser. */
  clientSecret: string;
  storeId: string;
  /** Sales channel used for orders and checkout. */
  channelId: string;
  /** HTTPS API origin. The default configuration uses https://api.godaddy.com. */
  apiBaseUrl: string;
  /** ISO 4217 currency code used when seeding empty cart totals. */
  currencyCode: string;
  /** Optional host-owned checkout attribution. Never read from request bodies. */
  sourceApp?: string;
  /** Optional host-owned attribution shared by draft orders and checkout. */
  owner?: string;
}

export interface CommerceConfiguration {
  read(): CommerceConfig;
  readCheckout(): CommerceCheckoutConfiguration;
}

export interface RuntimeCommerceConfigurationOptions {
  /** Server environment containing credentials, store/channel IDs, currency, and checkout flags. */
  environment?: NodeJS.ProcessEnv;
  /** Explicit server-controlled API origin override. Defaults to production. */
  apiBaseUrl?: string;
  sourceApp?: string;
  owner?: string;
}

function normalizeApiBaseUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('Commerce config: apiBaseUrl must be a valid HTTPS origin.');
  }
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      'Commerce config: apiBaseUrl must be an HTTPS origin without credentials, path, query, or fragment.',
    );
  }
  return url.origin;
}

function requireValue(environment: NodeJS.ProcessEnv, key: string): string {
  const value = environment[key]?.trim();
  if (!value) throw new Error(`Commerce config: ${key} is missing. Configure it in the server environment.`);
  return value;
}

/** Read server environment values on each call. Loading files or secret stores belongs to the host. */
export function readCommerceConfig(options: RuntimeCommerceConfigurationOptions = {}): CommerceConfig {
  const environment = options.environment ?? process.env;
  return {
    clientId: requireValue(environment, 'GODADDY_OAUTH_CLIENT_ID'),
    clientSecret: requireValue(environment, 'GODADDY_OAUTH_CLIENT_SECRET'),
    storeId: requireValue(environment, 'GODADDY_STORE_ID'),
    channelId: requireValue(environment, 'GODADDY_CHANNEL_ID'),
    currencyCode: requireValue(environment, 'GODADDY_CURRENCY_CODE'),
    apiBaseUrl: normalizeApiBaseUrl(options.apiBaseUrl ?? DEFAULT_API_BASE_URL),
    ...(options.sourceApp ? { sourceApp: options.sourceApp } : {}),
    ...(options.owner ? { owner: options.owner } : {}),
  };
}

export function createRuntimeCommerceConfiguration(
  options: RuntimeCommerceConfigurationOptions = {},
): CommerceConfiguration {
  return {
    read: (): CommerceConfig => readCommerceConfig(options),
    readCheckout: (): CommerceCheckoutConfiguration =>
      parseCommerceCheckoutConfiguration((options.environment ?? process.env).GODADDY_CHECKOUT_CONFIGURATION),
  };
}

export function commerceConfigurationForResponse(res: Response): CommerceConfiguration {
  const configuration: unknown = res.locals.commerceConfiguration;
  if (
    configuration &&
    typeof configuration === 'object' &&
    'read' in configuration &&
    typeof configuration.read === 'function' &&
    'readCheckout' in configuration &&
    typeof configuration.readCheckout === 'function'
  ) {
    return configuration as CommerceConfiguration;
  }
  return createRuntimeCommerceConfiguration();
}

export function readCommerceConfigForResponse(res: Response): CommerceConfig {
  return commerceConfigurationForResponse(res).read();
}
