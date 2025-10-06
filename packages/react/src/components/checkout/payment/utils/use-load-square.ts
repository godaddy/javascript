import { useCheckoutContext } from "@/components/checkout/checkout";
import { useEffect, useRef, useState } from "react";

export function useLoadSquare() {
	const { squareConfig, session } = useCheckoutContext();
	const loadOnce = useRef<boolean>(false);
	const [isLoaded, setIsLoaded] = useState<boolean>(false);

	const squareCDN =
		session?.environment === "prod"
			? "https://web.squarecdn.com/v1/square.js"
			: "https://sandbox.web.squarecdn.com/v1/square.js";

	useEffect(() => {
		if (loadOnce.current || !squareConfig) {
			return;
		}

		loadOnce.current = true;
		const script = document.createElement("script");
		script.src = squareCDN;
		script.async = true;
		script.onload = () => {
			setIsLoaded(true);
		};

		document.body.appendChild(script);

		return () => {
			document.body.removeChild(script);
		};
	}, [squareConfig, squareCDN]);

	return { isSquareLoaded: isLoaded };
}
