import { useCheckoutContext } from "@/components/checkout/checkout";
import { useGetPoyntCollectCdn } from "@/components/checkout/payment/utils/use-poynt-collect-cdn";
import { useEffect, useRef, useState } from "react";

// load collect.js globally so it can be used for card component and Apple/G Pay buttons
export function useLoadPoyntCollect() {
	const { godaddyPaymentsConfig } = useCheckoutContext();
	const collectCDN = useGetPoyntCollectCdn();
	const loadOnce = useRef<boolean>(false);
	const [isLoaded, setIsLoaded] = useState<boolean>(false);

	useEffect(() => {
		if (loadOnce.current || !godaddyPaymentsConfig || !collectCDN) {
			return;
		}

		loadOnce.current = true;
		const script = document.createElement("script");
		script.src = collectCDN;
		script.async = true;
		script.onload = () => {
			setIsLoaded(true);
		};

		document?.body?.appendChild(script);

		return () => {
			document?.body?.removeChild(script);
		};
	}, [godaddyPaymentsConfig, collectCDN]);

	return { isPoyntLoaded: isLoaded };
}
