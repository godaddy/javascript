import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CommerceCheckoutConfiguration } from './lib/commerce/checkout-config';
import type { CheckoutSessionResult, CreateCheckoutSessionResult } from './lib/commerce/checkout-subgraph';
import type { CommerceConfig, CommerceConfiguration } from './lib/commerce/config';
import {
  type CreateCheckoutSessionParams,
  createCheckoutSession,
} from './lib/commerce/create-checkout-session';

const { mockGetOAuthAccessToken, mockGqlRequest } = vi.hoisted(() => ({
  mockGetOAuthAccessToken: vi.fn(),
  mockGqlRequest: vi.fn(),
}));
vi.mock('./lib/commerce/checkout-subgraph', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./lib/commerce/checkout-subgraph')>()),
  getOAuthAccessToken: mockGetOAuthAccessToken,
}));
vi.mock('./lib/commerce/gql', () => ({ gqlRequest: mockGqlRequest }));

const urls = { returnUrl: 'https://example.com/cart', successUrl: 'https://example.com/success' };
const flows = [
  ['non-catalog', { ...urls, lineItemData: { name: 'Camp registration', priceData: { unitAmount: 59900 } } }],
  ['cart', { ...urls, draftOrderId: 'draft-1' }],
  ['buy-now', { ...urls, skuId: 'sku-1' }],
] as const;
const nonCatalog = flows[0][1];
const cart = flows[1][1];
let config: CommerceConfig;
let checkout: CommerceCheckoutConfiguration;
const configuration: CommerceConfiguration = {
  read: vi.fn(() => config),
  readCheckout: () => checkout,
};

function response(overrides: Partial<CheckoutSessionResult> = {}): CreateCheckoutSessionResult {
  return {
    createCheckoutSession: {
      id: 'session-1',
      url: 'https://checkout.commerce.godaddy.com/c/session-1',
      storeId: 'store-1',
      businessId: 'business-1',
      channelId: 'channel-1',
      storeName: 'Future Makers Camp',
      paymentMethods: { card: { processor: 'godaddy', checkoutTypes: ['standard'] } },
      ...overrides,
    },
  };
}

beforeEach((): void => {
  vi.resetAllMocks();
  config = {
    clientId: 'client-1',
    clientSecret: 'secret-1',
    storeId: 'store-1',
    channelId: 'channel-1',
    apiBaseUrl: 'https://api.godaddy.com',
    currencyCode: 'USD',
  };
  checkout = { enablePromotionCodes: false, enableTaxCollection: false, enableShipping: false };
  vi.mocked(configuration.read).mockImplementation(() => config);
  mockGetOAuthAccessToken.mockResolvedValue({
    access_token: 'access-token',
    scope: 'commerce.product:read',
    expires_in: 3600,
  });
  mockGqlRequest.mockResolvedValue(response());
});

describe('createCheckoutSession', () => {
  it('returns verified checkout data without assigning host attribution', async (): Promise<void> => {
    await expect(createCheckoutSession(nonCatalog, configuration)).resolves.toEqual({
      url: 'https://checkout.commerce.godaddy.com/c/session-1',
      id: 'session-1',
      draftOrderId: null,
      storeId: 'store-1',
      channelId: 'channel-1',
      businessId: 'business-1',
      storeName: 'Future Makers Camp',
      sourceApp: null,
    });
    expect(configuration.read).toHaveBeenCalledTimes(1);
    expect(mockGetOAuthAccessToken).toHaveBeenCalledWith({
      clientId: 'client-1',
      clientSecret: 'secret-1',
      apiBaseUrl: 'https://api.godaddy.com',
      scope: 'commerce.product:read',
    });
  });

  it.each(flows)(
    'uses default payments without built-in attribution for %s checkout',
    async (_name, params): Promise<void> => {
      await createCheckoutSession(params, configuration);
      const input = mockGqlRequest.mock.calls[0]?.[0].variables.input;
      expect(input).toMatchObject({
        paymentMethods: { card: { processor: 'godaddy', checkoutTypes: ['standard'] } },
      });
      expect(input).not.toHaveProperty('sourceApp');
      expect(input).not.toHaveProperty('owner');
    },
  );

  it.each(flows)('uses only host-owned attribution for %s checkout', async (_name, params): Promise<void> => {
    config = { ...config, sourceApp: 'merchant-site', owner: 'merchant-orders' };
    mockGqlRequest.mockResolvedValue(response({ sourceApp: 'merchant-site' }));
    const input = {
      ...params,
      sourceApp: 'untrusted-source',
      owner: 'untrusted-owner',
      apiBaseUrl: 'https://untrusted.example.com',
    };
    await expect(createCheckoutSession(input, configuration)).resolves.toMatchObject({
      sourceApp: 'merchant-site',
    });
    expect(mockGqlRequest.mock.calls[0]?.[0].variables.input).toMatchObject({
      sourceApp: 'merchant-site',
      owner: 'merchant-orders',
    });
    expect(mockGetOAuthAccessToken).toHaveBeenCalledWith(
      expect.objectContaining({ apiBaseUrl: 'https://api.godaddy.com' }),
    );
  });

  it('uses the host API origin for OAuth and hosted checkout', async (): Promise<void> => {
    config.apiBaseUrl = 'https://api.example.com';
    await createCheckoutSession(cart, configuration);
    expect(mockGetOAuthAccessToken).toHaveBeenCalledWith(
      expect.objectContaining({ apiBaseUrl: 'https://api.example.com' }),
    );
    expect(mockGqlRequest).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: 'https://checkout.commerce.api.example.com' }),
    );
  });

  it.each(['storeId', 'channelId'] as const)(
    'rejects a checkout session with a different %s',
    async (field): Promise<void> => {
      mockGqlRequest.mockResolvedValue(response({ [field]: 'other' }));
      await expect(createCheckoutSession(cart, configuration)).rejects.toThrow(
        'Checkout session binding mismatch',
      );
    },
  );

  it.each(flows)('rejects missing payment methods for %s checkout', async (_name, params): Promise<void> => {
    mockGqlRequest.mockResolvedValue(response({ paymentMethods: null }));
    await expect(createCheckoutSession(params, configuration)).rejects.toThrow(
      'Checkout session did not configure payment methods.',
    );
  });

  it.each([flows[1], flows[2]])(
    'uses the store shipping configuration for %s checkout',
    async (_name, params): Promise<void> => {
      checkout = { enablePromotionCodes: true, enableTaxCollection: true, enableShipping: true };
      mockGqlRequest.mockResolvedValue(
        response({
          enablePromotionCodes: true,
          enableTaxCollection: true,
          enableShipping: true,
          enableShippingAddressCollection: true,
        }),
      );
      await createCheckoutSession(params, configuration);
      const input = mockGqlRequest.mock.calls[0]?.[0].variables.input;
      expect(input).toMatchObject({
        enablePromotionCodes: true,
        enableTaxCollection: true,
        enableShipping: true,
        enableShippingAddressCollection: true,
      });
      expect(input).not.toHaveProperty('shipping');
    },
  );

  it.each([
    {
      originAddress: {
        addressLine1: '123 Main St',
        adminArea1: 'AZ',
        adminArea2: 'Tempe',
        postalCode: '85281',
        countryCode: 'US',
      },
    },
    { fulfillmentLocationId: 'location-1' },
  ])('passes explicit API shipping options from the host: %j', async (shipping): Promise<void> => {
    checkout = { ...checkout, enableShipping: true, shipping };
    mockGqlRequest.mockResolvedValue(
      response({ enableShipping: true, enableShippingAddressCollection: true }),
    );
    await createCheckoutSession(cart, configuration);
    expect(mockGqlRequest.mock.calls[0]?.[0].variables.input.shipping).toEqual(shipping);
  });

  it('does not apply shipping or promotion codes to non-catalog checkout', async (): Promise<void> => {
    checkout = {
      enablePromotionCodes: true,
      enableTaxCollection: true,
      enableShipping: true,
      shipping: { fulfillmentLocationId: 'location-1' },
    };
    mockGqlRequest.mockResolvedValue(response({ enableTaxCollection: true }));
    await createCheckoutSession(nonCatalog, configuration);
    const input = mockGqlRequest.mock.calls[0]?.[0].variables.input;
    expect(input).toMatchObject({
      enableTaxCollection: true,
      enableShipping: false,
      enableShippingAddressCollection: false,
    });
    expect(input).not.toHaveProperty('enablePromotionCodes');
    expect(input).not.toHaveProperty('shipping');
  });

  it.each([
    'enablePromotionCodes',
    'enableTaxCollection',
    'enableShipping',
    'enableShippingAddressCollection',
  ] as const)('rejects sessions that omit configured %s', async (field): Promise<void> => {
    checkout = { enablePromotionCodes: true, enableTaxCollection: true, enableShipping: true };
    mockGqlRequest.mockResolvedValue(
      response({
        enablePromotionCodes: true,
        enableTaxCollection: true,
        enableShipping: true,
        enableShippingAddressCollection: true,
        [field]: false,
      }),
    );
    await expect(createCheckoutSession(cart, configuration)).rejects.toThrow(
      'Checkout session did not enable configured',
    );
  });

  it('uses the configured currency for non-catalog pricing', async (): Promise<void> => {
    config.currencyCode = 'GBP';
    await createCheckoutSession(
      { ...nonCatalog, lineItemData: { name: 'Camp', priceData: { unitAmount: 500, currencyCode: 'USD' } } },
      configuration,
    );
    expect(mockGqlRequest.mock.calls[0]?.[0].variables.input.lineItems).toEqual([
      { quantity: 1, lineItemData: { name: 'Camp', priceData: { unitAmount: 500, currencyCode: 'GBP' } } },
    ]);
  });

  it('returns host configuration errors immediately without OAuth or checkout requests', async (): Promise<void> => {
    vi.mocked(configuration.read).mockImplementation(() => {
      throw new Error('Host configuration unavailable');
    });
    await expect(createCheckoutSession(cart, configuration)).rejects.toThrow(
      'Host configuration unavailable',
    );
    expect(configuration.read).toHaveBeenCalledTimes(1);
    expect(mockGetOAuthAccessToken).not.toHaveBeenCalled();
    expect(mockGqlRequest).not.toHaveBeenCalled();
  });

  it('redacts upstream checkout details while retaining the cause', async (): Promise<void> => {
    const upstream = new Error('Invalid origin address: 123 Main Street');
    mockGqlRequest.mockRejectedValue(upstream);
    const error = await createCheckoutSession(cart, configuration).catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe('Commerce checkout session could not be created');
    expect((error as Error).cause).toBe(upstream);
  });

  it.each([{ ...urls }, { ...cart, skuId: 'sku-1' }, { ...nonCatalog, draftOrderId: 'draft-1' }])(
    'rejects ambiguous or missing checkout sources before accessing credentials',
    async (params): Promise<void> => {
      await expect(
        createCheckoutSession(params as CreateCheckoutSessionParams, configuration),
      ).rejects.toThrow('exactly one of');
      expect(configuration.read).not.toHaveBeenCalled();
    },
  );
});
