import {
  PayPalButtons,
  PayPalScriptProvider,
  usePayPalScriptReducer,
} from '@paypal/react-paypal-js';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { DeliveryMethods } from '@/components/checkout/delivery/delivery-method';
import { useBuildPaymentRequest } from '@/components/checkout/payment/utils/use-build-payment-request';
import {
  PaymentProvider,
  useConfirmCheckout,
} from '@/components/checkout/payment/utils/use-confirm-checkout';
import { useIsPaymentDisabled } from '@/components/checkout/payment/utils/use-is-payment-disabled';
import { Skeleton } from '@/components/ui/skeleton';
import { useGoDaddyContext } from '@/godaddy-provider';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';

function PayPalButtonsWrapper() {
  const { setCheckoutErrors } = useCheckoutContext();
  const isPaymentDisabled = useIsPaymentDisabled();
  const form = useFormContext();
  const { payPalRequest } = useBuildPaymentRequest();
  const confirmCheckout = useConfirmCheckout();
  const [isPaypalDisabled, setIsPaypalDisabled] = useState<boolean>(false);
  const deliveryMethod = form.watch('deliveryMethod');
  const isPickup = deliveryMethod === DeliveryMethods.PICKUP;
  const [{ isResolved, isPending }] = usePayPalScriptReducer();

  // PayPal onClick handler that returns Promise<boolean>
  const handleClick = async (_data, actions) => {
    // if (isExpress) {
    // 	return actions.resolve();
    // }

    const valid = await form.trigger();

    // Focus on the first error field
    if (!valid) {
      const firstError = Object.keys(form.formState.errors)[0];
      if (firstError) {
        form.setFocus(firstError);
      }
      return actions.reject();
    }

    // Return true to continue flow, false to stop it
    return actions.resolve();
  };

  const createOrder = async (_data, actions) => {
    const order = {
      ...payPalRequest,
      purchase_units: payPalRequest.purchase_units
        ? [
            {
              ...payPalRequest.purchase_units[0],
              ...(isPickup ? { shipping: undefined } : {}), // Remove shipping if pickup
            },
          ]
        : undefined,
      application_context: {
        shipping_preference: isPickup ? 'NO_SHIPPING' : 'SET_PROVIDED_ADDRESS',
      },
    };
    return await actions.order.create(order);
  };

  const onApprove = async (_data, actions) => {
    setIsPaypalDisabled(true);

    try {
      const details = await actions.order.get();
      await confirmCheckout.mutateAsync({
        paymentToken: `${details.id}:${details.payer.payer_id}`,
        paymentType: 'paypal',
        paymentProvider: PaymentProvider.PAYPAL,
      });
    } catch (err: unknown) {
      if (err instanceof GraphQLErrorWithCodes) {
        setCheckoutErrors(err.codes);
      }
    } finally {
      setIsPaypalDisabled(false);
    }
  };

  if (isPending || !isResolved) {
    return <Skeleton className='h-10 w-full' />;
  }

  return (
    <PayPalButtons
      style={{
        layout: 'vertical',
        label: 'pay',
        shape: 'rect',
        borderRadius: 8,
        height: 40,
      }}
      disabled={isPaypalDisabled || isPaymentDisabled}
      onClick={handleClick}
      createOrder={createOrder}
      onApprove={onApprove}
      onError={_err => {
        // ignore button errors
      }}
    />
  );
}

export function PayPalCheckoutButton() {
  const { t } = useGoDaddyContext();
  const { paypalConfig } = useCheckoutContext();
  const { payPalRequest } = useBuildPaymentRequest();

  if (!paypalConfig) {
    return (
      <div className='text-destructive'>{t.errors.paypalConfigMissing}</div>
    );
  }

  return (
    <div className='w-full'>
      <PayPalScriptProvider
        options={{
          clientId: paypalConfig?.clientId,
          currency:
            payPalRequest?.purchase_units?.[0]?.amount?.currency_code || 'USD',
          intent: 'capture',
          disableFunding: paypalConfig?.disableFunding || [
            'credit',
            'card',
            'paylater',
            'venmo',
          ],
        }}
      >
        <PayPalButtonsWrapper />
      </PayPalScriptProvider>
    </div>
  );
}
