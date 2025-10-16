"use client";

import {
	type CheckoutElements,
	type CheckoutProps,
	checkoutContext,
	useCheckoutContext,
} from "@/components/checkout/checkout";
import { CheckoutSection } from "@/components/checkout/checkout-section";
import { PaymentMethodRenderer } from "@/components/checkout/payment/payment-method-renderer";
import { ConditionalExpressProviders } from "@/components/checkout/payment/utils/conditional-providers";
import { Target } from "@/components/checkout/target/target";
import type { GoDaddyVariables } from "@/godaddy-provider";
import { type Theme, useTheme } from "@/hooks/use-theme";
import { useVariables } from "@/hooks/use-variables";
import { TrackingProvider } from "@/tracking/tracking-provider";
import type {
	AvailablePaymentProviders,
	CheckoutSession,
	PaymentMethodValue,
} from "@/types";
import React, { type ReactNode } from "react";

interface ExpressCheckoutAppearance {
	theme?: Theme;
	elements?: CheckoutElements;
	variables?: Omit<GoDaddyVariables, "checkout">;
}

export interface ExpressCheckoutProps {
	session: CheckoutSession | undefined;
	appearance?: ExpressCheckoutAppearance;
	stripeConfig?: CheckoutProps["stripeConfig"];
	godaddyPaymentsConfig?: CheckoutProps["godaddyPaymentsConfig"];
	squareConfig?: CheckoutProps["squareConfig"];
	paypalConfig?: CheckoutProps["paypalConfig"];
	direction?: "ltr" | "rtl";
	enableTracking?: boolean;
	targets?: Partial<Record<string, () => ReactNode>>;
}

function DraftOrderExpressCheckoutButtons() {
	const { session } = useCheckoutContext();

	const expressProviders = React.useMemo(() => {
		if (!session?.paymentMethods) return [];

		return Object.entries(session.paymentMethods)
			.filter(
				([, method]) =>
					method &&
					Array.isArray(method.checkoutTypes) &&
					method.checkoutTypes.includes("express"),
			)
			.map(([provider]) => provider);
	}, [session?.paymentMethods]);

	const availableExpressButtons = expressProviders
		.map((provider) => {
			const processor =
				session?.paymentMethods?.[provider as PaymentMethodValue]?.processor;

			return (
				<PaymentMethodRenderer
					key={`express-${provider}`}
					type="button"
					method={provider as PaymentMethodValue}
					provider={processor as AvailablePaymentProviders}
				/>
			);
		})
		.filter(Boolean);

	if (availableExpressButtons.length === 0) {
		return null;
	}

	return (
		<CheckoutSection style={{ gridArea: "express-checkout" }}>
			<Target id="checkout.form.express-checkout.before" />
			<div className="flex flex-col gap-3">{availableExpressButtons}</div>
			<Target id="checkout.form.express-checkout.after" />
		</CheckoutSection>
	);
}

export function DraftOrderExpressCheckout(props: ExpressCheckoutProps) {
	const {
		session,
		enableTracking = false,
		stripeConfig,
		godaddyPaymentsConfig,
		squareConfig,
		paypalConfig,
	} = props;

	useTheme();
	useVariables(props?.appearance?.variables);

	const [isConfirmingCheckout, setIsConfirmingCheckout] = React.useState(false);
	const [checkoutErrors, setCheckoutErrors] = React.useState<
		string[] | undefined
	>(undefined);

	// Create a context value with only the session and payment configurations
	const contextValue = {
		elements: props?.appearance?.elements,
		targets: props?.targets,
		session,
		stripeConfig,
		godaddyPaymentsConfig,
		squareConfig,
		paypalConfig,
		isConfirmingCheckout,
		setIsConfirmingCheckout,
		checkoutErrors,
		setCheckoutErrors,
	};

	// Only render if there are express payment methods available
	const hasExpressPaymentMethods = React.useMemo(() => {
		if (!session?.paymentMethods) return false;

		return Object.values(session.paymentMethods).some(
			(method) =>
				method &&
				Array.isArray(method.checkoutTypes) &&
				method.checkoutTypes.includes("express"),
		);
	}, [session?.paymentMethods]);

	if (!hasExpressPaymentMethods) {
		return null;
	}

	return (
		<TrackingProvider
			session={session}
			trackingEnabled={enableTracking && !!session?.id}
		>
			<checkoutContext.Provider value={contextValue}>
				<CheckoutSection>
					<ConditionalExpressProviders>
						<DraftOrderExpressCheckoutButtons />
					</ConditionalExpressProviders>
				</CheckoutSection>
			</checkoutContext.Provider>
		</TrackingProvider>
	);
}
