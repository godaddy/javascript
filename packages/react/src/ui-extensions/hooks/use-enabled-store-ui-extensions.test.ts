import { useQuery } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGoDaddyContext } from '@/godaddy-provider';
import { getEnabledStoreUiExtensions } from '@/lib/godaddy/godaddy';
import { useEnabledStoreUiExtensions } from './use-enabled-store-ui-extensions';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(options => options),
}));

vi.mock('@/godaddy-provider', () => ({
  useGoDaddyContext: vi.fn(),
}));

vi.mock('@/lib/godaddy/godaddy', () => ({
  getEnabledStoreUiExtensions: vi.fn(),
}));

const mockUseQuery = vi.mocked(useQuery);
const mockUseGoDaddyContext = vi.mocked(useGoDaddyContext);
const mockGetEnabledStoreUiExtensions = vi.mocked(getEnabledStoreUiExtensions);

describe('useEnabledStoreUiExtensions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGoDaddyContext.mockReturnValue({
      apiHost: 'api.ote-godaddy.com',
      storeId: 'context-store',
      t: {} as ReturnType<typeof useGoDaddyContext>['t'],
    });
  });

  it('uses the explicit storeId prop when provided', async () => {
    useEnabledStoreUiExtensions({
      target: 'storefront.product.details.after',
      storeId: 'store-prop',
    });

    const options = mockUseQuery.mock.calls[0]?.[0];

    expect(options).toMatchObject({
      queryKey: [
        'ui-extension-target',
        'api.ote-godaddy.com',
        'storefront.product.details.after',
        'store-prop',
      ],
      enabled: true,
    });

    await (options.queryFn as () => Promise<unknown>)();

    expect(mockGetEnabledStoreUiExtensions).toHaveBeenCalledWith(
      {
        storeId: 'store-prop',
        target: 'storefront.product.details.after',
      },
      'api.ote-godaddy.com'
    );
  });

  it('uses the storeId from GoDaddyProvider when no prop is provided', async () => {
    useEnabledStoreUiExtensions({ target: 'some.target' });

    const options = mockUseQuery.mock.calls[0]?.[0];

    expect(options.queryKey).toEqual([
      'ui-extension-target',
      'api.ote-godaddy.com',
      'some.target',
      'context-store',
    ]);

    await (options.queryFn as () => Promise<unknown>)();

    expect(mockGetEnabledStoreUiExtensions).toHaveBeenCalledWith(
      {
        storeId: 'context-store',
        target: 'some.target',
      },
      'api.ote-godaddy.com'
    );
  });

  it('is disabled when no storeId is available', () => {
    mockUseGoDaddyContext.mockReturnValue({
      apiHost: 'api.ote-godaddy.com',
      t: {} as ReturnType<typeof useGoDaddyContext>['t'],
    });

    useEnabledStoreUiExtensions({ target: 'some.target' });

    expect(mockUseQuery.mock.calls[0]?.[0]).toMatchObject({
      queryKey: [
        'ui-extension-target',
        'api.ote-godaddy.com',
        'some.target',
        '',
      ],
      enabled: false,
    });
  });

  it('does not include token or orderId in the query key', () => {
    useEnabledStoreUiExtensions({
      target: 'some.target',
      storeId: 'store-123',
    });

    expect(mockUseQuery.mock.calls[0]?.[0].queryKey).toEqual([
      'ui-extension-target',
      'api.ote-godaddy.com',
      'some.target',
      'store-123',
    ]);
  });
});
