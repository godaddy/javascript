import {
	LazyPaymentMethodRenderer,
	hasLazyPaymentMethodButton,
	hasLazyPaymentMethodForm,
} from "@/components/checkout/payment/lazy-payment-loader";
import type { AvailablePaymentProviders, PaymentMethodValue } from "@/types";

type PaymentMethodRendererProps = {
	type: "form" | "button";
	method: PaymentMethodValue;
	provider: AvailablePaymentProviders;
	isExpress?: boolean;
};

export function PaymentMethodRenderer({
	type,
	method,
	provider,
	isExpress,
}: PaymentMethodRendererProps) {
	return (
		<LazyPaymentMethodRenderer
			type={type}
			method={method}
			provider={provider}
			isExpress={isExpress}
		/>
	);
}

export function hasPaymentMethodButton(
	method: PaymentMethodValue,
	provider: AvailablePaymentProviders,
): boolean {
	return hasLazyPaymentMethodButton(method, provider);
}

export function hasPaymentMethodForm(
	method: PaymentMethodValue,
	provider: AvailablePaymentProviders,
): boolean {
	return hasLazyPaymentMethodForm(method, provider);
}
