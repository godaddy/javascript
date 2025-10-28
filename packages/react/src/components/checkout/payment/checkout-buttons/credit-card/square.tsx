import { useCheckoutContext } from "@/components/checkout/checkout";
import { useSquare } from "@/components/checkout/payment/utils/square-provider";
import { useBuildPaymentRequest } from "@/components/checkout/payment/utils/use-build-payment-request";
import {
	PaymentProvider,
	useConfirmCheckout,
} from "@/components/checkout/payment/utils/use-confirm-checkout";
import { useIsPaymentDisabled } from "@/components/checkout/payment/utils/use-is-payment-disabled";
import { Button } from "@/components/ui/button";
import { useGoDaddyContext } from "@/godaddy-provider";
import { GraphQLErrorWithCodes } from "@/lib/graphql-with-errors";
import { PaymentMethodType } from "@/types";
import React, { useCallback, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";

export function SquareCreditCardCheckoutButton() {
	const { t } = useGoDaddyContext();
	const { card, isLoading } = useSquare();
	const { squarePaymentRequest } = useBuildPaymentRequest();
	const confirmCheckout = useConfirmCheckout();
	const { setCheckoutErrors, isConfirmingCheckout } = useCheckoutContext();
	const isPaymentDisabled = useIsPaymentDisabled();
	const form = useFormContext();
	const buttonRef = useRef<HTMLButtonElement>(null);
	const [isSquareDisabled, setIsSquareDisabled] = useState<boolean>(false);

	const handleSubmit = useCallback(async () => {
		if (!card) {
			console.error("Square card instance is null/undefined - cannot proceed");
			return;
		}

		const valid = await form.trigger();
		if (!valid) {
			const firstError = Object.keys(form.formState.errors)[0];
			if (firstError) {
				form.setFocus(firstError);
			}
			return;
		}

		try {
			setIsSquareDisabled(true);
			const cardToken = await card.tokenize(squarePaymentRequest);

			if (cardToken.status === "OK" && cardToken?.token) {
				await confirmCheckout.mutateAsync({
					paymentToken: cardToken.token,
					paymentType: PaymentMethodType.CREDIT_CARD,
					paymentProvider: PaymentProvider.SQUARE,
				});
			}
		} catch (err: unknown) {
			if (err instanceof GraphQLErrorWithCodes) {
				setCheckoutErrors(err.codes);
			} else {
				console.error("payment failed:", err);
			}
		} finally {
			setIsSquareDisabled(false);
		}
	}, [
		form,
		card,
		confirmCheckout.mutateAsync,
		squarePaymentRequest,
		setCheckoutErrors,
	]);

	return (
		<Button
			className="w-full"
			size="lg"
			type="button"
			onClick={handleSubmit}
			ref={buttonRef}
			disabled={
				isLoading ||
				isConfirmingCheckout ||
				isPaymentDisabled ||
				isSquareDisabled
			}
		>
			{t.payment.payNow}
		</Button>
	);
}
