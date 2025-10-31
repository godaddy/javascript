/**
 * @deprecated This file is deprecated. Use the following instead:
 * 
 * For server-side operations:
 * - import { createCheckoutSession } from '@/lib/godaddy/godaddy.server'
 * 
 * For client-side operations:
 * - Use the `useCheckoutApi()` hook from '@/hooks/use-checkout-api'
 * - This hook automatically handles JWT authentication and fallback to legacy session auth
 * 
 * Direct imports from this file bypass the JWT authentication system.
 */

// Re-export server functions for backwards compatibility
export { createCheckoutSession } from './godaddy.server';

// Re-export client functions but mark as deprecated
/** @deprecated Use useCheckoutApi() hook instead */
export {
  getAddressMatches,
  getDraftOrder,
  getDraftOrderProducts as getProductsFromOrderSkus,
  getDraftOrderPriceAdjustments,
  getDraftOrderShippingRates as getDraftOrderShippingMethods,
  getDraftOrderTaxes,
  applyDiscount,
  applyShippingMethod,
  removeShippingMethod,
  confirmCheckout,
  updateDraftOrder,
  applyDeliveryMethod,
  applyFulfillmentLocation,
  verifyAddress,
} from './godaddy.client';

// Legacy function for backwards compatibility
/** @deprecated Use useCheckoutApi() hook with getDraftOrderTaxes instead */
export async function updateDraftOrderTaxes(
  session: any,
  destination?: any
) {
  const { getDraftOrderTaxes } = await import('./godaddy.client');
  return getDraftOrderTaxes(destination, { session });
}
