import { useCheckoutContext } from "@/components/checkout/checkout";
import { useStripePaymentIntent } from "@/components/checkout/payment/utils/use-stripe-payment-intent";
import { useGoDaddyContext } from "@/godaddy-provider";
import { CardElement } from "@stripe/react-stripe-js";
import type { StripeCardElementChangeEvent } from "@stripe/stripe-js";
import { useCallback, useState } from "react";
import * as React from "react";

export function StripeCreditCardForm() {
	const { t } = useGoDaddyContext();
	const { stripeConfig } = useCheckoutContext();
	const [cardError, setCardError] = useState<string | null>(null);

	const handleCardChange = useCallback(
		(event: StripeCardElementChangeEvent) => {
			if (event.error) {
				setCardError(event.error.message);
			} else {
				setCardError(null);
			}
		},
		[],
	);

	if (!stripeConfig) {
		return (
			<div className="text-destructive">{t.errors.stripeConfigMissing}</div>
		);
	}

	const { isLoading } = useStripePaymentIntent();

	if (isLoading) return null;

	return (
		<div className="space-y-4">
			<label
				htmlFor="stripe-card-element"
				className="block text-sm font-medium mb-1 sr-only"
			>
				{t.payment.cardDetails}
			</label>
			<div className="border border-input rounded px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-primary transition">
				<CardElement
					onChange={handleCardChange}
					id="stripe-card-element"
					options={{
						style: { base: { fontSize: "16px" } },
						hidePostalCode: true,
					}}
					aria-labelledby="stripe-card-element"
				/>
			</div>
			{cardError && (
				<p className="text-[0.8rem] font-medium text-destructive">
					{cardError}
				</p>
			)}
		</div>
	);
}
