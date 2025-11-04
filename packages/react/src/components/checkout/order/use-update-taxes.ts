import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCheckoutContext } from "@/components/checkout/checkout";
import { useGoDaddyContext } from "@/godaddy-provider";
import type { ResultOf } from "@/gql.tada";
import { updateDraftOrderTaxes } from "@/lib/godaddy/godaddy";
import type { DraftOrderQuery } from "@/lib/godaddy/queries";

export function useUpdateTaxes() {
	const { session, jwt } = useCheckoutContext();
	const { apiHost } = useGoDaddyContext();
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: session?.id
			? ["update-draft-order-taxes", session.id]
			: ["update-draft-order-taxes"],
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
			const data = jwt
				? await updateDraftOrderTaxes(
						{ accessToken: jwt },
						destination,
						apiHost,
					)
				: await updateDraftOrderTaxes(session, destination, apiHost);
			return data;
		},
		onSuccess: (data) => {
			if (!session) return;

			// Extract shippingTotal from mutation response
			const taxesTotal = data?.calculateCheckoutSessionTaxes?.totalTaxAmount;

			// Update the cached draft-order query (includes totals)
			if (taxesTotal) {
				queryClient.setQueryData(
					["draft-order", session.id],
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
			if (!session) return;
			queryClient.invalidateQueries({
				queryKey: ["draft-order", session.id],
			});
		},
	});
}
