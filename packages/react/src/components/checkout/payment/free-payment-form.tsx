import { LoaderCircle } from 'lucide-react';
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { DeliveryMethods } from '@/components/checkout/delivery/delivery-method';
import {
  PaymentProvider,
  useConfirmCheckout,
} from '@/components/checkout/payment/utils/use-confirm-checkout';
import { useIsPaymentDisabled } from '@/components/checkout/payment/utils/use-is-payment-disabled';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
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

  const deliveryMethod = form.watch('deliveryMethod');
  const isPickup = deliveryMethod === DeliveryMethods.PICKUP;

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

  const submitButton = isConfirmingCheckout ? (
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

  // For pickup orders, show name fields
  if (isPickup) {
    return (
      <div className='space-y-4'>
        <div className='grid grid-cols-2 gap-4'>
          <FormField
            control={form.control}
            name='billingFirstName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.shipping.firstName}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t.shipping.firstName}
                    {...field}
                    disabled={isConfirmingCheckout}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='billingLastName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.shipping.lastName}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t.shipping.lastName}
                    {...field}
                    disabled={isConfirmingCheckout}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {submitButton}
      </div>
    );
  }

  return submitButton;
}
