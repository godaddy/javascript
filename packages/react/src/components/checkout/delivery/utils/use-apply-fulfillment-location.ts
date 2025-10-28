import { useCheckoutContext } from "@/components/checkout/checkout";
import { useUpdateTaxes } from "@/components/checkout/order/use-update-taxes";
import { applyFulfillmentLocation } from "@/lib/godaddy/godaddy";
import type { ApplyCheckoutSessionFulfillmentLocationInput } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useApplyFulfillmentLocation() {
	const { session } = useCheckoutContext();
	const updateTaxes = useUpdateTaxes();
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["apply-fulfillment-location", { sessionId: session?.id }],
		mutationFn: async ({
			fulfillmentLocationId,
		}: {
			fulfillmentLocationId: ApplyCheckoutSessionFulfillmentLocationInput["input"]["fulfillmentLocationId"];
			locationAddress?: {
				addressLine1?: string | null;
				addressLine2?: string | null;
				addressLine3?: string | null;
				adminArea1?: string | null;
				adminArea2?: string | null;
				adminArea3?: string | null;
				countryCode?: string | null;
				postalCode?: string | null;
			};
		}) => {
			// Don't process empty string or undefined location IDs
			if (!session || !fulfillmentLocationId) return;

			return await applyFulfillmentLocation({ fulfillmentLocationId }, session);
		},
		onSuccess: (_data, { locationAddress }) => {
			if (!session) return;

			if (session?.enableTaxCollection && locationAddress) {
				updateTaxes.mutate(locationAddress);
			} else {
				queryClient.invalidateQueries({
					queryKey: ["draft-order", { id: session?.id }],
				});
			}
		},
		onError: (error, { locationAddress }) => {
			// Graceful degradation: still calculate taxes with pickup location address
			// even if fulfillment location API fails
			if (session?.enableTaxCollection && locationAddress) {
				console.log("Calculating taxes despite fulfillment location failure");
				updateTaxes.mutate(locationAddress);
			}
		},
	});
}
