import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useClearBillingAddressDetails } from '@/components/checkout/address/utils/use-clear-billing-address';
import type { CheckoutFormData } from '@/components/checkout/checkout';
import { useBillingPolicy } from '@/components/checkout/payment/utils/use-billing-policy';

export function BillingPolicyTransitionController(): null {
  const form = useFormContext<CheckoutFormData>();
  const policy = useBillingPolicy();
  const deliveryMethod = form.watch('deliveryMethod');
  const paymentMethod = form.watch('paymentMethod');
  const clearBillingAddressDetails = useClearBillingAddressDetails();
  const previousStateRef = React.useRef({
    mode: policy.mode,
    paymentMethod,
  });
  const hydratedRef = React.useRef(false);

  React.useEffect(() => {
    if (!deliveryMethod) return;

    const previousState = previousStateRef.current;
    previousStateRef.current = {
      mode: policy.mode,
      paymentMethod,
    };

    if (!hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }

    if (
      previousState.mode === 'address' &&
      policy.mode === 'names' &&
      (Boolean(previousState.paymentMethod) ||
        form.getFieldState('paymentMethod').isDirty ||
        form.getFieldState('deliveryMethod').isDirty)
    ) {
      clearBillingAddressDetails();
    }
  }, [
    clearBillingAddressDetails,
    deliveryMethod,
    form,
    paymentMethod,
    policy.mode,
  ]);

  return null;
}
