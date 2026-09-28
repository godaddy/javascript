/** Exact host-owned checkout destinations. Only success URLs may add an orderId query parameter. */
export interface CheckoutReturnUrls {
  returnUrls: readonly string[];
  successUrls: readonly string[];
}

export type CheckoutReturnUrlValidator = (
  returnUrl: unknown,
  successUrl: unknown,
) => { returnUrl: string; successUrl: string } | null;

function parseDestination(value: unknown): URL | null {
  if (typeof value !== 'string' || /[\s\\]/.test(value)) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.hash) return null;
    return url;
  } catch {
    return null;
  }
}

function destinationKey(url: URL): string {
  const canonical = new URL(url);
  canonical.searchParams.sort();
  return canonical.href;
}

export function createCheckoutReturnUrlValidator(policy: CheckoutReturnUrls): CheckoutReturnUrlValidator {
  function allowedDestinations(values: readonly string[]): Set<string> {
    return new Set(
      values.map((value) => {
        const url = parseDestination(value);
        if (!url || url.searchParams.has('orderId')) {
          throw new Error(
            'Checkout return destinations must be absolute HTTPS URLs without credentials, fragments, or orderId.',
          );
        }
        return destinationKey(url);
      }),
    );
  }
  const returnUrls = allowedDestinations(policy.returnUrls);
  const successUrls = allowedDestinations(policy.successUrls);
  return (returnUrl, successUrl) => {
    const cancel = parseDestination(returnUrl);
    const success = parseDestination(successUrl);
    if (!cancel || !success || success.searchParams.getAll('orderId').length > 1) return null;
    const successDestination = new URL(success);
    successDestination.searchParams.delete('orderId');
    if (!returnUrls.has(destinationKey(cancel)) || !successUrls.has(destinationKey(successDestination)))
      return null;
    return { returnUrl: cancel.href, successUrl: success.href };
  };
}
