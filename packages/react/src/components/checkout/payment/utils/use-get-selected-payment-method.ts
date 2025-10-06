import { useCheckoutContext } from "@/components/checkout/checkout";
import type { PaymentMethodConfig, PaymentMethodValue } from "@/types";
import { useMemo } from "react";

export function useGetSelectedPaymentMethod(
	paymentMethod: PaymentMethodValue | undefined | null,
): PaymentMethodConfig | null {
	const { session } = useCheckoutContext();

	return useMemo(() => {
		if (!paymentMethod || !session?.paymentMethods) return null;

		const methodConfig = session.paymentMethods[
			paymentMethod as PaymentMethodValue
		] as PaymentMethodConfig;

		return {
			type: paymentMethod,
			processor: methodConfig?.processor,
			checkoutTypes: methodConfig?.checkoutTypes || [],
		};
	}, [paymentMethod, session?.paymentMethods]);
}
