/** Browser-compatible Commerce API primitives, without loading component styles. */

export type { CreateCheckoutSessionInputWithKebabCase } from './lib/godaddy/godaddy';
export {
  addCartLineItem,
  applyCartDiscountCodes,
  createCartOrder,
  createCheckoutSession,
  deleteCartLineItem,
  getCartOrder,
  getSku,
  updateCartLineItem,
} from './lib/godaddy/godaddy';
export type {
  AddCartOrderInput,
  CheckoutSession,
  CheckoutSessionInput,
} from './types';
