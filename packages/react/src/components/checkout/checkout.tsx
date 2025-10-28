"use client";

import { hasRegionData } from "@/components/checkout/address";
import { checkIsValidPhone } from "@/components/checkout/address/utils/check-is-valid-phone";
import { DeliveryMethods } from "@/components/checkout/delivery/delivery-method";
import { getRequiredFieldsFromSchema } from "@/components/checkout/form/utils/get-required-fields-from-schema";
import { type GoDaddyVariables, useGoDaddyContext } from "@/godaddy-provider";
import { type Theme, useTheme } from "@/hooks/use-theme";
import { useVariables } from "@/hooks/use-variables";
import type { TrackingProperties } from "@/tracking/event-properties";
import { TrackingProvider } from "@/tracking/tracking-provider";
import type { CheckoutSession } from "@/types";
import React, { type ReactNode } from "react";
import { z } from "zod";
import { CheckoutFormContainer } from "./form/checkout-form-container";
import type { Target } from "./target/target";

// Utility function for redirecting to success URL after checkout
export function redirectToSuccessUrl(successUrl?: string): void {
	if (successUrl && typeof window !== "undefined") {
		setTimeout(() => {
			window.location.href = successUrl;
		}, 1000);
	}
}

export interface CheckoutElements {
	input?: string;
	select?: string;
	button?: string;
	card?: string;
	checkbox?: string;
	radio?: string;
}

interface Appearance {
	theme?: Theme;
	elements?: CheckoutElements;
	variables?: Omit<GoDaddyVariables, "checkout">;
}

export type LayoutSection =
	| "express-checkout"
	| "contact"
	| "shipping"
	| "payment"
	| "pickup"
	| "tips"
	| "delivery";

export const LayoutSections = {
	EXPRESS_CHECKOUT: "express-checkout",
	CONTACT: "contact",
	SHIPPING: "shipping",
	PAYMENT: "payment",
	PICKUP: "pickup",
	DELIVERY: "delivery",
	TIPS: "tips",
} as const;

export type StripeConfig = {
	publishableKey: string;
	testMode?: boolean;
};

export type GodaddyPaymentsConfig = {
	businessId: string;
	appId: string;
};

export type SquareConfig = {
	locationId: string;
	appId: string;
};

export type PayPalConfig = {
	clientId: string;
	disableFunding?: Array<"credit" | "card" | "paylater" | "venmo">;
};

interface CheckoutContextValue {
	elements?: CheckoutElements;
	targets?: Partial<Record<Target, () => ReactNode>>;
	session?: CheckoutSession;
	isCheckoutDisabled?: boolean;
	stripeConfig?: StripeConfig;
	godaddyPaymentsConfig?: GodaddyPaymentsConfig;
	squareConfig?: SquareConfig;
	paypalConfig?: PayPalConfig;
	isConfirmingCheckout: boolean;
	setIsConfirmingCheckout: (isConfirming: boolean) => void;
	checkoutErrors?: string[] | undefined;
	setCheckoutErrors: (error?: string[] | undefined) => void;
	requiredFields?: { [key: string]: boolean };
}
/**
 * Non-digit regex.
 */
const NON_DIGIT_REGEX = /\D/g;

export function _isLuhnAlgo(input: string): boolean {
	// Remove any non-digit chars
	const number = input.replace(NON_DIGIT_REGEX, "");

	// Create necessary variables
	let length = number.length;
	let bit = 1;
	let sum = 0;

	// Calculate sum of algorithm
	while (length) {
		const value = +number[--length];
		bit ^= 1;
		sum += bit ? [0, 2, 4, 6, 8, 1, 3, 5, 7, 9][value] : value;
	}

	// Return whether its valid
	return sum % 10 === 0;
}

export const checkoutContext = React.createContext<CheckoutContextValue>({
	isConfirmingCheckout: false,
	setIsConfirmingCheckout: () => {},
	checkoutErrors: undefined,
	setCheckoutErrors: () => {},
});

export const useCheckoutContext = () => React.useContext(checkoutContext);

export const baseCheckoutSchema = z.object({
	contactEmail: z
		.string()
		.min(1, "Enter an email")
		.email("Enter a valid email"),
	deliveryMethod: z.nativeEnum(DeliveryMethods).describe("fulfillmentModes"),
	paymentUseShippingAddress: z.boolean().default(true),
	shippingFirstName: z.string().max(60),
	shippingLastName: z.string().max(60),
	shippingPhone: z.string().max(15, "Phone number too long").optional(),
	shippingAddressLine1: z.string().max(300),
	shippingAddressLine2: z.string().max(300).optional(),
	shippingAddressLine3: z.string().max(300).optional(),
	shippingAdminArea4: z
		.string()
		.max(100)
		.describe("The neighborhood")
		.optional(),
	shippingAdminArea3: z
		.string()
		.max(100)
		.describe("City, town, or village")
		.optional(),
	shippingAdminArea2: z.string().max(100).describe("Sub-locality or suburb"),
	shippingAdminArea1: z.string().max(100).describe("State or province"),
	shippingPostalCode: z.string().max(60),
	shippingCountryCode: z.string().max(2),
	shippingMethod: z.string().optional(),
	shippingValid: z.literal<boolean>(true, {
		errorMap: () => ({ message: "Invalid shipping address" }),
	}),
	billingFirstName: z.string().max(60),
	billingLastName: z.string().max(60),
	billingPhone: z.string().max(15, "Phone number too long").optional(),
	billingAddressLine1: z.string().max(300),
	billingAddressLine2: z.string().max(300).optional(),
	billingAddressLine3: z.string().max(300).optional(),
	billingAdminArea4: z
		.string()
		.max(100)
		.describe("The neighborhood")
		.optional(),
	billingAdminArea3: z
		.string()
		.max(100)
		.describe("City, town, or village")
		.optional(),
	billingAdminArea2: z.string().max(100).describe("Sub-locality or suburb"),
	billingAdminArea1: z.string().max(100).describe("State or province"),
	billingPostalCode: z.string().max(60),
	billingCountryCode: z.string().max(2),
	billingValid: z.literal<boolean>(true, {
		errorMap: () => ({ message: "Invalid billing address" }),
	}),
	paymentCardNumber: z.string().optional(),
	paymentCardNumberDisplay: z.string().optional(),
	paymentCardType: z.string().optional(),
	paymentExpiryDate: z.string().optional(),
	paymentMonth: z.string().nullish(),
	paymentYear: z.string().nullish(),
	paymentSecurityCode: z.string().optional(),
	paymentNameOnCard: z.string().optional(),
	notes: z.string().optional(),
	pickupDate: z.union([z.string(), z.date()]).nullish(),
	pickupTime: z.string().nullish(),
	pickupLocationId: z.string().nullish(),
	pickupLeadTime: z.number().nullish(),
	pickupTimezone: z.string().nullish(),
	tipAmount: z.number().optional(),
	tipPercentage: z.number().optional(),
	paymentMethod: z.string().min(1, "Select a payment method"),
	stripePaymentIntent: z.string().optional(),
	stripePaymentIntentId: z.string().optional(),
}); // We cannot use refine here, as it would not allow extending the schema with session overrides.

export type CheckoutFormSchema = Partial<{
	[K in keyof z.infer<typeof baseCheckoutSchema>]: z.ZodTypeAny;
}> &
	z.ZodRawShape;

export type CheckoutFormData = z.infer<typeof baseCheckoutSchema>;

export interface CheckoutProps {
	session: CheckoutSession | undefined;
	appearance?: Appearance;
	isCheckoutDisabled?: boolean;
	stripeConfig?: StripeConfig;
	godaddyPaymentsConfig?: GodaddyPaymentsConfig;
	squareConfig?: SquareConfig;
	paypalConfig?: PayPalConfig;
	layout?: LayoutSection[];
	direction?: "ltr" | "rtl";
	showStoreHours?: boolean;
	enableTracking?: boolean;
	trackingProperties?: TrackingProperties;
	targets?: Partial<Record<Target, () => ReactNode>>;
	checkoutFormSchema?: CheckoutFormSchema;
	defaultValues?: Pick<CheckoutFormData, "contactEmail">;
}

export function Checkout(props: CheckoutProps) {
	const {
		session,
		checkoutFormSchema,
		enableTracking = false,
		trackingProperties,
		stripeConfig,
		godaddyPaymentsConfig,
		squareConfig,
		paypalConfig,
		isCheckoutDisabled,
	} = props;

	const [isConfirmingCheckout, setIsConfirmingCheckout] = React.useState(false);
	const [checkoutErrors, setCheckoutErrors] = React.useState<
		string[] | undefined
	>(undefined);
	const { t } = useGoDaddyContext();

	useTheme();
	useVariables(props?.appearance?.variables);

	const formSchema = React.useMemo(() => {
		const extendedSchema = checkoutFormSchema
			? baseCheckoutSchema.extend(checkoutFormSchema)
			: baseCheckoutSchema;

		return extendedSchema.superRefine((data, ctx) => {
			if (data.billingPhone) {
				if (!checkIsValidPhone(String(data?.billingPhone))) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: "Enter a valid billing phone number",
						path: ["billingPhone"],
					});
				}
			}

			if (data.shippingPhone) {
				if (!checkIsValidPhone(String(data?.shippingPhone))) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: "Enter a valid shipping phone number",
						path: ["shippingPhone"],
					});
				}
			}
			// Skip validation if payment method isn't credit card
			// const selectedMethod = data.paymentMethod
			// 	? session?.paymentMethods?.[
			// 			data.paymentMethod as keyof typeof session.paymentMethods
			// 		]
			// 	: null;

			// if (
			// 	data.paymentMethod === PaymentMethodType.CREDIT_CARD &&
			// 	selectedMethod?.processor === PaymentProvider.GODADDY
			// ) {
			// 	// Validate card number presence
			// 	if (!data.paymentCardNumber) {
			// 		ctx.addIssue({
			// 			code: z.ZodIssueCode.custom,
			// 			message: "Enter a card number",
			// 			path: ["paymentCardNumber"],
			// 		});
			// 	}
			//
			// 	// Validate card number display and format
			// 	if (!data.paymentCardNumberDisplay) {
			// 		ctx.addIssue({
			// 			code: z.ZodIssueCode.custom,
			// 			message: "Enter a card number",
			// 			path: ["paymentCardNumberDisplay"],
			// 		});
			// 	} else {
			// 		// Card number format validation
			// 		const SANITIZE_REGEX = /[- ]/g;
			// 		const CREDIT_CARD_REGEX =
			// 			/^(?:\d{14,19}|\d{4}(?: \d{3,6}){2,4}|\d{4}(?:-\d{3,6}){2,4})$/;
			// 		const PROVIDER_REGEX_LIST = [
			// 			// American Express
			// 			/^3[47]\d{13}$/,
			// 			// Diners Club
			// 			/^3(?:0[0-5]|[68]\d)\d{11,13}$/,
			// 			// Discover
			// 			/^6(?:011|5\d{2})\d{12,15}$/,
			// 			// JCB
			// 			/^(?:2131|1800|35\d{3})\d{11}$/,
			// 			// Mastercard
			// 			/^5[1-5]\d{2}|(?:222\d|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)\d{12}$/,
			// 			// UnionPay
			// 			/^(?:6[27]\d{14,17}|81\d{14,17})$/,
			// 			// Visa
			// 			/^4\d{12}(?:\d{3,6})?$/,
			// 		];
			//
			// 		const sanitized = String(data.paymentCardNumberDisplay).replace(
			// 			SANITIZE_REGEX,
			// 			"",
			// 		);
			//
			// 		const isValid =
			// 			CREDIT_CARD_REGEX.test(String(data?.paymentCardNumberDisplay)) &&
			// 			sanitized &&
			// 			PROVIDER_REGEX_LIST.some((regex) => regex.test(sanitized)) &&
			// 			_isLuhnAlgo(sanitized);
			//
			// 		if (!isValid) {
			// 			ctx.addIssue({
			// 				code: z.ZodIssueCode.custom,
			// 				message: "Enter a valid card number",
			// 				path: ["paymentCardNumberDisplay"],
			// 			});
			// 		}
			// 	}
			//
			// 	// Validate expiry date
			// 	if (!data.paymentExpiryDate) {
			// 		ctx.addIssue({
			// 			code: z.ZodIssueCode.custom,
			// 			message: "Enter an expiration date",
			// 			path: ["paymentExpiryDate"],
			// 		});
			// 	} else {
			// 		const [monthInput, yearInput] = String(data.paymentExpiryDate)
			// 			.split(" / ")
			// 			.map((str) => str.trim());
			//
			// 		if (!monthInput || !yearInput) {
			// 			ctx.addIssue({
			// 				code: z.ZodIssueCode.custom,
			// 				message: "Enter a valid expiration date",
			// 				path: ["paymentExpiryDate"],
			// 			});
			// 			return;
			// 		}
			//
			// 		const month = Number.parseInt(monthInput, 10);
			// 		const year = Number.parseInt(yearInput, 10) + 2000;
			//
			// 		if (Number.isNaN(month) || Number.isNaN(year)) {
			// 			ctx.addIssue({
			// 				code: z.ZodIssueCode.custom,
			// 				message: "Enter a valid expiration date",
			// 				path: ["paymentExpiryDate"],
			// 			});
			// 			return;
			// 		}
			//
			// 		if (month < 1 || month > 12) {
			// 			ctx.addIssue({
			// 				code: z.ZodIssueCode.custom,
			// 				message: "Enter a valid month",
			// 				path: ["paymentExpiryDate"],
			// 			});
			// 			return;
			// 		}
			//
			// 		// Last day of the month
			// 		const expiryDate = new Date(year, month, 0, 23, 59, 59, 999);
			//
			// 		if (Number.isNaN(expiryDate.getTime())) {
			// 			ctx.addIssue({
			// 				code: z.ZodIssueCode.custom,
			// 				message: "Enter a valid expiration date",
			// 				path: ["paymentExpiryDate"],
			// 			});
			// 			return;
			// 		}
			//
			// 		const now = new Date();
			// 		if (expiryDate <= now) {
			// 			ctx.addIssue({
			// 				code: z.ZodIssueCode.custom,
			// 				message: "Enter a valid future date",
			// 				path: ["paymentExpiryDate"],
			// 			});
			// 		}
			// 	}
			//
			// 	// Validate security code
			// 	if (!data.paymentSecurityCode) {
			// 		ctx.addIssue({
			// 			code: z.ZodIssueCode.custom,
			// 			message: "Enter a security code",
			// 			path: ["paymentSecurityCode"],
			// 		});
			// 	}
			//
			// 	// Validate name on card
			// 	if (!data.paymentNameOnCard) {
			// 		ctx.addIssue({
			// 			code: z.ZodIssueCode.custom,
			// 			message: "Enter the name on card",
			// 			path: ["paymentNameOnCard"],
			// 		});
			// 	}
			//}

			// Billing address validation - only required if not using shipping address OR pickup
			const requireBillingAddress =
				!data.paymentUseShippingAddress || data.deliveryMethod === "PICKUP";

			if (requireBillingAddress) {
				// Basic billing fields required for all countries
				const billingFields = [
					{ key: "billingFirstName", message: t.validation.enterFirstName },
					{ key: "billingLastName", message: t.validation.enterLastName },
					{ key: "billingAddressLine1", message: t.validation.enterAddress },
					{ key: "billingAdminArea2", message: t.validation.enterCity },
					{
						key: "billingPostalCode",
						message: t.validation.enterZipPostalCode,
					},
					{ key: "billingCountryCode", message: t.validation.enterCountry },
				];

				if (hasRegionData(String(data.billingCountryCode))) {
					billingFields.push({
						key: "billingAdminArea1",
						message: t.validation.selectState,
					});
				}

				for (const { key, message } of billingFields) {
					if (!data[key as keyof typeof data]) {
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message,
							path: [key],
						});
					}
				}
			}

			// Shipping address validation - only required if delivery method is SHIP
			const requireShippingAddress =
				data.deliveryMethod === DeliveryMethods.SHIP;

			if (requireShippingAddress) {
				// Basic shipping fields required for all countries
				const shippingFields = [
					{ key: "shippingFirstName", message: t.validation.enterFirstName },
					{ key: "shippingLastName", message: t.validation.enterLastName },
					{ key: "shippingAddressLine1", message: t.validation.enterAddress },
					{ key: "shippingAdminArea2", message: t.validation.enterCity },
					{
						key: "shippingPostalCode",
						message: t.validation.enterZipPostalCode,
					},
					{ key: "shippingCountryCode", message: t.validation.enterCountry },
				];

				if (hasRegionData(String(data.shippingCountryCode))) {
					shippingFields.push({
						key: "shippingAdminArea1",
						message: t.validation.selectState,
					});
				}

				for (const { key, message } of shippingFields) {
					if (!data[key as keyof typeof data]) {
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message,
							path: [key],
						});
					}
				}
			}
		});
	}, [checkoutFormSchema, t]);
	// }, [checkoutFormSchema, session?.paymentMethods]);

	const requiredFields = React.useMemo(() => {
		return getRequiredFieldsFromSchema(formSchema);
	}, [formSchema]);

	return (
		<TrackingProvider
			session={session}
			trackingEnabled={enableTracking && !!session?.id}
			trackingProperties={trackingProperties}
		>
			<checkoutContext.Provider
				value={{
					elements: props?.appearance?.elements,
					targets: props?.targets,
					isCheckoutDisabled,
					session,
					stripeConfig,
					godaddyPaymentsConfig,
					squareConfig,
					paypalConfig,
					requiredFields,
					isConfirmingCheckout,
					setIsConfirmingCheckout,
					checkoutErrors,
					setCheckoutErrors,
				}}
			>
				<CheckoutFormContainer
					{...props}
					schema={formSchema}
					direction={props.direction}
				/>
			</checkoutContext.Provider>
		</TrackingProvider>
	);
}
