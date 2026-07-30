import { Elements, useElements } from '@stripe/react-stripe-js';
import { useEffect } from 'react';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useStripePaymentIntent } from '@/components/checkout/payment/utils/use-stripe-payment-intent';

function StripeElementsUpdater({ amount = 0 }: { amount?: number }) {
  const elements = useElements();

  useEffect(() => {
    if (elements && amount > 0) {
      elements.update({
        amount,
      });
    }
  }, [elements, amount]);

  return null; // This component only updates Elements
}

export function StripeProvider({ children }: { children: React.ReactNode }) {
  const { stripeConfig } = useCheckoutContext();

  const { stripePromise, currency, clientSecret, isLoading, amount } =
    useStripePaymentIntent();

  if (!stripeConfig?.publishableKey?.trim()) {
    return <>{children}</>;
  }

  if (isLoading || !stripePromise || amount <= 0) {
    return null;
  }

  if (stripePromise && !clientSecret) {
    return (
      <Elements
        stripe={stripePromise}
        options={{
          mode: 'payment',
          amount: amount,
          currency,
          capture_method: 'manual',
          paymentMethodCreation: 'manual',
          payment_method_types: ['card'],
        }}
      >
        <StripeElementsUpdater amount={amount} />
        {children}
      </Elements>
    );
  }

  if (stripePromise && clientSecret) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        {children}
      </Elements>
    );
  }

  return children;
}
