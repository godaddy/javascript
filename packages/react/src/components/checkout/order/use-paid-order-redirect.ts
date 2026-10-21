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
  const showPaidOrder =
    isCheckoutComplete(orderStatusQuery.data) && !isConfirmingCheckout;

  useEffect(() => {
    if (showPaidOrder) redirectToSuccessUrl(session?.successUrl);
  }, [showPaidOrder, session?.successUrl]);

  return {
    showPaidOrder,
    // Pending until the lookup settles, including the render that enables it.
    isLoadingOrderStatus: needsOrderStatus && orderStatusQuery.isPending,
  };
}
