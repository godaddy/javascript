import { useCheckoutContext } from "@/components/checkout/checkout";
import { useDiscountApply } from "@/components/checkout/discount";
import { useDraftOrder } from "@/components/checkout/order/use-draft-order";
import { useUpdateTaxes } from "@/components/checkout/order/use-update-taxes";
import { applyShippingMethod } from "@/lib/godaddy/godaddy";
import type { DraftOrderTotalsQuery } from "@/lib/godaddy/queries";
import type { ApplyCheckoutSessionShippingMethodInput } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ResultOf } from "gql.tada";

export function useApplyShippingMethod() {
	const { session } = useCheckoutContext();
	const { data: order } = useDraftOrder();
	const updateTaxes = useUpdateTaxes();
	const applyDiscount = useDiscountApply();
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["apply-shipping-method", { sessionId: session?.id }],
		mutationFn: async (
			shippingMethods: ApplyCheckoutSessionShippingMethodInput["input"],
		) => {
			if (!session) return;
			return await applyShippingMethod(shippingMethods, session);
		},
		onSuccess: async (data) => {
			if (!session) return;

			// Extract shippingTotal from mutation response
			const shippingTotal =
				data?.applyCheckoutSessionShippingMethod?.draftOrder?.totals
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

			if (session?.enableTaxCollection) {
				updateTaxes.mutate(undefined);
			} else {
				queryClient.invalidateQueries({
					queryKey: ["draft-order-totals", { id: session?.id }],
				});
				queryClient.invalidateQueries({
					queryKey: ["draft-order", { id: session?.id }],
				});
			}
		},
	});
}
