import { getEnabledStoreUiExtensions as requestEnabledStoreUiExtensions } from '@/lib/godaddy/godaddy';
import type { UiExtensionTargetId } from './types';

export interface GetEnabledStoreUiExtensionsInput {
  storeId: string;
  target: UiExtensionTargetId;
  /** The environment's API host, as `GoDaddyProvider` takes it. */
  apiHost?: string;
}

/**
 * Reads the UI extensions enabled for a target on a store, outside React. It
 * sends the same Checkout API query as `useEnabledStoreUiExtensions`, for a
 * host that has to know a target's extensions before it renders. Like the hook,
 * it sends nothing without a store id and a target; it then answers an empty
 * list.
 */
export function getEnabledStoreUiExtensions({
  storeId,
  target,
  apiHost,
}: GetEnabledStoreUiExtensionsInput): ReturnType<
  typeof requestEnabledStoreUiExtensions
> {
  if (!storeId || !target) {
    return Promise.resolve([]);
  }
  return requestEnabledStoreUiExtensions({ storeId, target }, apiHost);
}
