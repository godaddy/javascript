import { useCheckoutContext } from "@/components/checkout/checkout";
import { useSquare } from "@/components/checkout/payment/utils/square-provider";
import type { SquarePaymentRequest } from "@/components/checkout/payment/utils/use-build-payment-request";
import { useLoadSquare } from "@/components/checkout/payment/utils/use-load-square";
import type React from "react";
import { useEffect } from "react";

declare global {
	interface Window {
		Square: {
			payments(appId: string, locationId: string): SquarePayments;
		};
	}
}

export interface CardOptions {
	style?: {
		[selector: string]:
			| React.CSSProperties
			| {
					[cssProperty: string]: string | number;
			  };
	};
}

export interface SquarePayments {
	card(options?: CardOptions): Promise<SquarePaymentMethod>;
}

export interface SquarePaymentMethod {
	mount(selector: string): Promise<void>;
	destroy(): void;
	tokenize(request: SquarePaymentRequest): Promise<SquareTokenResult>;
	attach(selector: string): Promise<void>;
}

export interface SquareTokenResult {
	status: "OK" | "ERROR";
	token?: string;
	errors?: Array<{
		code: string;
		message: string;
		field?: string;
		category?: string;
	}>;
}

export function SquareCreditCardForm() {
	const { setCard } = useSquare();
	const { squareConfig } = useCheckoutContext();
	const { isSquareLoaded } = useLoadSquare();

	useEffect(() => {
		if (!isSquareLoaded || !squareConfig || !window?.Square) {
			return;
		}
		initializePaymentForm();
	}, [isSquareLoaded, squareConfig]);

	const initializePaymentForm = async () => {
		try {
			if (!squareConfig) return;

			const payments = window?.Square?.payments(
				squareConfig.appId,
				squareConfig.locationId,
			);

			const cardOptions = {
				style: {
					input: {
						fontSize: "14px",
					},
				},
			};

			const cardInstance = await payments.card(cardOptions);
			await cardInstance.attach("#square-card-container");
			setCard(cardInstance);
		} catch (error) {
			console.error("Failed to initialize Square payment form:", error);
		}
	};

	return <div id="square-card-container" className="square-card-input" />;
}
