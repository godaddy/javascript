import { useCheckoutContext } from "@/components/checkout/checkout";
import { useGetPoyntCollectCdn } from "@/components/checkout/payment/utils/use-poynt-collect-cdn";
import { useEffect, useState } from "react";

let isPoyntLoaded = false;
let isPoyntCDNLoaded = false;
const listeners = new Set<(loaded: boolean) => void>();

// load collect.js globally so it can be used for card component and Apple/G Pay buttons
export function useLoadPoyntCollect() {
	const { godaddyPaymentsConfig, session } = useCheckoutContext();
	const collectCDN = useGetPoyntCollectCdn();
	const [loaded, setLoaded] = useState(isPoyntLoaded);

	useEffect(() => {
		// Register this component to be notified when Poynt loads
		const updateLoaded = (newLoaded: boolean) => setLoaded(newLoaded);
		listeners.add(updateLoaded);

		// If already loaded, update immediately
		if (isPoyntLoaded) {
			setLoaded(true);
		}

		return () => {
			listeners.delete(updateLoaded);
		};
	}, []);

	useEffect(() => {
		if (
			isPoyntCDNLoaded ||
			isPoyntLoaded ||
			!godaddyPaymentsConfig ||
			!collectCDN
		) {
			return;
		}

		if (session?.environment !== "prod") {
			console.log("[poynt collect] - load from CDN", {
				isPoyntLoaded,
			});
		}

		isPoyntCDNLoaded = true;
		const script = document.createElement("script");
		script.src = collectCDN;
		script.async = true;
		script.onload = () => {
			isPoyntLoaded = true;
			if (session?.environment !== "prod") {
				console.log("[poynt collect] - loaded from CDN", {
					isPoyntLoaded,
				});
			}
			// Notify all components that Poynt has loaded
			// biome-ignore lint/complexity/noForEach: Set iteration needs forEach for compatibility
			listeners.forEach((listener) => listener(true));
		};

		document?.body?.appendChild(script);
		//
		// return () => {
		// 	document?.body?.removeChild(script);
		// };
	}, [godaddyPaymentsConfig, collectCDN, session?.environment]);

	return { isPoyntLoaded: loaded };
}
