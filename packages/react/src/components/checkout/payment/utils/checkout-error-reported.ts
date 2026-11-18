/**
 * Thrown after the thrower has already set the checkout error codes to show
 * (for example MISSING_SHIPPING_INFO), so callers must not replace them.
 */
export class CheckoutErrorAlreadyReported extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CheckoutErrorAlreadyReported';
  }
}

export function isCheckoutErrorAlreadyReported(
  error: unknown
): error is CheckoutErrorAlreadyReported {
  return error instanceof CheckoutErrorAlreadyReported;
}
