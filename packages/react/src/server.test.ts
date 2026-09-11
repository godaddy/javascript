import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCreateCheckoutSession = vi.fn();
const mockGetEnvVar = vi.fn((key: string) => {
  if (key === 'GODADDY_API_HOST') return 'api.godaddy.com';
  return '';
});

vi.mock('@/lib/godaddy/godaddy', () => ({
  createCheckoutSession: mockCreateCheckoutSession,
}));

vi.mock('@/lib/utils', () => ({
  getEnvVar: mockGetEnvVar,
}));

async function importModule() {
  const mod = await import('@/server');
  return mod;
}

function mockFetchSuccess(token = 'oauth-token', expiresIn = 3600) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          access_token: token,
          scope: 'commerce.product:read',
          expires_in: expiresIn,
        }),
    })
  );
}

function mockFetchFailure() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          access_token: undefined,
          scope: '',
          expires_in: 0,
        }),
    })
  );
}

describe('createCheckoutSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('personalAccessToken path — uses provided token directly and routes through API gateway', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { createCheckoutSession } = await importModule();

    mockCreateCheckoutSession.mockResolvedValue({ id: 'session-1' });

    await createCheckoutSession({ storeId: 'store-1' } as any, {
      auth: { personalAccessToken: 'my-pat-token' },
    });

    expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
      { storeId: 'store-1' },
      {
        accessToken: 'my-pat-token',
        apiHost: 'api.godaddy.com',
        endpoint: '/v2/commerce/stores/store-1/checkout-subgraph',
      }
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('clientId/clientSecret path — exchanges for token and uses direct host', async () => {
    mockFetchSuccess('oauth-token');
    const { createCheckoutSession } = await importModule();

    mockCreateCheckoutSession.mockResolvedValue({ id: 'session-1' });

    await createCheckoutSession({ storeId: 'store-1' } as any, {
      auth: { clientId: 'id', clientSecret: 'secret' },
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
      { storeId: 'store-1' },
      {
        accessToken: 'oauth-token',
        apiHost: 'api.godaddy.com',
        endpoint: undefined,
      }
    );
  });

  it('mutual exclusivity — throws when both provided', async () => {
    const { createCheckoutSession } = await importModule();

    await expect(
      createCheckoutSession({ storeId: 'store-1' } as any, {
        auth: {
          personalAccessToken: 'token',
          clientId: 'id',
          clientSecret: 'secret',
        } as any,
      })
    ).rejects.toThrow('mutually exclusive');
  });

  it('no auth — throws when token acquisition fails', async () => {
    mockFetchFailure();
    const { createCheckoutSession } = await importModule();

    await expect(
      createCheckoutSession({ storeId: 'store-1' } as any)
    ).rejects.toThrow('Failed to get access token');
  });

  it('personalAccessToken path — skips token caching', async () => {
    const { createCheckoutSession } = await importModule();

    mockCreateCheckoutSession.mockResolvedValue({ id: 'session-1' });

    await createCheckoutSession({ storeId: 'store-1' } as any, {
      auth: { personalAccessToken: 'token-1' },
    });

    await createCheckoutSession({ storeId: 'store-1' } as any, {
      auth: { personalAccessToken: 'token-2' },
    });

    expect(mockCreateCheckoutSession).toHaveBeenNthCalledWith(
      1,
      { storeId: 'store-1' },
      {
        accessToken: 'token-1',
        apiHost: 'api.godaddy.com',
        endpoint: '/v2/commerce/stores/store-1/checkout-subgraph',
      }
    );
    expect(mockCreateCheckoutSession).toHaveBeenNthCalledWith(
      2,
      { storeId: 'store-1' },
      {
        accessToken: 'token-2',
        apiHost: 'api.godaddy.com',
        endpoint: '/v2/commerce/stores/store-1/checkout-subgraph',
      }
    );
  });

  it('clientId/clientSecret path — caches token across calls', async () => {
    mockFetchSuccess('cached-token', 3600);
    const { createCheckoutSession } = await importModule();

    mockCreateCheckoutSession.mockResolvedValue({ id: 'session-1' });

    await createCheckoutSession({ storeId: 'store-1' } as any, {
      auth: { clientId: 'id', clientSecret: 'secret' },
    });

    await createCheckoutSession({ storeId: 'store-1' } as any, {
      auth: { clientId: 'id', clientSecret: 'secret' },
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(mockCreateCheckoutSession).toHaveBeenCalledTimes(2);
  });

  it('empty personalAccessToken — rejects instead of falling through to cached OAuth token', async () => {
    mockFetchSuccess('cached-token', 3600);
    const { createCheckoutSession } = await importModule();

    mockCreateCheckoutSession.mockResolvedValue({ id: 'session-1' });

    await createCheckoutSession({ storeId: 'store-1' } as any, {
      auth: { clientId: 'id', clientSecret: 'secret' },
    });

    await expect(
      createCheckoutSession({ storeId: 'store-1' } as any, {
        auth: { personalAccessToken: '' } as any,
      })
    ).rejects.toThrow('personalAccessToken must not be empty');
  });
});
