import { useCheckoutContext } from "@/components/checkout/checkout";
import { PoyntCollectProvider } from "./poynt-provider";
import { SquareProvider } from "./square-provider";
import { StripeProvider } from "./stripe-provider";

interface ConditionalPaymentProvidersProps {
	children: React.ReactNode;
}

/**
 * Conditionally wraps children with payment providers based on available configurations.
 * This prevents loading payment SDKs when they're not configured or needed.
 */
export function ConditionalPaymentProviders({
	children,
}: ConditionalPaymentProvidersProps) {
	const { stripeConfig, godaddyPaymentsConfig, squareConfig } =
		useCheckoutContext();

	// Start with the children and conditionally wrap with providers
	let wrappedChildren = children;

	// Only wrap with SquareProvider if Square is configured
	if (squareConfig?.appId?.trim() && squareConfig?.locationId?.trim()) {
		wrappedChildren = <SquareProvider>{wrappedChildren}</SquareProvider>;
	}

	// Only wrap with PoyntCollectProvider (GoDaddy Payments) if configured
	if (
		godaddyPaymentsConfig?.businessId?.trim() &&
		godaddyPaymentsConfig?.appId?.trim()
	) {
		wrappedChildren = (
			<PoyntCollectProvider>{wrappedChildren}</PoyntCollectProvider>
		);
	}

	// Only wrap with StripeProvider if Stripe is configured
	if (stripeConfig?.publishableKey?.trim()) {
		wrappedChildren = <StripeProvider>{wrappedChildren}</StripeProvider>;
	}

	return <>{wrappedChildren}</>;
}

/**
 * Express checkout version - loads providers that support express checkout
 * Currently supports Stripe and GoDaddy Payments for express checkout
 */
export function ConditionalExpressProviders({
	children,
}: ConditionalPaymentProvidersProps) {
	const { stripeConfig } = useCheckoutContext();

	// Start with the children and conditionally wrap with express-capable providers
	let wrappedChildren = children;

	// Only wrap with StripeProvider if Stripe is configured
	if (stripeConfig?.publishableKey?.trim()) {
		wrappedChildren = <StripeProvider>{wrappedChildren}</StripeProvider>;
	}

	return <>{wrappedChildren}</>;
}
