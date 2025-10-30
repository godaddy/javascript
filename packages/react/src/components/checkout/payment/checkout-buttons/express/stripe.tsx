import { ExpressCheckoutElement } from '@stripe/react-stripe-js';
import type { ShippingRate } from '@stripe/stripe-js';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useStripeCheckout } from '@/components/checkout/payment/utils/use-stripe-checkout';
import { useStripePaymentIntent } from '@/components/checkout/payment/utils/use-stripe-payment-intent';
import { Skeleton } from '@/components/ui/skeleton';
import { useGoDaddyContext } from '@/godaddy-provider';

export function StripeExpressCheckoutForm() {
  const { t } = useGoDaddyContext();
  const { handleSubmit } = useStripeCheckout({
    mode: 'express',
  });

  return (
    <ExpressCheckoutElement
      // https://docs.stripe.com/js/elements_object/express_checkout_element_shippingaddresschange_event
      onShippingAddressChange={async event => {
        //const address = event.address;
        try {
          const shippingRates: ShippingRate[] = [
            {
              id: 'standard',
              amount: 500,
              displayName: t.payment.standardShipping,
              deliveryEstimate: '3-5 business days',
            },
            // TODO: Hook into shipping API
          ];

          event.resolve({
            shippingRates,
          });
        } catch {
          event.reject();
        }
      }}
      // https://docs.stripe.com/js/elements_object/express_checkout_element_confirm_event
      onConfirm={handleSubmit}
    />
  );
}

export function StripeExpressCheckoutButton() {
  const { t } = useGoDaddyContext();
  const { stripeConfig } = useCheckoutContext();

  if (!stripeConfig) {
    return (
      <div className='text-destructive'>{t.errors.stripeConfigMissing}</div>
    );
  }

  const { isLoading } = useStripePaymentIntent();

  return (
    <>
      {isLoading ? (
        <div className='grid gap-1 grid-cols-2'>
          <Skeleton className='h-12 w-full mb-1' />
          <Skeleton className='h-12 w-full mb-1' />
        </div>
      ) : null}
      <StripeExpressCheckoutForm />
    </>
  );
}
