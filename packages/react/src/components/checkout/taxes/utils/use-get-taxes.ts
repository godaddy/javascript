import { useCheckoutContext } from "@/components/checkout/checkout";
import { getDraftOrderTaxes } from "@/lib/godaddy/godaddy";
import type { GetCheckoutSessionTaxesInput } from "@/types";
import { useMutation } from "@tanstack/react-query";

export function useGetTaxes() {
	const { session } = useCheckoutContext();

	return useMutation({
		mutationKey: ["get-taxes-without-order", { sessionId: session?.id }],
		mutationFn: async ({
			destination,
			lines,
		}: {
			destination?: GetCheckoutSessionTaxesInput["destination"];
			lines?: GetCheckoutSessionTaxesInput["lines"];
		}) => {
			if (!session) return;

			const data = await getDraftOrderTaxes(session, { destination, lines });

			return data.checkoutSession?.draftOrder?.calculatedTaxes?.totalTaxAmount;
		},
	});
}
