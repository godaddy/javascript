import { useCheckoutContext } from "@/components/checkout/checkout";
import { useBuildPaymentRequest } from "@/components/checkout/payment/utils/use-build-payment-request";
import {
	PaymentProvider,
	useConfirmCheckout,
} from "@/components/checkout/payment/utils/use-confirm-checkout";
import { GraphQLErrorWithCodes } from "@/lib/graphql-with-errors";
import { PaymentMethodType } from "@/types";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useCallback, useState } from "react";

type UseStripeCheckoutOptions = {
	mode: "card" | "express";
	clientSecret?: string | null;
};

export function useStripeCheckout({ mode }: UseStripeCheckoutOptions) {
	const stripe = useStripe();
	const elements = useElements();
	const confirmCheckout = useConfirmCheckout();
	const { setCheckoutErrors } = useCheckoutContext();
	const { stripePaymentExpressRequest } = useBuildPaymentRequest();
	const [isProcessingPayment, setIsProcessingPayment] = useState(false);

	const handleSubmit = useCallback(async () => {
		setIsProcessingPayment(true);
		try {
			if (!stripe || !elements) {
				console.error("Stripe.js has not loaded yet.");
				return;
			}

			if (mode === "card") {
				const cardElement = elements.getElement(CardElement);

				if (!cardElement) {
					console.error("Card element not found");
					return;
				}

				const { paymentMethod, error } = await stripe.createPaymentMethod({
					card: cardElement,
					type: "card",
				});

				if (error) {
					console.error("Failed to create payment method:", error);
					setCheckoutErrors([error.code || "payment_method_creation_failed"]);
					return;
				}

				if (paymentMethod) {
					try {
						await confirmCheckout.mutateAsync({
							paymentToken: paymentMethod.id,
							paymentType: PaymentMethodType.CREDIT_CARD,
							paymentProvider: PaymentProvider.STRIPE,
						});
					} catch (err: unknown) {
						if (err instanceof GraphQLErrorWithCodes) {
							setCheckoutErrors(err.codes);
						} else {
							console.error("payment failed:", err);
						}
					}
				} else {
					console.error("No payment method created");
					setCheckoutErrors(["payment_method_creation_failed"]);
				}
			}

			if (mode === "express") {
				const { error, confirmationToken: expressToken } =
					await stripe.createConfirmationToken({
						elements,
						params: {
							...stripePaymentExpressRequest,
						},
					});

				if (error) {
					console.error("Failed to create confirmation token:", error);
					setCheckoutErrors([
						error.code || "confirmation_token_creation_failed",
					]);
					return;
				}

				if (expressToken) {
					try {
						await confirmCheckout.mutateAsync({
							paymentToken: expressToken.id,
							paymentType: expressToken?.payment_method_preview?.type,
							paymentProvider: PaymentProvider.STRIPE,
						});
					} catch (err: unknown) {
						if (err instanceof GraphQLErrorWithCodes) {
							setCheckoutErrors(err.codes);
						} else {
							console.error("payment failed:", err);
						}
					}
				} else {
					console.error("No confirmation token created");
					setCheckoutErrors(["confirmation_token_creation_failed"]);
				}
			}

			return { success: false, error: `Mode not supported: ${mode}` };
		} finally {
			setIsProcessingPayment(false);
		}
	}, [
		mode,
		stripe,
		elements,
		stripePaymentExpressRequest,
		confirmCheckout.mutateAsync,
		setCheckoutErrors,
	]);

	return {
		handleSubmit,
		isProcessingPayment,
	};
}
