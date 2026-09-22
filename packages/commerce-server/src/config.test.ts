import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRuntimeCommerceConfiguration, readCommerceConfig } from './lib/commerce/config';

function environment(): NodeJS.ProcessEnv {
  return {
    GODADDY_OAUTH_CLIENT_ID: 'client-1',
    GODADDY_OAUTH_CLIENT_SECRET: 'secret-1',
    GODADDY_STORE_ID: 'store-1',
    GODADDY_CHANNEL_ID: 'channel-1',
    GODADDY_CURRENCY_CODE: 'USD',
  };
}

afterEach((): void => {
  vi.unstubAllEnvs();
});

describe('Commerce runtime configuration', () => {
  it('defaults to production and does not select an API origin from environment variables', (): void => {
    const config = readCommerceConfig({
      environment: { ...environment(), GODADDY_API_BASE_URL: 'https://api.example.com' },
    });
    expect(config.apiBaseUrl).toBe('https://api.godaddy.com');
    expect(config.clientSecret).toBe('secret-1');
    expect(config).not.toHaveProperty('sourceApp');
    expect(config).not.toHaveProperty('owner');
  });

  it('reads process.env when no environment is supplied', (): void => {
    for (const [key, value] of Object.entries(environment())) vi.stubEnv(key, value);
    expect(createRuntimeCommerceConfiguration().read()).toMatchObject({
      storeId: 'store-1',
      apiBaseUrl: 'https://api.godaddy.com',
    });
  });

  it('rereads host environment values in the same process', (): void => {
    const values = environment();
    const configuration = createRuntimeCommerceConfiguration({ environment: values });
    expect(configuration.read().storeId).toBe('store-1');
    values.GODADDY_STORE_ID = 'store-2';
    expect(configuration.read().storeId).toBe('store-2');
  });

  it('accepts an explicit host-owned API origin and attribution', (): void => {
    const configuration = createRuntimeCommerceConfiguration({
      environment: environment(),
      apiBaseUrl: 'https://api.example.com/',
      sourceApp: 'merchant-site',
      owner: 'merchant-orders',
    });
    expect(configuration.read()).toMatchObject({
      apiBaseUrl: 'https://api.example.com',
      sourceApp: 'merchant-site',
      owner: 'merchant-orders',
    });
  });

  it.each([
    'not a URL',
    'http://api.example.com',
    'https://user:secret@api.example.com',
    'https://api.example.com/path',
    'https://api.example.com?key=value',
    'https://api.example.com#fragment',
  ])('rejects an invalid API origin: %s', (apiBaseUrl): void => {
    expect(() => readCommerceConfig({ environment: environment(), apiBaseUrl })).toThrow(
      'apiBaseUrl must be',
    );
  });

  it.each(Object.keys(environment()))('requires the server configuration value %s', (key): void => {
    const values = environment();
    delete values[key];
    expect(() => readCommerceConfig({ environment: values })).toThrow(`${key} is missing`);
  });

  it('reads checkout flags and API shipping options', (): void => {
    const values = environment();
    const configuration = createRuntimeCommerceConfiguration({ environment: values });
    expect(configuration.readCheckout()).toEqual({
      enablePromotionCodes: false,
      enableTaxCollection: false,
      enableShipping: false,
    });
    values.GODADDY_CHECKOUT_CONFIGURATION = JSON.stringify({
      enablePromotionCodes: true,
      enableTaxCollection: false,
      enableShipping: true,
      shipping: { fulfillmentLocationId: 'location-1' },
    });
    expect(configuration.readCheckout()).toEqual({
      enablePromotionCodes: true,
      enableTaxCollection: false,
      enableShipping: true,
      shipping: { fulfillmentLocationId: 'location-1' },
    });
  });

  it.each(['{bad json', 'null', '{"enableShipping":true}'])(
    'rejects malformed checkout configuration: %s',
    (raw): void => {
      expect(() =>
        createRuntimeCommerceConfiguration({
          environment: { ...environment(), GODADDY_CHECKOUT_CONFIGURATION: raw },
        }).readCheckout(),
      ).toThrow('Commerce config: GODADDY_CHECKOUT_CONFIGURATION');
    },
  );
});
