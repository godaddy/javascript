'use client';

import { useFormContext } from 'react-hook-form';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useIsPaymentDisabled } from '@/components/checkout/payment/utils/use-is-payment-disabled';
import { useStripeCheckout } from '@/components/checkout/payment/utils/use-stripe-checkout';
import { Button } from '@/components/ui/button';
import { useGoDaddyContext } from '@/godaddy-provider';

export function StripeCreditCardCheckoutButton() {
  const { t } = useGoDaddyContext();
  const form = useFormContext();
  const { isConfirmingCheckout } = useCheckoutContext();
  const isPaymentDisabled = useIsPaymentDisabled();
  const { handleSubmit } = useStripeCheckout({ mode: 'card' });

  const handleStripeCheckout = async () => {
    const valid = await form.trigger();

    if (!valid) {
      const firstError = Object.keys(form.formState.errors)[0];
      if (firstError) {
        form.setFocus(firstError);
      }
    } else {
      await handleSubmit();
    }
  };

  return (
    <Button
      className='w-full'
      size='lg'
      disabled={isConfirmingCheckout || isPaymentDisabled}
      onClick={handleStripeCheckout}
    >
      {t.payment.payNow}
    </Button>
  );
}
