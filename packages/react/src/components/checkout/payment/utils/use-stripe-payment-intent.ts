import { useCheckoutContext } from "@/components/checkout/checkout";
import { useDraftOrderTotals } from "@/components/checkout/order/use-draft-order";
import { type Stripe, loadStripe } from "@stripe/stripe-js";
import { useIsMutating, useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";

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
	const form = useFormContext();

	const draftOrderTotalsQuery = useDraftOrderTotals();
	const { data: totals, isLoading: isLoadingTotals } = draftOrderTotalsQuery;
	const amount = totals?.total?.value || 0;
	const currency = totals?.total?.currencyCode?.toLowerCase() || "usd";

	const [stripePromise, setStripePromise] =
		useState<Promise<Stripe | null> | null>(null);
	const [clientSecret, setClientSecret] = useState<string | null>(null);
	const [intentId, setIntentId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (stripeConfig?.publishableKey?.trim()) {
			setStripePromise(getStripe(stripeConfig.publishableKey));
		}
	}, [stripeConfig?.publishableKey]);

	const isCreatingPaymentIntent = useIsMutating({
		mutationKey: ["stripe-payment-intent", { sessionId: session?.id }],
	});

	const paymentIntentMutation = useMutation({
		mutationKey: ["stripe-payment-intent", { sessionId: session?.id }],
		mutationFn: async ({
			amount,
			currency,
			updateIntent,
			intentId,
		}: {
			amount: number;
			currency: string;
			updateIntent: boolean;
			intentId: string | null;
		}) => {
			const res = await fetch(
				updateIntent && intentId
					? "/api/update-payment-intent"
					: "/api/create-payment-intent",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						amount,
						currency,
						...(updateIntent && intentId ? { id: intentId } : {}),
					}),
				},
			);
			if (!res.ok) throw new Error("Failed to get payment intent");
			return res.json();
		},
		onMutate: () => {
			setClientSecret(null);
			setIntentId(null);
			form.setValue("stripePaymentIntent", null);
			form.setValue("stripePaymentIntentId", null);
			setError(null);
		},
		onSuccess: ({ clientSecret, id }) => {
			setClientSecret(clientSecret);
			setIntentId(id);
			setError(null);
			form.setValue("stripePaymentIntent", clientSecret);
			form.setValue("stripePaymentIntentId", id);
		},
		onError: () => {
			setError("Failed to initialize payment.");
		},
	});

	const isLoading =
		paymentIntentMutation.isPending ||
		isLoadingTotals ||
		!stripePromise ||
		isCreatingPaymentIntent;

	const initializePaymentIntent = useCallback(() => {
		const existingClientSecret = form.getValues("stripePaymentIntent");
		const existingIntentId = form.getValues("stripePaymentIntentId");

		if (existingClientSecret && existingIntentId) {
			setClientSecret(existingClientSecret);
			setIntentId(existingIntentId);
			setError(null);
			return;
		}

		if (isLoading || !enableClientSecret) {
			return;
		}

		paymentIntentMutation.mutate({
			amount,
			currency,
			updateIntent,
			intentId,
		});
	}, [
		amount,
		currency,
		updateIntent,
		intentId,
		isLoading,
		form.getValues,
		paymentIntentMutation.mutate,
		enableClientSecret,
	]);

	const amountRef = useRef<null | number>(null);

	useEffect(() => {
		if (amountRef.current !== amount && !isLoading) {
			initializePaymentIntent();
			amountRef.current = amount;
		}
	}, [initializePaymentIntent, amount, isLoading]);

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
