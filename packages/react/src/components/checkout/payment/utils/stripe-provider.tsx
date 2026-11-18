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

export function StripeProvider({
  children,
  isExpress = false,
}: {
  children: React.ReactNode;
  isExpress?: boolean;
}) {
  const { stripeConfig } = useCheckoutContext();
  // An intent awaiting 3-D Secure lives in the session-scoped unresolved
  // payment (unresolved-payment.ts), so it survives remounts and is visible to
  // every payment flow.
  return stripeConfig?.publishableKey?.trim() ? (
    <StripeElementsProvider isExpress={isExpress}>
      {children}
    </StripeElementsProvider>
  ) : (
    <>{children}</>
  );
}

function StripeElementsProvider({
  children,
  isExpress,
}: {
  children: React.ReactNode;
  isExpress: boolean;
}) {
  const { stripePromise, currency, clientSecret, isLoading, amount } =
    useStripePaymentIntent({ isExpress });

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
      <Elements
        key={clientSecret}
        stripe={stripePromise}
        options={{ clientSecret }}
      >
        {children}
      </Elements>
    );
  }

  return children;
}
