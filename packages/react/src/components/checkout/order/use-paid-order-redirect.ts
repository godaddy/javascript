import { useEffect } from 'react';
import {
  redirectToSuccessUrl,
  useCheckoutContext,
} from '@/components/checkout/checkout';
import type { DraftOrder } from '@/types';

export function usePaidOrderRedirect(order: DraftOrder | null | undefined) {
  const { session, isConfirmingCheckout } = useCheckoutContext();
  const isPaid =
    order?.statuses?.paymentStatus?.trim().toUpperCase() === 'PAID';
  const showPaidOrder = isPaid && !isConfirmingCheckout;

  useEffect(() => {
    if (showPaidOrder) redirectToSuccessUrl(session?.successUrl);
  }, [showPaidOrder, session?.successUrl]);

  return showPaidOrder;
}
