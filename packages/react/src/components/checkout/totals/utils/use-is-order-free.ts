import { useDraftOrderTotals } from "@/components/checkout/order/use-draft-order-totals";

export function useCheckIsOrderFree() {
	const { data: totals, isLoading } = useDraftOrderTotals();

	/* TODO: Will need logic for handling tips */
	return {
		isFree: totals?.total?.value === 0,
		isLoading,
	};
}
