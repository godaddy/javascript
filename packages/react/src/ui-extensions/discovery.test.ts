import { describe, expect, it, vi } from 'vitest';
import { getEnabledStoreUiExtensions as requestEnabledStoreUiExtensions } from '@/lib/godaddy/godaddy';
import { getEnabledStoreUiExtensions } from './discovery';

vi.mock('@/lib/godaddy/godaddy', () => ({
  getEnabledStoreUiExtensions: vi.fn().mockResolvedValue([{ id: 'app-1' }]),
}));

describe('getEnabledStoreUiExtensions', () => {
  it('sends the same discovery request as the hook, outside React', async () => {
    await expect(
      getEnabledStoreUiExtensions({
        storeId: 'store-1',
        target: 'some.target',
        apiHost: 'api.ote-godaddy.com',
      })
    ).resolves.toEqual([{ id: 'app-1' }]);

    expect(requestEnabledStoreUiExtensions).toHaveBeenCalledWith(
      { storeId: 'store-1', target: 'some.target' },
      'api.ote-godaddy.com'
    );
  });

  it('sends nothing without a store id or a target, like the hook', async () => {
    vi.mocked(requestEnabledStoreUiExtensions).mockClear();

    await expect(
      getEnabledStoreUiExtensions({ storeId: '', target: 'some.target' })
    ).resolves.toEqual([]);
    await expect(
      getEnabledStoreUiExtensions({ storeId: 'store-1', target: '' })
    ).resolves.toEqual([]);

    expect(requestEnabledStoreUiExtensions).not.toHaveBeenCalled();
  });
});
