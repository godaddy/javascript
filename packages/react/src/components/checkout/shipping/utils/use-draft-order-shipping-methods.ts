import { useCheckoutContext } from "@/components/checkout/checkout";
import { useDraftOrderShippingAddress } from "@/components/checkout/order/use-draft-order";
import { getDraftOrderShippingMethods } from "@/lib/godaddy/godaddy";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

/**
 * Hook to fetch available shipping methods for the draft order
 * @returns Query result with shipping rates data
 */
export function useDraftOrderShippingMethods() {
	const { session } = useCheckoutContext();
	const { data: shippingAddress } = useDraftOrderShippingAddress();

	const hasShippingAddress = useMemo(
		() => !!shippingAddress?.addressLine1,
		[shippingAddress?.addressLine1],
	);

	return useQuery({
		queryKey: [
			"draft-order-shipping-methods",
			{
				id: session?.id,
				address: shippingAddress?.addressLine1,
				adminArea1: shippingAddress?.adminArea1,
				adminArea2: shippingAddress?.adminArea2,
				postalCode: shippingAddress?.postalCode,
				countryCode: shippingAddress?.countryCode,
			},
		],
		queryFn: () => getDraftOrderShippingMethods(session),
		enabled: !!session?.id && hasShippingAddress,
		select: (data) =>
			data?.checkoutSession?.draftOrder?.calculatedShippingRates?.rates,
	});
}
