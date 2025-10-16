import { useCheckoutContext } from "@/components/checkout/checkout";
import { DeliveryMethods } from "@/components/checkout/delivery/delivery-method";
import { useUpdateTaxes } from "@/components/checkout/order/use-update-taxes";
import { applyDiscount } from "@/lib/godaddy/godaddy";
import type { ApplyCheckoutSessionDiscountInput } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFormContext } from "react-hook-form";

export function useDiscountApply() {
	const { session } = useCheckoutContext();
	const form = useFormContext();
	const queryClient = useQueryClient();
	const updateTaxes = useUpdateTaxes();

	return useMutation({
		mutationKey: ["apply-discount", { sessionId: session?.id }],
		mutationFn: async ({
			discountCodes,
		}: {
			discountCodes: ApplyCheckoutSessionDiscountInput["input"]["discountCodes"];
		}) => {
			if (!session) return;
			return await applyDiscount(discountCodes, session);
		},
		onSuccess: () => {
			if (!session) return;

			if (session?.enableTaxCollection) {
				// If the delivery method is pickup, we need to update taxes based on the pickup location
				// Otherwise, we can just update taxes without a specific address
				// TODO: Move this to API layer
				const deliveryMethod = form.getValues("deliveryMethod");
				const isPickup = deliveryMethod === DeliveryMethods.PICKUP;

				if (isPickup) {
					const pickupLocationId = form.getValues("pickupLocationId");
					const locationAddress = session?.locations?.find(
						(loc) => loc.id === pickupLocationId,
					)?.address;

					if (locationAddress) {
						updateTaxes.mutate(locationAddress);
					}
				} else {
					updateTaxes.mutate(undefined);
				}
			} else {
				queryClient.invalidateQueries({
					queryKey: ["draft-order-totals", { id: session?.id }],
				});
			}

			queryClient.invalidateQueries({
				queryKey: ["draft-order", { id: session?.id }],
			});
		},
	});
}
