import { useEffect } from 'react';
import {
  redirectToSuccessUrl,
  useCheckoutContext,
} from '@/components/checkout/checkout';
import {
  isCheckoutComplete,
  useCheckoutOrderStatus,
} from './use-checkout-order-status';

// draftOrder is null once an order is paid, so completion comes from orderStatus.
export function usePaidOrderRedirect() {
  const { session, isConfirmingCheckout } = useCheckoutContext();
  const { data: orderStatus, isLoading } = useCheckoutOrderStatus();
  const showPaidOrder =
    isCheckoutComplete(orderStatus) && !isConfirmingCheckout;

  useEffect(() => {
    if (showPaidOrder) redirectToSuccessUrl(session?.successUrl);
  }, [showPaidOrder, session?.successUrl]);

  return { showPaidOrder, isLoadingOrderStatus: isLoading };
}
