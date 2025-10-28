import { useCheckoutContext } from "@/components/checkout/checkout";
import { useUpdateTaxes } from "@/components/checkout/order/use-update-taxes";
import { updateDraftOrder } from "@/lib/godaddy/godaddy";
import type { UpdateDraftOrderInput } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useUpdateOrder() {
	const { session } = useCheckoutContext();
	const updateTaxes = useUpdateTaxes();
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["update-draft-order"],
		mutationFn: async ({
			input,
		}: {
			input: UpdateDraftOrderInput["input"];
		}) => {
			return await updateDraftOrder(input, session);
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
						queryKey: ["draft-order", { id: session?.id }],
					});
				}
			} else {
				queryClient.invalidateQueries({
					queryKey: ["draft-order", { id: session?.id }],
				});
			}
		},
	});
}
