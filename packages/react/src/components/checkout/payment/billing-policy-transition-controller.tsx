import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useClearBillingAddressDetails } from '@/components/checkout/address/utils/use-clear-billing-address';
import {
  type CheckoutFormData,
  useCheckoutContext,
} from '@/components/checkout/checkout';
import { useDraftOrderTotals } from '@/components/checkout/order/use-draft-order';
import { BillingCollectionModes } from '@/components/checkout/payment/utils/billing-collection';
import { useBillingPolicy } from '@/components/checkout/payment/utils/use-billing-policy';

export function BillingPolicyTransitionController(): null {
  const form = useFormContext<CheckoutFormData>();
  const { session } = useCheckoutContext();
  const policy = useBillingPolicy();
  const { data: totals } = useDraftOrderTotals();
  const totalValue = totals?.total?.value ?? null;
  const deliveryMethod = form.watch('deliveryMethod');
  const paymentMethod = form.watch('paymentMethod');
  const clearBillingAddressDetails = useClearBillingAddressDetails();
  const previousStateRef = React.useRef({
    mode: policy.mode,
    paymentMethod,
    draftOrderId: session?.draftOrder?.id,
    totalValue,
  });
  const hydratedRef = React.useRef(false);

  React.useEffect(() => {
    if (!deliveryMethod || totals === undefined) return;

    const previousState = previousStateRef.current;
    previousStateRef.current = {
      mode: policy.mode,
      paymentMethod,
      draftOrderId: session?.draftOrder?.id,
      totalValue,
    };

    if (previousState.draftOrderId !== session?.draftOrder?.id) {
      hydratedRef.current = false;
    }

    if (!hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }

    if (
      previousState.mode === BillingCollectionModes.ADDRESS &&
      policy.mode === BillingCollectionModes.NAMES &&
      (Boolean(previousState.paymentMethod) ||
        form.getFieldState('paymentMethod').isDirty ||
        form.getFieldState('deliveryMethod').isDirty ||
        previousState.totalValue !== totalValue)
    ) {
      clearBillingAddressDetails();
    }
  }, [
    clearBillingAddressDetails,
    deliveryMethod,
    form,
    paymentMethod,
    policy.mode,
    session?.draftOrder?.id,
    totalValue,
    totals,
  ]);

  return null;
}
