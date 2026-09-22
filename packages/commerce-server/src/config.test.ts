import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockReadFileSync } = vi.hoisted(() => ({
  mockReadFileSync: vi.fn(),
}));

vi.mock('node:fs', () => ({
  readFileSync: mockReadFileSync,
}));

import { createRuntimeCommerceConfiguration, readCommerceConfig } from './lib/commerce/config';

function makeConfig(overrides: Record<string, string> = {}): Record<string, { VALUE: string }> {
  return Object.fromEntries(
    Object.entries({
      GODADDY_OAUTH_CLIENT_ID: 'client-1',
      GODADDY_OAUTH_CLIENT_SECRET: 'secret-1',
      GODADDY_STORE_ID: 'store-1',
      GODADDY_CHANNEL_ID: 'channel-1',
      GODADDY_API_BASE_URL: 'https://api.godaddy.com',
      GODADDY_CURRENCY_CODE: 'USD',
      ...overrides,
    }).map(([key, value]) => [key, { VALUE: value }]),
  );
}

describe('Commerce runtime configuration', () => {
  let currentConfig: Record<string, { VALUE: string }>;
  let dotEnvContent: string;

  beforeEach((): void => {
    vi.clearAllMocks();
    currentConfig = makeConfig();
    dotEnvContent = '';
    mockReadFileSync.mockImplementation((path: string): string => {
      if (path === '/local/config.json') return JSON.stringify(currentConfig);
      if (path === '.env') return dotEnvContent;
      throw new Error(`ENOENT: ${path}`);
    });
  });

  it('rereads /local/config.json in the same process', (): void => {
    expect(readCommerceConfig({ environment: {} }).storeId).toBe('store-1');
    currentConfig = makeConfig({ GODADDY_STORE_ID: 'store-2' });
    expect(readCommerceConfig({ environment: {} }).storeId).toBe('store-2');
  });

  it('keeps OAuth credentials restricted to platform configuration', (): void => {
    delete currentConfig.GODADDY_OAUTH_CLIENT_SECRET;
    expect((): void => {
      readCommerceConfig({ environment: { GODADDY_OAUTH_CLIENT_SECRET: 'public-secret' } });
    }).toThrow('Commerce config: GODADDY_OAUTH_CLIENT_SECRET is missing.');
  });

  it('uses platform values before environment and dotenv runtime fallbacks', (): void => {
    dotEnvContent = 'GODADDY_STORE_ID=dotenv-store\n';
    const result = readCommerceConfig({ environment: { GODADDY_STORE_ID: 'process-store' } });
    expect(result.storeId).toBe('store-1');
  });

  it('rejects API origins outside the trusted GoDaddy set', (): void => {
    currentConfig = makeConfig({ GODADDY_API_BASE_URL: 'https://api.godaddy.com.evil.test' });
    expect((): void => {
      readCommerceConfig({ environment: {} });
    }).toThrow('Commerce config: GODADDY_API_BASE_URL must be a trusted GoDaddy API origin.');
  });

  it('reads checkout flags from the runtime contract', (): void => {
    currentConfig.GODADDY_CHECKOUT_CONFIGURATION = {
      VALUE: JSON.stringify({
        version: 1,
        enablePromotionCodes: true,
        enableTaxCollection: false,
        enableShipping: true,
        shipping: { originAddressConfigured: true, originAddressContractVersion: 1 },
      }),
    };
    expect(createRuntimeCommerceConfiguration({ environment: {} }).readCheckout()).toMatchObject({
      enablePromotionCodes: true,
      enableTaxCollection: false,
      enableShipping: true,
      shipping: { originAddressConfigured: true, originAddressContractVersion: 1 },
    });
  });

  it('rejects malformed checkout flags instead of silently changing checkout', (): void => {
    currentConfig.GODADDY_CHECKOUT_CONFIGURATION = { VALUE: '{bad json' };
    expect((): void => {
      createRuntimeCommerceConfiguration({ environment: {} }).readCheckout();
    }).toThrow('Commerce config: GODADDY_CHECKOUT_CONFIGURATION must be valid JSON.');
  });
});
