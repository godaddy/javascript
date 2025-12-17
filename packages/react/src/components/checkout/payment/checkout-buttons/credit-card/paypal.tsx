'use client';

import { useCallback, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { usePayPalProvider } from '@/components/checkout/payment/utils/paypal-provider';
import { useIsPaymentDisabled } from '@/components/checkout/payment/utils/use-is-payment-disabled';
import { Button } from '@/components/ui/button';
import { useGoDaddyContext } from '@/godaddy-provider';

export function PayPalCreditCardCheckoutButton() {
  const { t } = useGoDaddyContext();
  const { isConfirmingCheckout } = useCheckoutContext();
  const isPaymentDisabled = useIsPaymentDisabled();
  const form = useFormContext();
  const { cardFieldsRef, isCardFieldsReady } = usePayPalProvider();
  const [_isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = useCallback(async () => {
    try {
      setIsProcessing(true);

      // Validate the form first
      const valid = await form.trigger();
      if (!valid) {
        const firstError = Object.keys(form.formState.errors)[0];
        if (firstError) {
          form.setFocus(firstError);
        }
        return;
      }

      // Check if PayPal card fields are ready
      if (!cardFieldsRef.current || !cardFieldsRef.current.isEligible()) {
        return;
      }

      // Submit the PayPal payment
      await cardFieldsRef.current.submit();
    } catch (_error) {
      // PayPal checkout failed
    } finally {
      setIsProcessing(false);
    }
  }, [form, cardFieldsRef]);

  if (!isCardFieldsReady || !cardFieldsRef.current) {
    return null;
  }

  return (
    <Button
      className='w-full'
      size='lg'
      type='button'
      onClick={handleSubmit}
      disabled={isConfirmingCheckout || isPaymentDisabled || !isCardFieldsReady}
    >
      {t.payment.payNow}
    </Button>
  );
}
