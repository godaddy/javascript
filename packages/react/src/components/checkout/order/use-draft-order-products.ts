import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useCheckoutContext } from "@/components/checkout/checkout";
import { useGoDaddyContext } from "@/godaddy-provider";
import { getProductsFromOrderSkus } from "@/lib/godaddy/godaddy";
import type { SKUProduct } from "@/types";

/**
 * Hook to fetch products from SKUs in the draft order
 * @returns Query result with SKU product data
 */
export function useDraftOrderProducts() {
	const { session, jwt } = useCheckoutContext();
	const { apiHost } = useGoDaddyContext();

	return useQuery({
		queryKey: session?.id
			? ["draft-order-products", session.id]
			: ["draft-order-products"],
		queryFn: () => getProductsFromOrderSkus({ accessToken: jwt }, apiHost),
		enabled: !!session?.id,
		select: (data) => data.checkoutSession?.skus?.edges,
	});
}

/**
 * Hook to get products from SKUs in the draft order as a map for easy lookup
 * @returns Map of SKU ID to SKU product data
 */
export function useDraftOrderProductsMap() {
	const { data: skus } = useDraftOrderProducts();

	return useMemo(() => {
		if (!skus) return {};

		const result: Record<string, SKUProduct> = {};

		for (const edge of skus) {
			if (edge?.node?.code) {
				result[edge.node.code] = edge.node;
			}
		}

		return result;
	}, [skus]);
}
