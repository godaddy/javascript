import { useCallback, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { usePoyntACHCollect } from '@/components/checkout/payment/utils/poynt-ach-provider';
import { useFlushCheckoutSync } from '@/components/checkout/payment/utils/use-flush-checkout-sync';
import { useIsPaymentDisabled } from '@/components/checkout/payment/utils/use-is-payment-disabled';
import { Button } from '@/components/ui/button';
import { useGoDaddyContext } from '@/godaddy-provider';

export function ACHCheckoutButton() {
  const { collect, isLoadingNonce, setIsLoadingNonce } = usePoyntACHCollect();
  const { isConfirmingCheckout } = useCheckoutContext();
  const isPaymentDisabled = useIsPaymentDisabled();
  const form = useFormContext();
  const flushCheckoutSync = useFlushCheckoutSync();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { t } = useGoDaddyContext();

  const isDisabled =
    isLoadingNonce || isConfirmingCheckout || isPaymentDisabled;

  const handleSubmit = useCallback(async () => {
    if (isDisabled || !collect) return;

    const valid = await form.trigger();
    if (!valid) {
      const firstError = Object.keys(form.formState.errors)[0];
      if (firstError) {
        form.setFocus(firstError);
      }
      return;
    }

    await flushCheckoutSync();

    setIsLoadingNonce(true);
    collect.getNonce({});
  }, [collect, flushCheckoutSync, form, isDisabled, setIsLoadingNonce]);

  if (!collect) return null;

  return (
    <Button
      className='w-full'
      size='lg'
      type='button'
      onClick={handleSubmit}
      ref={buttonRef}
      disabled={isDisabled}
    >
      {t.payment.payNow}
    </Button>
  );
}
