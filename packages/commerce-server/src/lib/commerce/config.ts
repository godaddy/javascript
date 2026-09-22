/**
 * Server-side Commerce config loader.
 *
 * Reads platform-managed OAuth credentials from `/local/config.json` (the Nomad
 * task-local config; `/alloc/config.json` is a compatibility symlink) and the
 * store/channel/currency values from `/local/config.json`, with env fallbacks
 * for downloaded/local apps. The API base URL is platform-controlled runtime
 * config and is validated against exact GoDaddy API origins before use.
 *
 * Every entry in `/local/config.json` is shaped `{ SYSTEM_MANAGED: boolean, VALUE: string }`.
 * Always read `.VALUE` — casting an entry to `string` produces `[object Object]`,
 * which the OAuth endpoint silently rejects with 401.
 *
 * Server-only. Do not import this file from client code; it both reads disk
 * and surfaces `clientSecret`.
 */

import { readFileSync } from 'node:fs';
import type { Response } from 'express';
import { type CommerceCheckoutConfiguration, parseCommerceCheckoutConfiguration } from './checkout-config';

const DEFAULT_CONFIG_PATHS = ['/local/config.json', '/alloc/config.json'] as const;
const DEFAULT_DOTENV_PATHS = ['.env', '.env.local'] as const;
const ALLOWED_GODADDY_API_BASE_URLS = new Set([
  'https://api.godaddy.com',
  'https://api.dev-godaddy.com',
  'https://api.test-godaddy.com',
]);

interface PlatformManagedEntry {
  SYSTEM_MANAGED?: boolean;
  VALUE?: string;
}

type ConfigJson = Record<string, PlatformManagedEntry | string | undefined>;

export interface CommerceConfig {
  /** Public OAuth client id (UUID). Sent as `X-Client-ID` and as the OAuth `client_id`. */
  clientId: string;
  /** Server-only OAuth client secret. Never expose to the browser. */
  clientSecret: string;
  /** Store id from the `commerce` skill setup. */
  storeId: string;
  /** Channel id from the `commerce` skill setup. Required so admin order numbers sequence correctly. */
  channelId: string;
  /** Full origin including scheme (e.g. `https://api.godaddy.com`, `https://api.dev-godaddy.com`). */
  apiBaseUrl: string;
  /** ISO 4217 currency code used when seeding empty cart totals. */
  currencyCode: string;
}

export interface CommerceConfiguration {
  read(): CommerceConfig;
  readCheckout(): CommerceCheckoutConfiguration;
}

export interface RuntimeCommerceConfigurationOptions {
  configPaths?: readonly string[];
  dotenvPaths?: readonly string[];
  environment?: NodeJS.ProcessEnv;
}

function readConfigJson(options: RuntimeCommerceConfigurationOptions): ConfigJson {
  for (const path of options.configPaths ?? DEFAULT_CONFIG_PATHS) {
    try {
      const raw = readFileSync(path, 'utf-8');
      return JSON.parse(raw) as ConfigJson;
    } catch {
      // Try the next path. Both missing files and parse errors fall through;
      // the final unwrap step will surface a clear error if everything is empty.
    }
  }

  return {};
}

function unwrapConfigEntry(entry: PlatformManagedEntry | string | undefined): string | undefined {
  if (typeof entry === 'string') return entry;
  if (entry && typeof entry === 'object' && typeof entry.VALUE === 'string') {
    return entry.VALUE;
  }
  return undefined;
}

function readConfigValue(key: string, options: RuntimeCommerceConfigurationOptions): string | undefined {
  return unwrapConfigEntry(readConfigJson(options)[key]);
}

function readDotEnv(options: RuntimeCommerceConfigurationOptions): Record<string, string> {
  const values: Record<string, string> = {};
  for (const path of options.dotenvPaths ?? DEFAULT_DOTENV_PATHS) {
    try {
      const raw = readFileSync(path, 'utf-8');
      for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = line.indexOf('=');
        if (eqIdx <= 0) continue;
        const key = line.slice(0, eqIdx).trim();
        const value = line
          .slice(eqIdx + 1)
          .trim()
          .replace(/^['"]|['"]$/g, '');
        values[key] = value;
      }
    } catch {
      // Missing local env files are fine; /local/config.json is authoritative in hosted runtimes.
    }
  }

  return values;
}

function readRuntimeValue(
  keys: readonly string[],
  options: RuntimeCommerceConfigurationOptions,
): string | undefined {
  const dotEnv = readDotEnv(options);
  const environment = options.environment ?? process.env;
  for (const key of keys) {
    const value = readConfigValue(key, options) ?? environment[key] ?? dotEnv[key];
    if (value?.trim()) return value;
  }
  return undefined;
}

function normalizeApiBaseUrl(raw: string): string {
  const candidate = raw.includes('://') ? raw : `https://${raw}`;
  let origin: string;
  try {
    origin = new URL(candidate).origin;
  } catch {
    throw new Error('Commerce config: GODADDY_API_BASE_URL must be a valid GoDaddy API origin.');
  }

  if (!ALLOWED_GODADDY_API_BASE_URLS.has(origin)) {
    throw new Error('Commerce config: GODADDY_API_BASE_URL must be a trusted GoDaddy API origin.');
  }

  return origin;
}

function readApiBaseUrl(options: RuntimeCommerceConfigurationOptions): string | undefined {
  const dotEnv = readDotEnv(options);
  const environment = options.environment ?? process.env;
  const hostOnly = environment.VITE_GODADDY_API_HOST ?? dotEnv.VITE_GODADDY_API_HOST;
  const normalizedHost = hostOnly?.replace(/^https?:\/\//, '').trim();
  return (
    environment.GODADDY_API_BASE_URL ??
    (normalizedHost ? `https://${normalizedHost}` : undefined) ??
    readConfigValue('GODADDY_API_BASE_URL', options) ??
    readConfigValue('VITE_GODADDY_API_BASE_URL', options) ??
    dotEnv.GODADDY_API_BASE_URL ??
    dotEnv.VITE_GODADDY_API_BASE_URL
  );
}

function requireValue(value: string | undefined, label: string, fix: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`Commerce config: ${label} is missing. ${fix}`);
  }
  return trimmed;
}

/**
 * Load the full Commerce config. Throws with an actionable message if any
 * required value is missing — never prompt the user for `GODADDY_OAUTH_CLIENT_SECRET`,
 * surface the missing-config failure to the operator instead.
 */
export function readCommerceConfig(options: RuntimeCommerceConfigurationOptions = {}): CommerceConfig {
  const clientId = requireValue(
    readConfigValue('GODADDY_OAUTH_CLIENT_ID', options),
    'GODADDY_OAUTH_CLIENT_ID',
    'The platform should mount this in /local/config.json. If it is missing, the runtime is misconfigured.',
  );

  const clientSecret = requireValue(
    readConfigValue('GODADDY_OAUTH_CLIENT_SECRET', options),
    'GODADDY_OAUTH_CLIENT_SECRET',
    'This must come from /local/config.json — never from env vars or user input.',
  );

  const storeId = requireValue(
    readRuntimeValue(['GODADDY_STORE_ID', 'VITE_GODADDY_STORE_ID'], options),
    'GODADDY_STORE_ID',
    'Complete the Commerce binding so the store id is written to /local/config.json. Do not hardcode store ids in source files.',
  );

  const channelId = requireValue(
    readRuntimeValue(['GODADDY_CHANNEL_ID', 'VITE_GODADDY_CHANNEL_ID'], options),
    'GODADDY_CHANNEL_ID',
    'Complete the Commerce binding so the channel id is written to /local/config.json. Do not hardcode channel ids in source files.',
  );

  const apiBaseUrl = normalizeApiBaseUrl(
    requireValue(
      readApiBaseUrl(options),
      'GODADDY_API_BASE_URL',
      'The platform should provide this runtime env value; do not add a custom API origin in user-managed secrets.',
    ),
  );

  const currencyCode = requireValue(
    readRuntimeValue(['GODADDY_CURRENCY_CODE', 'VITE_GODADDY_CURRENCY_CODE'], options),
    'GODADDY_CURRENCY_CODE',
    'Run Commerce provisioning so the currency code is written to /local/config.json. Do not hardcode a currency code in source files.',
  );

  return {
    clientId,
    clientSecret,
    storeId,
    channelId,
    apiBaseUrl,
    currencyCode,
  };
}

export function createRuntimeCommerceConfiguration(
  options: RuntimeCommerceConfigurationOptions = {},
): CommerceConfiguration {
  return {
    read: (): CommerceConfig => readCommerceConfig(options),
    readCheckout: (): CommerceCheckoutConfiguration =>
      parseCommerceCheckoutConfiguration(readRuntimeValue(['GODADDY_CHECKOUT_CONFIGURATION'], options)),
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
