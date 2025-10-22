"use server";

import { graphqlRequestWithErrors } from "@/lib/graphql-with-errors";
import type {
	ApplyCheckoutSessionDeliveryMethodInput,
	ApplyCheckoutSessionDiscountInput,
	ApplyCheckoutSessionFulfillmentLocationInput,
	ApplyCheckoutSessionShippingMethodInput,
	CheckoutSession,
	CheckoutSessionInput,
	ConfirmCheckoutMutationInput,
	DraftOrderPriceAdjustmentsQueryInput,
	Environments,
	GetCheckoutSessionShippingRatesInput,
	GetCheckoutSessionTaxesInput,
	RemoveAppliedCheckoutSessionShippingMethodInput,
	UpdateDraftOrderInput,
} from "@/types";
import type { ResultOf } from "gql.tada";
import {
	ApplyCheckoutSessionDeliveryMethodMutation,
	ApplyCheckoutSessionDiscountMutation,
	ApplyCheckoutSessionFulfillmentLocationMutation,
	ApplyCheckoutSessionShippingMethodMutation,
	CalculateCheckoutSessionTaxesMutation,
	ConfirmCheckoutSessionMutation,
	CreateCheckoutSessionMutation,
	RemoveAppliedCheckoutSessionShippingMethodMutation,
	UpdateCheckoutSessionDraftOrderMutation,
	VerifyCheckoutSessionAddressMutation,
} from "./mutations";
import {
	AddressMatchesQuery,
	DraftOrderPriceAdjustmentsQuery,
	DraftOrderQuery,
	DraftOrderShippingQuery,
	DraftOrderShippingRatesQuery,
	DraftOrderSkusQuery,
	DraftOrderTaxesQuery,
	DraftOrderTotalsQuery,
} from "./queries";

function getHostByEnvironment(): string {
	return process.env.HOST || "https://checkout.commerce.api.godaddy.com";
}

export async function createCheckoutSession(
	input: CheckoutSessionInput["input"],
	{ accessToken }: { accessToken: string; environment: Environments },
): Promise<
	ResultOf<typeof CreateCheckoutSessionMutation>["createCheckoutSession"]
> {
	if (!accessToken) {
		throw new Error("No public access token provided");
	}

	const GODADDY_HOST = getHostByEnvironment();

	try {
		const response = await graphqlRequestWithErrors<
			ResultOf<typeof CreateCheckoutSessionMutation>
		>(
			GODADDY_HOST,
			CreateCheckoutSessionMutation,
			{ input },
			{ Authorization: `Bearer ${accessToken}` },
		);

		return response.createCheckoutSession;
	} catch (error) {
		console.error("Error creating checkout session:", error);
		throw error;
	}
}

export async function getAddressMatches(
	input: { query: string },
	session: CheckoutSession | undefined,
) {
	if (!session?.token || !session?.id) {
		throw new Error("No session token or ID provided");
	}

	const GODADDY_HOST = getHostByEnvironment();

	return graphqlRequestWithErrors<ResultOf<typeof AddressMatchesQuery>>(
		GODADDY_HOST,
		AddressMatchesQuery,
		input,
		{
			"x-session-token": `${session.token}`,
			"x-session-id": session.id,
			"x-store-id": session.storeId,
		},
	);
}

export function getDraftOrder(session: CheckoutSession | undefined) {
	if (!session?.token || !session?.id) {
		throw new Error("No session token or ID provided");
	}

	const GODADDY_HOST = getHostByEnvironment();

	return graphqlRequestWithErrors<ResultOf<typeof DraftOrderQuery>>(
		GODADDY_HOST,
		DraftOrderQuery,
		undefined,
		{
			"x-session-token": `${session.token}`,
			"x-session-id": session.id,
			"x-store-id": session.storeId,
		},
	);
}

export function getDraftOrderTotals(session: CheckoutSession | undefined) {
	if (!session?.token || !session?.id) {
		throw new Error("No session token or ID provided");
	}
	const GODADDY_HOST = getHostByEnvironment();

	return graphqlRequestWithErrors<ResultOf<typeof DraftOrderTotalsQuery>>(
		GODADDY_HOST,
		DraftOrderTotalsQuery,
		undefined,
		{
			"x-session-token": `${session.token}`,
			"x-session-id": session.id,
			"x-store-id": session.storeId,
		},
	);
}

export function getDraftOrderShipping(session: CheckoutSession | undefined) {
	if (!session?.token || !session?.id) {
		throw new Error("No session token or ID provided");
	}
	const GODADDY_HOST = getHostByEnvironment();

	return graphqlRequestWithErrors<ResultOf<typeof DraftOrderShippingQuery>>(
		GODADDY_HOST,
		DraftOrderShippingQuery,
		undefined,
		{
			"x-session-token": `${session.token}`,
			"x-session-id": session.id,
			"x-store-id": session.storeId,
		},
	);
}

export function getDraftOrderTaxes(
	session: CheckoutSession | undefined,
	{
		destination,
		lines,
	}: {
		destination?: GetCheckoutSessionTaxesInput["destination"];
		lines?: GetCheckoutSessionTaxesInput["lines"];
	},
) {
	if (!session?.token || !session?.id) {
		throw new Error("No session token or ID provided");
	}
	const GODADDY_HOST = getHostByEnvironment();

	return graphqlRequestWithErrors<ResultOf<typeof DraftOrderTaxesQuery>>(
		GODADDY_HOST,
		DraftOrderTaxesQuery,
		{ destination, lines },
		{
			"x-session-token": `${session.token}`,
			"x-session-id": session.id,
			"x-store-id": session.storeId,
		},
	);
}

export async function verifyAddress(
	input: {
		addressLine1: string;
		addressLine2: string;
		addressLine3: string;
		postalCode: string;
		countryCode: string;
		adminArea1?: string;
		adminArea2?: string;
		adminArea3?: string;
		adminArea4?: string;
	},
	session: CheckoutSession | undefined,
) {
	if (!session?.token || !session?.id) {
		throw new Error("No public access token provided");
	}
	const GODADDY_HOST = getHostByEnvironment();

	return graphqlRequestWithErrors<
		ResultOf<typeof VerifyCheckoutSessionAddressMutation>
	>(
		GODADDY_HOST,
		VerifyCheckoutSessionAddressMutation,
		{ input: { ...input, adminArea2: input.adminArea3 } },
		{
			"x-session-token": `${session.token}`,
			"x-session-id": session.id,
			"x-store-id": session.storeId,
		},
	);
}

export async function updateDraftOrder(
	input: UpdateDraftOrderInput["input"],
	session: CheckoutSession | undefined,
) {
	if (!session?.token || !session?.id) {
		throw new Error("No public access token provided");
	}
	const GODADDY_HOST = getHostByEnvironment();

	return graphqlRequestWithErrors<
		ResultOf<typeof UpdateCheckoutSessionDraftOrderMutation>
	>(
		GODADDY_HOST,
		UpdateCheckoutSessionDraftOrderMutation,
		{ input },
		{
			"x-session-token": `${session.token}`,
			"x-session-id": session.id,
			"x-store-id": session.storeId,
		},
	);
}

export async function getProductsFromOrderSkus(
	session: CheckoutSession | undefined,
) {
	if (!session?.token || !session?.id) {
		throw new Error("No session token or ID provided");
	}
	const GODADDY_HOST = getHostByEnvironment();

	return graphqlRequestWithErrors<ResultOf<typeof DraftOrderSkusQuery>>(
		GODADDY_HOST,
		DraftOrderSkusQuery,
		undefined,
		{
			"x-session-token": `${session.token}`,
			"x-session-id": session.id,
			"x-store-id": session.storeId,
		},
	);
}

export function updateDraftOrderTaxes(
	session: CheckoutSession | undefined,
	destination?: {
		addressLine1?: string | null;
		addressLine2?: string | null;
		addressLine3?: string | null;
		adminArea1?: string | null;
		adminArea2?: string | null;
		adminArea3?: string | null;
		countryCode?: string | null;
		postalCode?: string | null;
	},
) {
	if (!session?.token || !session?.id) {
		throw new Error("No session token or ID provided");
	}
	const GODADDY_HOST = getHostByEnvironment();

	return graphqlRequestWithErrors<
		ResultOf<typeof CalculateCheckoutSessionTaxesMutation>
	>(
		GODADDY_HOST,
		CalculateCheckoutSessionTaxesMutation,
		{ destination },
		{
			"x-session-token": `${session.token}`,
			"x-session-id": session.id,
			"x-store-id": session.storeId,
		},
	);
}

export function applyDiscount(
	discountCodes: ApplyCheckoutSessionDiscountInput["input"]["discountCodes"],
	session: CheckoutSession | undefined,
) {
	if (!session?.token || !session?.id) {
		throw new Error("No session token or ID provided");
	}
	const GODADDY_HOST = getHostByEnvironment();

	return graphqlRequestWithErrors<
		ResultOf<typeof ApplyCheckoutSessionDiscountMutation>
	>(
		GODADDY_HOST,
		ApplyCheckoutSessionDiscountMutation,
		{ input: { discountCodes }, sessionId: session.id },
		{
			"x-session-token": `${session.token}`,
			"x-session-id": session.id,
			"x-store-id": session.storeId,
		},
	);
}

export function applyShippingMethod(
	shippingMethods: ApplyCheckoutSessionShippingMethodInput["input"],
	session: CheckoutSession | undefined,
) {
	if (!session?.token || !session?.id) {
		throw new Error("No session token or ID provided");
	}
	const GODADDY_HOST = getHostByEnvironment();

	return graphqlRequestWithErrors<
		ResultOf<typeof ApplyCheckoutSessionShippingMethodMutation>
	>(
		GODADDY_HOST,
		ApplyCheckoutSessionShippingMethodMutation,
		{ input: [...shippingMethods] },
		{
			"x-session-token": `${session.token}`,
			"x-session-id": session.id,
			"x-store-id": session.storeId,
		},
	);
}

export function removeShippingMethod(
	shippingMethod: RemoveAppliedCheckoutSessionShippingMethodInput["input"]["name"],
	session: CheckoutSession | undefined,
): Promise<
	ResultOf<typeof RemoveAppliedCheckoutSessionShippingMethodMutation>
> {
	if (!session?.token || !session?.id) {
		throw new Error("No session token or ID provided");
	}
	const GODADDY_HOST = getHostByEnvironment();

	return graphqlRequestWithErrors<
		ResultOf<typeof RemoveAppliedCheckoutSessionShippingMethodMutation>
	>(
		GODADDY_HOST,
		RemoveAppliedCheckoutSessionShippingMethodMutation,
		{ input: { name: shippingMethod } },
		{
			"x-session-token": `${session.token}`,
			"x-session-id": session.id,
			"x-store-id": session.storeId,
		},
	);
}

export function confirmCheckout(
	input: ConfirmCheckoutMutationInput["input"],
	session: CheckoutSession | undefined,
) {
	if (!session?.token || !session?.id) {
		throw new Error("No session token or ID provided");
	}
	const GODADDY_HOST = getHostByEnvironment();

	return graphqlRequestWithErrors<
		ResultOf<typeof ConfirmCheckoutSessionMutation>
	>(
		GODADDY_HOST,
		ConfirmCheckoutSessionMutation,
		{ input, sessionId: session.id },
		{
			"x-session-token": `${session.token}`,
			"x-session-id": session.id,
			"x-store-id": session.storeId,
		},
	);
}

export function getDraftOrderShippingMethods(
	session: CheckoutSession | undefined,
	destination?: GetCheckoutSessionShippingRatesInput["destination"],
) {
	if (!session?.token || !session?.id) {
		throw new Error("No session token or ID provided");
	}

	const GODADDY_HOST = getHostByEnvironment();

	return graphqlRequestWithErrors<
		ResultOf<typeof DraftOrderShippingRatesQuery>
	>(
		GODADDY_HOST,
		DraftOrderShippingRatesQuery,
		{ destination },
		{
			"x-session-token": `${session.token}`,
			"x-session-id": session.id,
			"x-store-id": session.storeId,
		},
	);
}

export function applyDeliveryMethod(
	input: ApplyCheckoutSessionDeliveryMethodInput["input"],
	session: CheckoutSession | undefined,
) {
	if (!session?.token || !session?.id) {
		throw new Error("No session token or ID provided");
	}
	const GODADDY_HOST = getHostByEnvironment();

	return graphqlRequestWithErrors<
		ResultOf<typeof ApplyCheckoutSessionDeliveryMethodMutation>
	>(
		GODADDY_HOST,
		ApplyCheckoutSessionDeliveryMethodMutation,
		{ input },
		{
			"x-session-token": `${session.token}`,
			"x-session-id": session.id,
			"x-store-id": session.storeId,
		},
	);
}

export function getDraftOrderPriceAdjustments(
	session: CheckoutSession | undefined,
	discountCodes?: DraftOrderPriceAdjustmentsQueryInput["discountCodes"],
	shippingLines?: DraftOrderPriceAdjustmentsQueryInput["shippingLines"],
) {
	if (!session?.token || !session?.id) {
		throw new Error("No session token or ID provided");
	}

	const GODADDY_HOST = getHostByEnvironment();

	return graphqlRequestWithErrors<
		ResultOf<typeof DraftOrderPriceAdjustmentsQuery>
	>(
		GODADDY_HOST,
		DraftOrderPriceAdjustmentsQuery,
		{ shippingLines, discountCodes },
		{
			"x-session-token": `${session.token}`,
			"x-session-id": session.id,
			"x-store-id": session.storeId,
		},
	);
}

export function applyFulfillmentLocation(
	input: ApplyCheckoutSessionFulfillmentLocationInput["input"],
	session: CheckoutSession | undefined,
) {
	if (!session?.token || !session?.id) {
		throw new Error("No session token or ID provided");
	}
	const GODADDY_HOST = getHostByEnvironment();

	return graphqlRequestWithErrors<
		ResultOf<typeof ApplyCheckoutSessionFulfillmentLocationMutation>
	>(
		GODADDY_HOST,
		ApplyCheckoutSessionFulfillmentLocationMutation,
		{ input },
		{
			"x-session-token": `${session.token}`,
			"x-session-id": session.id,
			"x-store-id": session.storeId,
		},
	);
}
