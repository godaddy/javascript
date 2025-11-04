import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCheckoutContext } from "@/components/checkout/checkout";
import { useUpdateTaxes } from "@/components/checkout/order/use-update-taxes";
import { useGoDaddyContext } from "@/godaddy-provider";
import { updateDraftOrder } from "@/lib/godaddy/godaddy";
import type { UpdateDraftOrderInput } from "@/types";

export function useUpdateOrder() {
	const { session, jwt } = useCheckoutContext();
	const { apiHost } = useGoDaddyContext();
	const updateTaxes = useUpdateTaxes();
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["update-draft-order"],
		mutationFn: async ({
			input,
		}: {
			input: UpdateDraftOrderInput["input"];
		}) => {
			return await updateDraftOrder(input, { accessToken: jwt }, apiHost);
		},
		onSuccess: (_data, { input }) => {
			if (!session) return;

			/* Refetch taxes and shipping methods on address changes */
			if (
				input.shipping?.address ||
				(!input.shipping?.address && input.billing?.address)
			) {
				if (session?.enableTaxCollection) {
					updateTaxes.mutate(undefined);
				} else {
					queryClient.invalidateQueries({
						queryKey: ["draft-order", session.id],
					});
				}
			} else {
				queryClient.invalidateQueries({
					queryKey: ["draft-order", session.id],
				});
			}
		},
	});
}
