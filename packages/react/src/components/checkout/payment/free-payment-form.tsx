import { LoaderCircle } from 'lucide-react';
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useCheckoutContext } from '@/components/checkout/checkout';
import {
  PaymentProvider,
  useConfirmCheckout,
} from '@/components/checkout/payment/utils/use-confirm-checkout';
import { useIsPaymentDisabled } from '@/components/checkout/payment/utils/use-is-payment-disabled';
import { Button } from '@/components/ui/button';
import { useGoDaddyContext } from '@/godaddy-provider';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';
import { cn } from '@/lib/utils';
import { PaymentMethodType } from '@/types';

export function FreePaymentForm() {
  const { t } = useGoDaddyContext();
  const { setCheckoutErrors, isConfirmingCheckout } = useCheckoutContext();
  const isPaymentDisabled = useIsPaymentDisabled();
  const form = useFormContext();
  const confirmCheckout = useConfirmCheckout();

  const handleSubmit = React.useCallback(async () => {
    const valid = await form.trigger();
    if (!valid) {
      const firstError = Object.keys(form.formState.errors)[0];
      if (firstError) {
        form.setFocus(firstError);
      }
      return;
    }

    try {
      await confirmCheckout.mutateAsync({
        paymentToken: '',
        paymentType: PaymentMethodType.OFFLINE,
        paymentProvider: PaymentProvider.OFFLINE,
      });
    } catch (err: unknown) {
      if (err instanceof GraphQLErrorWithCodes) {
        setCheckoutErrors(err.codes);
      }
    }
  }, [form, confirmCheckout.mutateAsync, setCheckoutErrors]);

  return isConfirmingCheckout ? (
    <Button
      type='button'
      className='w-full flex items-center justify-center gap-2 px-8 h-10'
      disabled
    >
      <LoaderCircle className='h-5 w-5 animate-spin' />
      {t.payment.completingOrder}
    </Button>
  ) : (
    <Button
      className={cn('w-full')}
      size='lg'
      type='submit'
      onClick={handleSubmit}
      disabled={isPaymentDisabled || isConfirmingCheckout}
    >
      <span>{t.payment.freePayment}</span>
    </Button>
  );
}
