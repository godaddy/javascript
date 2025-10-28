import { useCheckoutContext } from "@/components/checkout/checkout";
import { useDraftOrderTotals } from "@/components/checkout/order/use-draft-order";
import { useStripePaymentIntent } from "@/components/checkout/payment/utils/use-stripe-payment-intent";
import { Elements, useElements } from "@stripe/react-stripe-js";
import { useEffect } from "react";

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
					mode: "payment",
					amount: amount,
					currency,
					capture_method: "manual",
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
