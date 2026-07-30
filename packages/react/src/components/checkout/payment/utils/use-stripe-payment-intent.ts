import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { useIsMutating, useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type UseFormReturn, useFormContext } from 'react-hook-form';
import {
  type CheckoutFormData,
  useCheckoutContext,
} from '@/components/checkout/checkout';
import { useDraftOrderTotals } from '@/components/checkout/order/use-draft-order';
import { checkoutMutationKeys } from '@/components/checkout/utils/query-keys';

const stripePromiseCache: Record<string, Promise<Stripe | null>> = {};

function getStripe(publishableKey: string): Promise<Stripe | null> {
  if (!stripePromiseCache[publishableKey]) {
    stripePromiseCache[publishableKey] = loadStripe(publishableKey);
  }
  return stripePromiseCache[publishableKey];
}

type UseStripePaymentIntentOptions = {
  updateIntent?: boolean;
  enableClientSecret?: boolean;
};

export function useStripePaymentIntent({
  updateIntent = false,
  enableClientSecret = false,
}: UseStripePaymentIntentOptions = {}) {
  const { session, stripeConfig } = useCheckoutContext();
  const form =
    useFormContext<CheckoutFormData>() as UseFormReturn<CheckoutFormData> | null;

  const draftOrderTotalsQuery = useDraftOrderTotals();
  const { data: totals, isLoading: isLoadingTotals } = draftOrderTotalsQuery;
  const total = totals?.total?.value || 0;
  const tipAmount = form?.watch('tipAmount') || 0;
  const amount = session?.enableTips ? total + tipAmount : total;
  const currency = totals?.total?.currencyCode?.toLowerCase() || 'usd';

  const existingClientSecret = form?.watch('stripePaymentIntent');
  const existingIntentId = form?.watch('stripePaymentIntentId');

  const [stripePromise, setStripePromise] =
    useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [intentId, setIntentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const syncedIntentRef = useRef<{
    clientSecret: string;
    amount: number;
  } | null>(null);

  useEffect(() => {
    if (stripeConfig?.publishableKey?.trim()) {
      setStripePromise(getStripe(stripeConfig.publishableKey));
    }
  }, [stripeConfig?.publishableKey]);

  const isCreatingPaymentIntent = useIsMutating({
    mutationKey: checkoutMutationKeys.stripePaymentIntent(session?.id),
  });

  const paymentIntentMutation = useMutation({
    mutationKey: checkoutMutationKeys.stripePaymentIntent(session?.id),
    mutationFn: async ({
      amount: paymentAmount,
      currency: paymentCurrency,
      updateIntent: shouldUpdate,
      intentId: paymentIntentId,
    }: {
      amount: number;
      currency: string;
      updateIntent: boolean;
      intentId: string | null;
    }) => {
      const res = await fetch(
        shouldUpdate && paymentIntentId
          ? '/api/update-payment-intent'
          : '/api/create-payment-intent',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: paymentAmount,
            currency: paymentCurrency,
            ...(shouldUpdate && paymentIntentId ? { id: paymentIntentId } : {}),
          }),
        }
      );
      if (!res.ok) throw new Error('Failed to get payment intent');
      return res.json();
    },
    onMutate: () => {
      syncedIntentRef.current = null;
      setClientSecret(null);
      setIntentId(null);
      form?.setValue('stripePaymentIntent', undefined);
      form?.setValue('stripePaymentIntentId', undefined);
      setError(null);
    },
    onSuccess: (
      { clientSecret: responseClientSecret, id: responseId },
      variables
    ) => {
      syncedIntentRef.current = {
        clientSecret: responseClientSecret,
        amount: variables.amount,
      };
      setClientSecret(responseClientSecret);
      setIntentId(responseId);
      form?.setValue('stripePaymentIntent', responseClientSecret);
      form?.setValue('stripePaymentIntentId', responseId);
      setError(null);
    },
    onError: () => {
      setError('Failed to initialize payment.');
    },
  });

  const isLoading =
    paymentIntentMutation.isPending ||
    isLoadingTotals ||
    !stripePromise ||
    isCreatingPaymentIntent;

  const initializePaymentIntent = useCallback(() => {
    if (existingClientSecret && existingIntentId) {
      // An intent we haven't seen yet: adopt it for the current amount.
      if (syncedIntentRef.current?.clientSecret !== existingClientSecret) {
        syncedIntentRef.current = {
          clientSecret: existingClientSecret,
          amount,
        };
        setClientSecret(existingClientSecret);
        setIntentId(existingIntentId);
        setError(null);
        return;
      }

      // The intent already covers this amount.
      if (syncedIntentRef.current.amount === amount) {
        return;
      }
    }

    if (isLoading || !enableClientSecret) {
      return;
    }

    paymentIntentMutation.mutate({
      amount,
      currency,
      updateIntent,
      intentId: existingIntentId ?? intentId,
    });
  }, [
    amount,
    currency,
    updateIntent,
    intentId,
    isLoading,
    existingClientSecret,
    existingIntentId,
    paymentIntentMutation.mutate,
    enableClientSecret,
  ]);

  const amountRef = useRef<null | number>(null);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const isIntentStale =
      syncedIntentRef.current?.clientSecret !== existingClientSecret;

    if (amountRef.current !== amount || isIntentStale) {
      initializePaymentIntent();
      amountRef.current = amount;
    }
  }, [initializePaymentIntent, amount, isLoading, existingClientSecret]);

  return {
    stripePromise,
    clientSecret,
    intentId,
    isLoading,
    error,
    initializePaymentIntent,
    amount,
    currency,
  };
}
