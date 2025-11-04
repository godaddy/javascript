import { useMutation } from "@tanstack/react-query";
import { useCheckoutContext } from "@/components/checkout/checkout";
import { useGoDaddyContext } from "@/godaddy-provider";
import { getDraftOrderTaxes } from "@/lib/godaddy/godaddy";
import type { GetCheckoutSessionTaxesInput } from "@/types";

export function useGetTaxes() {
	const { session, jwt } = useCheckoutContext();
	const { apiHost } = useGoDaddyContext();

	return useMutation({
		mutationKey: session?.id
			? ["get-taxes-without-order", session.id]
			: ["get-taxes-without-order"],
		mutationFn: async ({
			destination,
			lines,
		}: {
			destination?: GetCheckoutSessionTaxesInput["destination"];
			lines?: GetCheckoutSessionTaxesInput["lines"];
		}) => {
			if (!session) return;

			const data = await getDraftOrderTaxes(
				{ accessToken: jwt },
				{ destination, lines },
				apiHost,
			);

			return data.checkoutSession?.draftOrder?.calculatedTaxes?.totalTaxAmount;
		},
	});
}
