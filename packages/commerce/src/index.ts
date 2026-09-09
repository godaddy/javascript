import { CommerceClient } from './client';
import { type CommerceConfig, CommerceError } from './types';

export { itemCount } from './cart';
export { CommerceClient } from './client';
export * from './types';

let defaultClient: CommerceClient | undefined;
const configuredListeners = new Set<() => void>();

export function createCommerce(config: CommerceConfig): CommerceClient {
  return new CommerceClient(config);
}

/** Configure once in the browser. Use createCommerce for isolated/server instances. */
export function configureCommerce(config: CommerceConfig): CommerceClient {
  if (typeof window === 'undefined')
    throw new CommerceError(
      'BROWSER_ONLY',
      'Use createCommerce for server-side instances'
    );
  if (defaultClient)
    throw new CommerceError(
      'ALREADY_CONFIGURED',
      'Commerce is already configured; reuse the existing client'
    );
  defaultClient = createCommerce(config);
  for (const listener of configuredListeners) listener();
  return defaultClient;
}

export function getCommerce(): CommerceClient {
  if (!defaultClient)
    throw new CommerceError(
      'NOT_CONFIGURED',
      'Call configureCommerce before using Commerce components'
    );
  return defaultClient;
}

export function onCommerceConfigured(listener: () => void): () => void {
  configuredListeners.add(listener);
  return () => configuredListeners.delete(listener);
}
