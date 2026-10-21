import { Elements, useElements } from '@stripe/react-stripe-js';
import {
  createContext,
  type RefObject,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useStripePaymentIntent } from '@/components/checkout/payment/utils/use-stripe-payment-intent';

type PendingStripeIntent = {
  sessionId: string | undefined;
  id: string;
  paymentType?: string;
};
const StripePaymentContext =
  createContext<RefObject<PendingStripeIntent | null> | null>(null);

export function usePendingStripeIntent() {
  const pendingIntent = useContext(StripePaymentContext);
  if (!pendingIntent) throw new Error('StripeProvider is required');
  return pendingIntent;
}

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
  // The provider survives the checkout button being replaced with a spinner.
  // Card and express providers each own their continuation reference.
  const pendingIntent = useRef<PendingStripeIntent | null>(null);
  return (
    <StripePaymentContext.Provider value={pendingIntent}>
      {stripeConfig?.publishableKey?.trim() ? (
        <StripeElementsProvider isExpress={isExpress}>
          {children}
        </StripeElementsProvider>
      ) : (
        children
      )}
    </StripePaymentContext.Provider>
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
