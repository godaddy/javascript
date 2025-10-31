'use client';

import { useMemo } from 'react';
import { useCheckoutAuth } from '@/auth/checkout-auth-provider';
import type { CheckoutSession } from '@/types';
import * as API from '@/lib/godaddy/godaddy.client';

export function useCheckoutApi(propsSession?: CheckoutSession) {
  const { authState, session: authSession } = useCheckoutAuth();
  const session = authSession || propsSession;

  return useMemo(() => {
    const auth =
      authState.mode === 'jwt' && authState.jwt && authState.sessionId
        ? { jwt: authState.jwt, sessionId: authState.sessionId }
        : session
          ? { session }
          : null;

    if (!auth) {
      throw new Error('No authentication available');
    }

    return {
      getAddressMatches: (input: { query: string }) =>
        API.getAddressMatches(input, auth),

      getDraftOrder: () => API.getDraftOrder(auth),

      getDraftOrderProducts: () => API.getDraftOrderProducts(auth),

      getDraftOrderPriceAdjustments: (
        discountCodes?: string[],
        shippingLines?: any
      ) => API.getDraftOrderPriceAdjustments(discountCodes, shippingLines, auth),

      getDraftOrderShippingRates: (destination: any) =>
        API.getDraftOrderShippingRates(destination, auth),

      getDraftOrderTaxes: (destination: any) =>
        API.getDraftOrderTaxes(destination, auth),

      applyDiscount: (discountCodes: string[]) =>
        API.applyDiscount(discountCodes, auth),

      applyShippingMethod: (shippingMethods: any) =>
        API.applyShippingMethod(shippingMethods, auth),

      removeShippingMethod: (input: any) =>
        API.removeShippingMethod(input, auth),

      confirmCheckout: (input: any) => API.confirmCheckout(input, auth),

      updateDraftOrder: (input: any) => API.updateDraftOrder(input, auth),

      applyDeliveryMethod: (input: any) =>
        API.applyDeliveryMethod(input, auth),

      applyFulfillmentLocation: (input: any) =>
        API.applyFulfillmentLocation(input, auth),

      verifyAddress: (input: any) => API.verifyAddress(input, auth),
    };
  }, [authState, session]);
}
