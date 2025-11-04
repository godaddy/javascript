import { useMutation } from "@tanstack/react-query";

import { useCheckoutContext } from "@/components/checkout/checkout";
import { useGoDaddyContext } from "@/godaddy-provider";
import { getDraftOrderPriceAdjustments } from "@/lib/godaddy/godaddy";
import type { DraftOrderPriceAdjustmentsQueryInput } from "@/types";

export function useGetPriceAdjustments() {
	const { session, jwt } = useCheckoutContext();
	const { apiHost } = useGoDaddyContext();

	return useMutation({
		mutationKey: session?.id
			? ["get-price-adjustments-by-discount-code", session.id]
			: ["get-price-adjustments-by-discount-code"],
		mutationFn: async ({
			discountCodes,
			shippingLines,
		}: {
			discountCodes: DraftOrderPriceAdjustmentsQueryInput["discountCodes"];
			shippingLines?: DraftOrderPriceAdjustmentsQueryInput["shippingLines"];
		}) => {
			if (!session) return;

			const data = await getDraftOrderPriceAdjustments(
				{ accessToken: jwt },
				discountCodes,
				shippingLines,
				apiHost,
			);

			return data.checkoutSession?.draftOrder?.calculatedAdjustments
				?.totalDiscountAmount?.value;
		},
	});
}
