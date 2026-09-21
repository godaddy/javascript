import { CommerceError } from './types';

/**
 * Resolve a navigation URL and require HTTP(S).
 * Relative values resolve against `base`, normally the current page.
 */
export function navigationUrl(value: string, base?: string): string {
  let url: URL;
  try {
    url = new URL(value, base);
  } catch {
    throw new CommerceError(
      'INVALID_URL',
      `Checkout navigation URL is not valid: ${value}`
    );
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:')
    throw new CommerceError(
      'INVALID_URL',
      'Checkout navigation URLs must use HTTP or HTTPS'
    );
  return url.href;
}
