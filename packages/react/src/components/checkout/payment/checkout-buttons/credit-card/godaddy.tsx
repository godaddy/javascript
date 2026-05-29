import { useCallback, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { usePoyntCollect } from '@/components/checkout/payment/utils/poynt-provider';
import { useBuildPaymentRequest } from '@/components/checkout/payment/utils/use-build-payment-request';
import { useFlushCheckoutSync } from '@/components/checkout/payment/utils/use-flush-checkout-sync';
import { useIsPaymentDisabled } from '@/components/checkout/payment/utils/use-is-payment-disabled';
import { Button } from '@/components/ui/button';
import { useGoDaddyContext } from '@/godaddy-provider';

export function CreditCardCheckoutButton() {
  const { collect, isLoadingNonce, setIsLoadingNonce } = usePoyntCollect();
  const { isConfirmingCheckout, setCheckoutErrors } = useCheckoutContext();
  const isPaymentDisabled = useIsPaymentDisabled();
  const form = useFormContext();
  const { poyntCardRequest } = useBuildPaymentRequest();
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

    try {
      await flushCheckoutSync();

      setCheckoutErrors(undefined);
      setIsLoadingNonce(true);
      collect.getNonce(poyntCardRequest);
    } catch (_error) {
      setIsLoadingNonce(false);
      setCheckoutErrors(['TRANSACTION_PROCESSING_FAILED']);
    }
  }, [
    collect,
    flushCheckoutSync,
    form,
    isDisabled,
    poyntCardRequest,
    setCheckoutErrors,
    setIsLoadingNonce,
  ]);

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
      {isLoadingNonce ? t.payment.processingPayment : t.payment.payNow}
    </Button>
  );
}
