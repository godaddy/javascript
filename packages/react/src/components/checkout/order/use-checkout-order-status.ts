import { useQuery } from '@tanstack/react-query';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { checkoutQueryKeys } from '@/components/checkout/utils/query-keys';
import { useGoDaddyContext } from '@/godaddy-provider';
import { getCheckoutOrderStatus } from '@/lib/godaddy/godaddy';

type OrderStatus = {
  status?: string | null;
  paymentStatus?: string | null;
} | null;

// PAID is a captured payment; PENDING is an offline checkout awaiting collection.
// Either way the shopper has nothing left to pay, matching confirmCheckoutSession.
export function isCheckoutComplete(orderStatus: OrderStatus | undefined) {
  const status = orderStatus?.status?.trim().toUpperCase();
  const paymentStatus = orderStatus?.paymentStatus?.trim().toUpperCase();
  return (
    (paymentStatus === 'PAID' || paymentStatus === 'PENDING') &&
    status !== 'CANCELED'
  );
}

export function useCheckoutOrderStatus() {
  const { session, jwt } = useCheckoutContext();
  const { apiHost } = useGoDaddyContext();

  return useQuery({
    queryKey: checkoutQueryKeys.orderStatus(session?.id),
    queryFn: () =>
      jwt
        ? getCheckoutOrderStatus({ accessToken: jwt }, apiHost)
        : getCheckoutOrderStatus(session, apiHost),
    enabled: !!session?.id,
    staleTime: 5_000,
    select: data => data.checkoutSession?.orderStatus ?? null,
    // An API without orderStatus fails validation; retrying cannot help, and a
    // failed lookup only means checkout is not known to be complete.
    retry: false,
    refetchOnWindowFocus: 'always',
  });
}
