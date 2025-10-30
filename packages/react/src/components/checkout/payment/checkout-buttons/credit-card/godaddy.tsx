import { useCallback, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { usePoyntCollect } from '@/components/checkout/payment/utils/poynt-provider';
import { useBuildPaymentRequest } from '@/components/checkout/payment/utils/use-build-payment-request';
import { useIsPaymentDisabled } from '@/components/checkout/payment/utils/use-is-payment-disabled';
import { Button } from '@/components/ui/button';
import { useGoDaddyContext } from '@/godaddy-provider';

export function CreditCardCheckoutButton() {
  const { collect, isLoadingNonce } = usePoyntCollect();
  const { isConfirmingCheckout } = useCheckoutContext();
  const isPaymentDisabled = useIsPaymentDisabled();
  const form = useFormContext();
  const { poyntCardRequest } = useBuildPaymentRequest();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { t } = useGoDaddyContext();

  const handleSubmit = useCallback(async () => {
    const valid = await form.trigger();
    if (!valid) {
      const firstError = Object.keys(form.formState.errors)[0];
      if (firstError) {
        form.setFocus(firstError);
      }
      return;
    }

    collect?.getNonce(poyntCardRequest);
  }, [poyntCardRequest, form, collect]);

  if (!collect) return null;

  return (
    <Button
      className='w-full'
      size='lg'
      type='button'
      onClick={handleSubmit}
      ref={buttonRef}
      disabled={isLoadingNonce || isConfirmingCheckout || isPaymentDisabled}
    >
      {t.payment.payNow}
    </Button>
  );
}
