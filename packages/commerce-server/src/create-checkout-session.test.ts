import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CheckoutSessionResult, CreateCheckoutSessionResult } from './lib/commerce/checkout-subgraph';
import {
  CommerceConfigPendingError,
  type CreateCheckoutSessionParams,
  createCheckoutSession,
} from './lib/commerce/create-checkout-session';

const { mockGetOAuthAccessToken, mockGqlRequest, mockReadCommerceConfig, mockCheckoutConfiguration } =
  vi.hoisted(function mocks() {
    return {
      mockGetOAuthAccessToken: vi.fn(),
      mockGqlRequest: vi.fn(),
      mockReadCommerceConfig: vi.fn(),
      mockCheckoutConfiguration: {
        storeId: undefined as string | undefined,
        channelId: undefined as string | undefined,
        currencyCode: undefined as string | undefined,
        enablePromotionCodes: false,
        enableTaxCollection: false,
        enableShipping: false,
        shipping: undefined as
          | { originAddressConfigured: true; originAddressContractVersion: 1 }
          | { originAddress: Record<string, unknown> }
          | undefined,
      },
    };
  });

vi.mock('./lib/commerce/checkout-subgraph', async function mock(importOriginal) {
  return {
    ...(await importOriginal<typeof import('./lib/commerce/checkout-subgraph')>()),
    getOAuthAccessToken: mockGetOAuthAccessToken,
  };
});

vi.mock('./lib/commerce/config', function mock() {
  return {
    createRuntimeCommerceConfiguration: () => ({
      read: mockReadCommerceConfig,
      readCheckout: () => mockCheckoutConfiguration,
    }),
  };
});

vi.mock('./lib/commerce/gql', function mock() {
  return { gqlRequest: mockGqlRequest };
});

const checkoutParams: CreateCheckoutSessionParams = {
  lineItemData: {
    name: 'Camp registration',
    priceData: { unitAmount: 59900 },
  },
  returnUrl: 'https://example.com/enroll',
  successUrl: 'https://example.com/enroll/confirmation',
};

function response(overrides: Partial<CheckoutSessionResult> = {}): CreateCheckoutSessionResult {
  return {
    createCheckoutSession: {
      id: 'session-1',
      url: 'https://checkout.commerce.godaddy.com/c/session-1',
      sourceApp: 'airo.ai.builder',
      storeId: 'store-1',
      businessId: 'business-1',
      channelId: 'channel-1',
      storeName: 'Future Makers Camp',
      paymentMethods: { card: { processor: 'godaddy', checkoutTypes: ['standard'] } },
      ...overrides,
    },
  };
}

const cartParams: CreateCheckoutSessionParams = {
  draftOrderId: 'draft-1',
  returnUrl: 'https://example.com/cart',
  successUrl: 'https://example.com/success',
};

const buyNowParams: CreateCheckoutSessionParams = {
  skuId: 'sku-1',
  returnUrl: 'https://example.com/product/sku-1',
  successUrl: 'https://example.com/success',
};

describe('createCheckoutSession', function checkout() {
  beforeEach(function reset() {
    vi.clearAllMocks();
    delete process.env.GODADDY_STORE_ID;
    delete process.env.GODADDY_CHANNEL_ID;
    delete process.env.GODADDY_API_BASE_URL;
    mockCheckoutConfiguration.storeId = undefined;
    mockCheckoutConfiguration.channelId = undefined;
    mockCheckoutConfiguration.currencyCode = undefined;
    mockCheckoutConfiguration.enablePromotionCodes = false;
    mockCheckoutConfiguration.enableTaxCollection = false;
    mockCheckoutConfiguration.enableShipping = false;
    mockCheckoutConfiguration.shipping = undefined;
    mockReadCommerceConfig.mockReturnValue({
      clientId: 'client-1',
      clientSecret: 'secret-1',
      storeId: 'store-1',
      channelId: 'channel-1',
      apiBaseUrl: 'https://api.godaddy.com',
      currencyCode: 'USD',
    });
    mockGetOAuthAccessToken.mockResolvedValue({
      access_token: 'access-token',
      scope: 'commerce.product:read',
      expires_in: 3600,
    });
  });

  afterEach(function cleanup() {
    vi.useRealTimers();
    delete process.env.GODADDY_STORE_ID;
    delete process.env.GODADDY_CHANNEL_ID;
    delete process.env.GODADDY_API_BASE_URL;
  });

  it('returns the checkout attribution after verifying the configured binding', async function verify() {
    mockGqlRequest.mockResolvedValue(response());

    await expect(createCheckoutSession(checkoutParams)).resolves.toEqual({
      url: 'https://checkout.commerce.godaddy.com/c/session-1',
      id: 'session-1',
      draftOrderId: null,
      storeId: 'store-1',
      channelId: 'channel-1',
      businessId: 'business-1',
      storeName: 'Future Makers Camp',
      sourceApp: 'airo.ai.builder',
    });
    expect(mockGetOAuthAccessToken).toHaveBeenCalledWith({
      clientId: 'client-1',
      clientSecret: 'secret-1',
      apiBaseUrl: 'https://api.godaddy.com',
      scope: 'commerce.product:read',
    });
  });

  it('rejects a checkout session attributed to another store', async function reject() {
    mockGqlRequest.mockResolvedValue(response({ storeId: 'other-store' }));

    await expect(createCheckoutSession(checkoutParams)).rejects.toThrow(
      'Checkout session binding mismatch: expected store store-1 and channel channel-1, received store other-store and channel channel-1',
    );
  });

  it('rejects a checkout session attributed to another channel', async function reject() {
    mockGqlRequest.mockResolvedValue(response({ channelId: 'other-channel' }));

    await expect(createCheckoutSession(checkoutParams)).rejects.toThrow(
      'Checkout session binding mismatch: expected store store-1 and channel channel-1, received store store-1 and channel other-channel',
    );
  });

  it.each([
    ['non-catalog', checkoutParams],
    ['cart', cartParams],
    ['buy-now', buyNowParams],
  ] as const)(
    'sends a default paymentMethods.card override for %s checkout',
    async function defaultsPaymentMethods(_flow, params) {
      mockGqlRequest.mockResolvedValue(response());

      await createCheckoutSession(params);

      expect(mockGqlRequest.mock.calls[0]?.[0].variables.input).toMatchObject({
        paymentMethods: { card: { processor: 'godaddy', checkoutTypes: ['standard'] } },
      });
    },
  );

  it.each([
    ['non-catalog', checkoutParams],
    ['cart', cartParams],
    ['buy-now', buyNowParams],
  ] as const)(
    'rejects a %s checkout session that persisted no payment methods',
    async function rejectsMissingPaymentMethods(_flow, params) {
      mockGqlRequest.mockResolvedValue(response({ paymentMethods: null }));

      await expect(createCheckoutSession(params)).rejects.toThrow(
        'Checkout session did not configure payment methods.',
      );
    },
  );

  it('applies and verifies configured promotion codes, tax, and shipping for catalog checkout', async function configured() {
    mockCheckoutConfiguration.enablePromotionCodes = true;
    mockCheckoutConfiguration.enableTaxCollection = true;
    mockCheckoutConfiguration.enableShipping = true;
    mockCheckoutConfiguration.shipping = {
      originAddressConfigured: true,
      originAddressContractVersion: 1,
    };
    mockGqlRequest.mockResolvedValue(
      response({
        enablePromotionCodes: true,
        enableTaxCollection: true,
        enableShipping: true,
        enableShippingAddressCollection: true,
      }),
    );

    await createCheckoutSession({
      draftOrderId: 'draft-1',
      returnUrl: 'https://example.com/cart',
      successUrl: 'https://example.com/success',
    });

    expect(mockGqlRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: expect.objectContaining({
            enablePromotionCodes: true,
            enableTaxCollection: true,
            enableShipping: true,
            enableShippingAddressCollection: true,
          }),
        },
      }),
    );
    expect(mockGqlRequest.mock.calls[0]?.[0].variables.input).not.toHaveProperty('originAddress');
    expect(mockGqlRequest.mock.calls[0]?.[0].variables.input).not.toHaveProperty('shipping');
    expect(mockGqlRequest.mock.calls[0]?.[0].variables.input).not.toHaveProperty(
      'resolveShippingOriginFromStore',
    );
  });

  it('rejects a catalog checkout session that omits configured promotion codes', async function configured() {
    mockCheckoutConfiguration.enablePromotionCodes = true;
    mockGqlRequest.mockResolvedValue(response({ enablePromotionCodes: false }));

    await expect(
      createCheckoutSession({
        draftOrderId: 'draft-1',
        returnUrl: 'https://example.com/cart',
        successUrl: 'https://example.com/success',
      }),
    ).rejects.toThrow('Checkout session did not enable configured promotion codes');
  });

  it('defaults promotion codes off for a legacy checkout configuration', async function legacy() {
    delete (mockCheckoutConfiguration as { enablePromotionCodes?: boolean }).enablePromotionCodes;
    mockGqlRequest.mockResolvedValue(response({ enablePromotionCodes: false }));

    await createCheckoutSession({
      draftOrderId: 'draft-1',
      returnUrl: 'https://example.com/cart',
      successUrl: 'https://example.com/success',
    });

    expect(mockGqlRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { input: expect.objectContaining({ enablePromotionCodes: false }) },
      }),
    );
  });

  it('does not apply promotion codes to non-catalog checkout', async function nonCatalog() {
    mockCheckoutConfiguration.enablePromotionCodes = true;
    mockGqlRequest.mockResolvedValue(response({ enablePromotionCodes: false }));

    await createCheckoutSession(checkoutParams);

    expect(mockGqlRequest.mock.calls[0]?.[0].variables.input).not.toHaveProperty('enablePromotionCodes');
    expect(mockGqlRequest.mock.calls[0]?.[0].variables.input).not.toHaveProperty(
      'resolveShippingOriginFromStore',
    );
  });

  it('leaves shipping-origin resolution to Checkout for buy-now checkout', async function configured() {
    mockCheckoutConfiguration.enableShipping = true;
    mockCheckoutConfiguration.shipping = {
      originAddressConfigured: true,
      originAddressContractVersion: 1,
    };
    mockGqlRequest.mockResolvedValue(
      response({
        enableShipping: true,
        enableShippingAddressCollection: true,
      }),
    );

    await createCheckoutSession({
      skuId: 'sku-1',
      returnUrl: 'https://example.com/product/sku-1',
      successUrl: 'https://example.com/success',
    });

    expect(mockGqlRequest.mock.calls[0]?.[0].variables.input).not.toHaveProperty('shipping');
    expect(mockGqlRequest.mock.calls[0]?.[0].variables.input).not.toHaveProperty(
      'resolveShippingOriginFromStore',
    );
    expect(mockGetOAuthAccessToken).toHaveBeenCalledWith({
      clientId: 'client-1',
      clientSecret: 'secret-1',
      apiBaseUrl: 'https://api.godaddy.com',
      scope: 'commerce.product:read',
    });
  });

  it('uses a valid legacy origin explicitly without requesting Store read scope', async function legacy() {
    mockCheckoutConfiguration.enableShipping = true;
    mockCheckoutConfiguration.shipping = {
      originAddress: {
        addressLine1: ' 123 Main St ',
        adminArea1: ' AZ ',
        adminArea2: ' Tempe ',
        postalCode: ' 85281 ',
        countryCode: 'us',
      },
    };
    mockGqlRequest.mockResolvedValue(
      response({ enableShipping: true, enableShippingAddressCollection: true }),
    );

    await createCheckoutSession({
      skuId: 'sku-1',
      returnUrl: 'https://example.com/product/sku-1',
      successUrl: 'https://example.com/success',
    });

    expect(mockGqlRequest.mock.calls[0]?.[0].variables.input).toMatchObject({
      shipping: {
        originAddress: {
          addressLine1: '123 Main St',
          adminArea1: 'AZ',
          adminArea2: 'Tempe',
          postalCode: '85281',
          countryCode: 'US',
        },
      },
    });
    expect(mockGqlRequest.mock.calls[0]?.[0].variables.input).not.toHaveProperty(
      'resolveShippingOriginFromStore',
    );
    expect(mockGetOAuthAccessToken).toHaveBeenCalledWith(
      expect.objectContaining({ scope: 'commerce.product:read' }),
    );
  });

  it.each([
    ['an unknown readiness version', { originAddressConfigured: true }],
    [
      'an incomplete legacy origin',
      { originAddress: { adminArea1: 'AZ', postalCode: '85281', countryCode: 'US' } },
    ],
  ] as const)('rejects shipping with %s', async function reject(_case, shipping) {
    mockCheckoutConfiguration.enableShipping = true;
    mockCheckoutConfiguration.shipping = shipping as typeof mockCheckoutConfiguration.shipping;

    await expect(
      createCheckoutSession({
        skuId: 'sku-1',
        returnUrl: 'https://example.com/product/sku-1',
        successUrl: 'https://example.com/success',
      }),
    ).rejects.toThrow('Commerce shipping origin is not configured');
    expect(mockGetOAuthAccessToken).not.toHaveBeenCalled();
  });

  it('rejects shipping before checkout when readiness is missing', async function reject() {
    mockCheckoutConfiguration.enableShipping = true;

    await expect(
      createCheckoutSession({
        skuId: 'sku-1',
        returnUrl: 'https://example.com/product/sku-1',
        successUrl: 'https://example.com/success',
      }),
    ).rejects.toThrow('Commerce shipping origin is not configured');

    expect(mockGetOAuthAccessToken).not.toHaveBeenCalled();
    expect(mockGqlRequest).not.toHaveBeenCalled();
  });

  it('does not expose a checkout error that may reflect the shipping origin', async function redact() {
    mockCheckoutConfiguration.enableShipping = true;
    mockCheckoutConfiguration.shipping = {
      originAddressConfigured: true,
      originAddressContractVersion: 1,
    };
    const checkoutError = new Error('Invalid origin address: 123 Example Street');
    mockGqlRequest.mockRejectedValue(checkoutError);

    const error = await createCheckoutSession({
      skuId: 'sku-1',
      returnUrl: 'https://example.com/product/sku-1',
      successUrl: 'https://example.com/success',
    }).catch((caught: unknown): unknown => caught);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe('Commerce checkout session could not be created');
    expect((error as Error).message).not.toContain('123 Example Street');
    expect((error as Error).cause).toBe(checkoutError);
  });

  it('rejects a session that omits configured tax collection', async function configured() {
    mockCheckoutConfiguration.enableTaxCollection = true;
    mockCheckoutConfiguration.enableShipping = false;
    mockGqlRequest.mockResolvedValue(response({ enableTaxCollection: false }));

    await expect(createCheckoutSession(checkoutParams)).rejects.toThrow(
      'Checkout session did not enable configured tax collection',
    );
  });

  it.each([
    ['shipping', { enableShipping: false, enableShippingAddressCollection: true }],
    ['shipping address collection', { enableShipping: true, enableShippingAddressCollection: false }],
  ] as const)(
    'rejects a catalog checkout session that omits configured %s',
    async function reject(_case, sessionOptions) {
      mockCheckoutConfiguration.enableTaxCollection = false;
      mockCheckoutConfiguration.enableShipping = true;
      mockCheckoutConfiguration.shipping = {
        originAddressConfigured: true,
        originAddressContractVersion: 1,
      };
      mockGqlRequest.mockResolvedValue(response(sessionOptions));

      await expect(
        createCheckoutSession({
          draftOrderId: 'draft-1',
          returnUrl: 'https://example.com/cart',
          successUrl: 'https://example.com/success',
        }),
      ).rejects.toThrow('Checkout session did not enable configured shipping and address collection');
    },
  );

  it('retries until Commerce binding fields are present before creating checkout', async function retry() {
    vi.useFakeTimers();
    mockGqlRequest.mockResolvedValue(response());
    mockCheckoutConfiguration.storeId = 'store-1';
    mockCheckoutConfiguration.channelId = 'channel-1';
    let configReads = 0;
    mockReadCommerceConfig.mockImplementation(() => {
      configReads += 1;
      if (configReads <= 3) {
        throw new Error('Commerce config: GODADDY_STORE_ID is missing');
      }
      return {
        clientId: 'client-1',
        clientSecret: 'secret-1',
        storeId: 'store-1',
        channelId: 'channel-1',
        apiBaseUrl: 'https://api.godaddy.com',
        currencyCode: 'USD',
      };
    });

    const promise = createCheckoutSession(checkoutParams);

    expect(mockGqlRequest).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(6000);

    await expect(promise).resolves.toMatchObject({
      url: 'https://checkout.commerce.godaddy.com/c/session-1',
    });
    expect(configReads).toBe(5);
    expect(mockGqlRequest).toHaveBeenCalledTimes(1);
  });

  it('throws a pending error when Commerce binding fields never arrive', async function pending() {
    vi.useFakeTimers();
    mockCheckoutConfiguration.storeId = 'store-1';
    mockCheckoutConfiguration.channelId = 'channel-1';
    mockReadCommerceConfig.mockImplementation(() => {
      throw new Error('Commerce config: GODADDY_STORE_ID is missing');
    });

    const promise = createCheckoutSession(checkoutParams);
    const assertion = expect(promise).rejects.toBeInstanceOf(CommerceConfigPendingError);
    await vi.advanceTimersByTimeAsync(8000);

    await assertion;
    expect(mockGqlRequest).not.toHaveBeenCalled();
  });

  it('does not retry missing OAuth config when Commerce binding fields are present', async function oauth() {
    mockReadCommerceConfig.mockImplementation(() => {
      throw new Error('Commerce config: GODADDY_OAUTH_CLIENT_ID is missing');
    });

    await expect(createCheckoutSession(checkoutParams)).rejects.toThrow(
      'Commerce config: GODADDY_OAUTH_CLIENT_ID is missing',
    );
    expect(mockReadCommerceConfig).toHaveBeenCalledTimes(1);
    expect(mockGqlRequest).not.toHaveBeenCalled();
  });

  it('retries stale resolved binding until the generated expected binding is active', async function stale() {
    vi.useFakeTimers();
    mockCheckoutConfiguration.storeId = 'new-store';
    mockCheckoutConfiguration.channelId = 'new-channel';
    mockCheckoutConfiguration.currencyCode = 'GBP';
    mockGqlRequest.mockResolvedValue(response({ storeId: 'new-store', channelId: 'new-channel' }));
    let configReads = 0;
    mockReadCommerceConfig.mockImplementation(() => {
      configReads += 1;
      return {
        clientId: 'client-1',
        clientSecret: 'secret-1',
        storeId: configReads <= 3 ? 'old-store' : 'new-store',
        channelId: configReads <= 3 ? 'old-channel' : 'new-channel',
        apiBaseUrl: 'https://api.godaddy.com',
        currencyCode: configReads <= 3 ? 'USD' : 'GBP',
      };
    });

    const promise = createCheckoutSession(checkoutParams);

    expect(mockGqlRequest).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(6000);

    await expect(promise).resolves.toMatchObject({
      storeId: 'new-store',
      channelId: 'new-channel',
    });
    expect(configReads).toBe(5);
  });

  it('does not block env-only runtimes when readCommerceConfig resolves the binding', async function envOnly() {
    mockCheckoutConfiguration.storeId = 'env-store';
    mockCheckoutConfiguration.channelId = 'env-channel';
    mockCheckoutConfiguration.currencyCode = 'USD';
    mockReadCommerceConfig.mockReturnValue({
      clientId: 'client-1',
      clientSecret: 'secret-1',
      storeId: 'env-store',
      channelId: 'env-channel',
      apiBaseUrl: 'https://api.godaddy.com',
      currencyCode: 'USD',
    });
    mockGqlRequest.mockResolvedValue(response({ storeId: 'env-store', channelId: 'env-channel' }));

    await expect(createCheckoutSession(checkoutParams)).resolves.toMatchObject({
      storeId: 'env-store',
      channelId: 'env-channel',
    });
    expect(mockGqlRequest).toHaveBeenCalledTimes(1);
  });
});
