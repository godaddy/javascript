import { useCheckoutContext } from "@/components/checkout/checkout";
import { useDiscountApply } from "@/components/checkout/discount";
import { useDraftOrder } from "@/components/checkout/order/use-draft-order";
import { removeShippingMethod } from "@/lib/godaddy/godaddy";
import type { DraftOrderTotalsQuery } from "@/lib/godaddy/queries";
import type { RemoveAppliedCheckoutSessionShippingMethodInput } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ResultOf } from "gql.tada";

export function useRemoveShippingMethod() {
	const { session } = useCheckoutContext();
	const queryClient = useQueryClient();
	const { data: order } = useDraftOrder();
	const applyDiscount = useDiscountApply();

	return useMutation({
		mutationKey: ["remove-shipping-method", { sessionId: session?.id }],
		mutationFn: async (
			shippingMethod: RemoveAppliedCheckoutSessionShippingMethodInput["input"]["name"],
		) => {
			if (!session) return;
			return await removeShippingMethod(shippingMethod, session);
		},
		onSuccess: async (data) => {
			if (!session) return;

			// Extract shippingTotal from mutation response
			const shippingTotal =
				data?.removeAppliedCheckoutSessionShippingMethod?.draftOrder?.totals
					?.shippingTotal;

			// Update the cached draft-order-totals query
			if (shippingTotal) {
				queryClient.setQueryData(
					["draft-order-totals", { id: session.id }],
					(old: ResultOf<typeof DraftOrderTotalsQuery> | undefined) => {
						if (!old) return old;
						return {
							...old,
							checkoutSession: {
								...old.checkoutSession,
								draftOrder: {
									...old?.checkoutSession?.draftOrder,
									totals: {
										...old?.checkoutSession?.draftOrder?.totals,
										shippingTotal: {
											...shippingTotal,
										},
									},
								},
							},
						};
					},
				);
			}

			const discountCodes = order?.discounts
				?.map((discount) => discount.code)
				.filter((code): code is string => !!code);

			if (session?.enablePromotionCodes && discountCodes?.length) {
				/* should re-apply discounts if they were previously applied */
				await applyDiscount.mutateAsync({
					discountCodes,
				});
			}
		},
	});
}
