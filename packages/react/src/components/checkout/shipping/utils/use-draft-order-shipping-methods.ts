import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useDraftOrderShippingAddress } from '@/components/checkout/order/use-draft-order';
import { useGoDaddyContext } from '@/godaddy-provider';
import { getDraftOrderShippingMethods } from '@/lib/godaddy/godaddy';

/**
 * Hook to fetch available shipping methods for the draft order
 * @returns Query result with shipping rates data
 */
export function useDraftOrderShippingMethods() {
  const { session, jwt } = useCheckoutContext();
  const { apiHost } = useGoDaddyContext();
  const { data: shippingAddress } = useDraftOrderShippingAddress();

  const hasShippingAddress = useMemo(
    () => !!shippingAddress?.addressLine1,
    [shippingAddress?.addressLine1]
  );

  const destination = useMemo(() => {
    if (!shippingAddress?.postalCode || !shippingAddress?.countryCode) {
      return undefined;
    }
    return {
      postalCode: shippingAddress.postalCode,
      countryCode: shippingAddress.countryCode,
      addressLine1: shippingAddress.addressLine1 ?? undefined,
      addressLine2: shippingAddress.addressLine2 ?? undefined,
      addressLine3: shippingAddress.addressLine3 ?? undefined,
      adminArea1: shippingAddress.adminArea1 ?? undefined,
      adminArea2: shippingAddress.adminArea2 ?? undefined,
      adminArea3: shippingAddress.adminArea3 ?? undefined,
      adminArea4: shippingAddress.adminArea4 ?? undefined,
    };
  }, [
    shippingAddress?.postalCode,
    shippingAddress?.countryCode,
    shippingAddress?.addressLine1,
    shippingAddress?.addressLine2,
    shippingAddress?.addressLine3,
    shippingAddress?.adminArea1,
    shippingAddress?.adminArea2,
    shippingAddress?.adminArea3,
    shippingAddress?.adminArea4,
  ]);

  return useQuery({
    queryKey: session?.id
      ? [
          'draft-order-shipping-methods',
          session.id,
          shippingAddress?.addressLine1,
          shippingAddress?.adminArea1,
          shippingAddress?.adminArea2,
          shippingAddress?.postalCode,
          shippingAddress?.countryCode,
        ]
      : ['draft-order-shipping-methods'],
    queryFn: () =>
      jwt
        ? getDraftOrderShippingMethods(
            { accessToken: jwt },
            destination,
            apiHost
          )
        : getDraftOrderShippingMethods(session, destination, apiHost),
    enabled: !!session?.id && hasShippingAddress,
    select: data =>
      data?.checkoutSession?.draftOrder?.calculatedShippingRates?.rates,
  });
}
