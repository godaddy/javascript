// @vitest-environment node
import { expect, it } from 'vitest';
import { configureCommerce, createCommerce } from './index';

it('can import the elements and create isolated clients without browser globals', async () => {
  await expect(import('./elements')).resolves.toBeDefined();
  const config = { storeId: 'store', channelId: 'channel', clientId: 'client' };
  const first = createCommerce(config);
  const second = createCommerce(config);
  expect(first).not.toBe(second);
  expect(first.getServerSnapshot().cart).toBeNull();
  expect(() => configureCommerce(config)).toThrow('server-side instances');
});
