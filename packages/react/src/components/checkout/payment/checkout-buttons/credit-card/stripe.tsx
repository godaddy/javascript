'use client';

import { useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { isCheckoutConfirmationBlockedError } from '@/components/checkout/payment/utils/use-confirm-checkout';
import { useFlushCheckoutSync } from '@/components/checkout/payment/utils/use-flush-checkout-sync';
import { useIsPaymentDisabled } from '@/components/checkout/payment/utils/use-is-payment-disabled';
import { useStripeCheckout } from '@/components/checkout/payment/utils/use-stripe-checkout';
import { Button } from '@/components/ui/button';
import { useGoDaddyContext } from '@/godaddy-provider';

export function StripeCreditCardCheckoutButton() {
  const { t } = useGoDaddyContext();
  const form = useFormContext();
  const { isConfirmingCheckout } = useCheckoutContext();
  const isPaymentDisabled = useIsPaymentDisabled();
  const flushCheckoutSync = useFlushCheckoutSync();
  const isSubmittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { handleSubmit, isProcessingPayment } = useStripeCheckout({
    mode: 'card',
  });

  const handleStripeCheckout = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const valid = await form.trigger();

      if (!valid) {
        const firstError = Object.keys(form.formState.errors)[0];
        if (firstError) {
          form.setFocus(firstError);
        }
      } else {
        const { latestOrder } = await flushCheckoutSync({
          includeCurrentFormDiff: true,
        });
        await handleSubmit(undefined, latestOrder);
      }
    } catch (error) {
      if (!isCheckoutConfirmationBlockedError(error)) throw error;
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <Button
      className='w-full'
      size='lg'
      disabled={
        isSubmitting ||
        isProcessingPayment ||
        isConfirmingCheckout ||
        isPaymentDisabled
      }
      onClick={handleStripeCheckout}
    >
      {t.payment.payNow}
    </Button>
  );
}
