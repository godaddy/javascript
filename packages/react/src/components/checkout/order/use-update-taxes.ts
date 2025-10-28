import { useCheckoutContext } from "@/components/checkout/checkout";
import { updateDraftOrderTaxes } from "@/lib/godaddy/godaddy";
import type { DraftOrderQuery } from "@/lib/godaddy/queries";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ResultOf } from "gql.tada";

export function useUpdateTaxes() {
	const { session } = useCheckoutContext();
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["update-draft-order-taxes", { id: session?.id }],
		mutationFn: async (destination?: {
			addressLine1?: string | null;
			addressLine2?: string | null;
			addressLine3?: string | null;
			adminArea1?: string | null;
			adminArea2?: string | null;
			adminArea3?: string | null;
			countryCode?: string | null;
			postalCode?: string | null;
		}) => {
			return await updateDraftOrderTaxes(session, destination);
		},
		onSuccess: (data) => {
			if (!session) return;

			// Extract shippingTotal from mutation response
			const taxesTotal = data?.calculateCheckoutSessionTaxes?.totalTaxAmount;

			// Update the cached draft-order query (includes totals)
			if (taxesTotal) {
				queryClient.setQueryData(
					["draft-order", { id: session.id }],
					(old: ResultOf<typeof DraftOrderQuery> | undefined) => {
						if (!old) return old;
						return {
							...old,
							checkoutSession: {
								...old.checkoutSession,
								draftOrder: {
									...old?.checkoutSession?.draftOrder,
									totals: {
										...old?.checkoutSession?.draftOrder?.totals,
										taxesTotal: {
											...taxesTotal,
										},
									},
								},
							},
						};
					},
				);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: ["draft-order", { id: session?.id }],
			});
		},
	});
}
