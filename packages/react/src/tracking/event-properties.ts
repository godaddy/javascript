import { z } from "zod";
// ts-rest-like contract object

export type EventProperties = z.infer<typeof properties>;
export const properties = z
	.object({
		// Base properties
		draftOrderId: z.string().nullish(),
		storeId: z.string().nullish(),
		channelId: z.string().nullish(),
		deliveryMethod: z.string().nullish(),

		// Pickup related properties
		locationId: z.string().nullish(),
		locationName: z.string().nullish(),
		pickupDate: z.string().nullish(),
		pickupTime: z.string().nullish(),
		dayOfWeek: z.string().nullish(),
		isAsap: z.boolean().nullish(),

		// Discount related properties
		success: z.boolean().nullish(),
		discountCount: z.number().nullish(),
		errorCodes: z.string().nullish(),
		errorType: z.string().nullish(),

		// Shipping related properties
		shippingMethod: z.string().nullish(),
		shippingMethodId: z.string().nullish(),
		shippingCarrier: z.string().nullish(),
		cost: z.number().nullish(),
		currencyCode: z.string().nullish(),

		// Payment related properties
		useShippingAddress: z.boolean().nullish(),
		paymentMethod: z.string().nullish(),
		paymentMethodLabel: z.string().nullish(),
		paymentType: z.string().nullish(),
		provider: z.string().nullish(),

		// Express checkout properties
		availableMethods: z.string().nullish(),
		couponCode: z.string().nullish(),

		// Form error properties
		errorFields: z.string().nullish(),
		errorCount: z.number().nullish(),

		// Address properties
		hasShippingAddress: z.boolean().nullish(),
		hasBillingAddress: z.boolean().nullish(),

		// Notes properties
		hasNotes: z.boolean().nullish(),
		noteLength: z.number().nullish(),

		// Order properties
		subtotal: z.number().nullish(),
		total: z.number().nullish(),
		itemCount: z.number().nullish(),

		// Tips properties
		tipPercentage: z.number().nullish(),
		tipAmount: z.number().nullish(),
		totalBeforeTip: z.number().nullish(),

		// Country and region properties
		sectionKey: z.string().nullish(),
		countryCode: z.string().nullish(),
		countryName: z.string().nullish(),
		regionCode: z.string().nullish(),
		regionName: z.string().nullish(),
		country: z.string().nullish(),

		// Form validation properties
		hasValue: z.boolean().nullish(),
		isValid: z.boolean().nullish(),
	})
	.nullish();
