import { Elements, useElements } from '@stripe/react-stripe-js';
import {
  createContext,
  type RefObject,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useDraftOrderTotals } from '@/components/checkout/order/use-draft-order';
import { useStripePaymentIntent } from '@/components/checkout/payment/utils/use-stripe-payment-intent';

type PendingStripeIntent = { sessionId: string | undefined; id: string };
const StripePaymentContext =
  createContext<RefObject<PendingStripeIntent | null> | null>(null);

export function usePendingStripeIntent() {
  const pendingIntent = useContext(StripePaymentContext);
  if (!pendingIntent) throw new Error('StripeProvider is required');
  return pendingIntent;
}

function StripeElementsUpdater() {
  const elements = useElements();
  const { data: totals, isLoading: totalsLoading } = useDraftOrderTotals();

  useEffect(() => {
    if (!totalsLoading && elements && (totals?.total?.value || 0) > 0) {
      elements.update({
        amount: totals?.total?.value || 0,
      });
    }
  }, [elements, totalsLoading, totals?.total?.value]);

  return null; // This component only updates Elements
}

export function StripeProvider({ children }: { children: React.ReactNode }) {
  // The provider survives the checkout button being replaced with a spinner.
  // Card and express providers each own their continuation reference.
  const pendingIntent = useRef<PendingStripeIntent | null>(null);
  return (
    <StripePaymentContext.Provider value={pendingIntent}>
      <StripeElementsProvider>{children}</StripeElementsProvider>
    </StripePaymentContext.Provider>
  );
}

function StripeElementsProvider({ children }: { children: React.ReactNode }) {
  const { stripeConfig } = useCheckoutContext();

  if (!stripeConfig?.publishableKey?.trim()) {
    return <>{children}</>;
  }

  const { stripePromise, currency, clientSecret, isLoading, amount } =
    useStripePaymentIntent();

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
        <StripeElementsUpdater />
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
