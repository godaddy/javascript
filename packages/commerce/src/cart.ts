import type { Cart } from './types';

/** Total quantity across every line in the cart. */
export function itemCount(cart: Cart | null | undefined): number {
  return (
    cart?.lineItems?.reduce((sum, line) => sum + (line.quantity || 0), 0) || 0
  );
}
