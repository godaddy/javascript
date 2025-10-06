import { useCheckoutContext } from "@/components/checkout/checkout";
import { useMemo } from "react";

export const useGetPoyntCollectCdn = () => {
	const { session } = useCheckoutContext();
	const environment = session?.environment;

	return useMemo(() => {
		switch (environment) {
			case "prod":
				return "https://cdn.poynt.net/collect.js";
			case "test":
				return "https://cdn.poynt.net/test/collect-test.js";
			case "dev":
				return "https://cdn.poynt.net/ci/collect-ci.js";
			default:
				return "https://cdn.poynt.net/ci/collect-ci.js";
		}
	}, [environment]);
};
