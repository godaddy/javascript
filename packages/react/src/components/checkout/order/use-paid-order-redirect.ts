import { useEffect } from 'react';
import {
  redirectToSuccessUrl,
  useCheckoutContext,
} from '@/components/checkout/checkout';
import type { DraftOrder } from '@/types';
import {
  isCheckoutComplete,
  useCheckoutOrderStatus,
} from './use-checkout-order-status';

// draftOrder is null once an order is paid or awaiting offline payment, so a
// missing draft order is the only time completion needs to be looked up.
export function usePaidOrderRedirect({
  order,
  isDraftOrderLoading,
}: {
  order: DraftOrder | null | undefined;
  isDraftOrderLoading: boolean;
}) {
  const { session, isConfirmingCheckout } = useCheckoutContext();
  const needsOrderStatus = !isDraftOrderLoading && !order;
  const orderStatusQuery = useCheckoutOrderStatus({
    enabled: needsOrderStatus,
  });
  const { isFetching, isPending, isError } = orderStatusQuery;

  const showPaidOrder =
    isCheckoutComplete(orderStatusQuery.data) && !isConfirmingCheckout;

  useEffect(() => {
    if (showPaidOrder) redirectToSuccessUrl(session?.successUrl);
  }, [showPaidOrder, session?.successUrl]);

  return {
    showPaidOrder,
    // Loading until the lookup started when the draft order went missing
    // settles, so the missing-order fallback can't act on an older cached
    // status (useCheckoutOrderStatus treats every cached status as stale). A
    // failed lookup (an API without orderStatus) settles it.
    isLoadingOrderStatus:
      needsOrderStatus && (isFetching || (isPending && !isError)),
  };
}
