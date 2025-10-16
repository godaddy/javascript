import type { DraftOrderPriceAdjustmentsQueryInput } from "@/types";

import { useCheckoutContext } from "@/components/checkout/checkout";
import { getDraftOrderPriceAdjustments } from "@/lib/godaddy/godaddy";
import { useMutation } from "@tanstack/react-query";

export function useGetPriceAdjustments() {
	const { session } = useCheckoutContext();

	return useMutation({
		mutationKey: [
			"get-price-adjustments-by-discount-code",
			{ sessionId: session?.id },
		],
		mutationFn: async ({
			discountCodes,
			shippingLines,
		}: {
			discountCodes: DraftOrderPriceAdjustmentsQueryInput["discountCodes"];
			shippingLines?: DraftOrderPriceAdjustmentsQueryInput["shippingLines"];
		}) => {
			if (!session) return;

			const data = await getDraftOrderPriceAdjustments(
				session,
				discountCodes,
				shippingLines,
			);

			return data.checkoutSession?.draftOrder?.calculatedAdjustments
				?.totalDiscountAmount?.value;
		},
	});
}
