import { useCheckoutContext } from "@/components/checkout/checkout";
import {
	PaymentProvider,
	useConfirmCheckout,
} from "@/components/checkout/payment/utils/use-confirm-checkout";
import { useLoadPoyntCollect } from "@/components/checkout/payment/utils/use-load-poynt-collect";
import { Skeleton } from "@/components/ui/skeleton";
import { useGoDaddyContext } from "@/godaddy-provider";
import { GraphQLErrorWithCodes } from "@/lib/graphql-with-errors";
import { eventIds } from "@/tracking/events";
import { TrackingEventType, track } from "@/tracking/track";

import { useDraftOrderTotals } from "@/components/checkout/order/use-draft-order-totals";
import type {
	TokenizeJs,
	WalletError,
} from "@/components/checkout/payment/types";
import { useBuildPaymentRequest } from "@/components/checkout/payment/utils/use-build-payment-request";
import { PaymentMethodType } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";

export function PazeCheckoutButton() {
	const { session, setCheckoutErrors } = useCheckoutContext();
	const form = useFormContext();
	const { isPoyntLoaded } = useLoadPoyntCollect();
	const { godaddyPaymentsConfig } = useCheckoutContext();
	const { t } = useGoDaddyContext();
	const [isCollectLoading, setIsCollectLoading] = useState(true);
	const [error, setError] = useState("");
	const { data: totals } = useDraftOrderTotals();
	const { poyntStandardRequest } = useBuildPaymentRequest();

	const currencyCode = totals?.total?.currencyCode || "USD";
	const countryCode = session?.shipping?.originAddress?.countryCode || "US";

	const confirmCheckout = useConfirmCheckout();
	const collect = useRef<TokenizeJs | null>(null);
	const hasMounted = useRef(false);

	const handlePazeClick = useCallback(async () => {
		if (!poyntStandardRequest) return;

		const valid = await form.trigger();
		if (!valid) {
			const firstError = Object.keys(form.formState.errors)[0];
			if (firstError) {
				form.setFocus(firstError);
			}
			return;
		}

		setCheckoutErrors(undefined);

		collect?.current?.startPazeSession(poyntStandardRequest);

		// Track the Paze click
		track({
			eventId: eventIds.pazePayClick,
			type: TrackingEventType.CLICK,
			properties: {
				paymentType: PaymentMethodType.PAZE,
			},
		});
	}, [poyntStandardRequest, setCheckoutErrors, form]);

	// Initialize the TokenizeJs instance when the component mounts
	useEffect(() => {
		if (
			!collect.current &&
			godaddyPaymentsConfig &&
			isPoyntLoaded &&
			isCollectLoading &&
			!hasMounted.current
		) {
			// console.log("[poynt collect] Initializing TokenizeJs instance");
			// biome-ignore lint/suspicious/noExplicitAny: Window can be any
			collect.current = new (window as any).TokenizeJs(
				godaddyPaymentsConfig?.businessId,
				godaddyPaymentsConfig?.appId,
				{
					country: countryCode,
					currency: currencyCode,
					merchantName: session?.storeName || "",
					requireEmail: false,
					requireShippingAddress: false,
					supportCouponCode: false,
				},
			);
		}
	}, [
		godaddyPaymentsConfig,
		countryCode,
		currencyCode,
		session,
		isPoyntLoaded,
		isCollectLoading,
	]);

	// Mount the TokenizeJs instance
	useEffect(() => {
		if (
			!isPoyntLoaded ||
			!godaddyPaymentsConfig ||
			!isCollectLoading ||
			!collect.current ||
			hasMounted.current
		)
			return;

		collect.current?.supportWalletPayments().then((supports) => {
			if (supports.paze && !hasMounted.current) {
				hasMounted.current = true;
				// console.log("[poynt collect] Mounting paze-pay-element");
				collect?.current?.mount("paze-pay-element", document, {
					paymentMethods: ["paze"],
					buttonsContainerOptions: {
						className: "gap-1 !flex-col sm:!flex-row place-items-center",
					},
					buttonOptions: {
						type: "plain",
						margin: "0",
						height: "48px",
						width: "100%",
						justifyContent: "flex-start",
						onClick: handlePazeClick,
					},
				});
			}
		});
	}, [isPoyntLoaded, godaddyPaymentsConfig, isCollectLoading, handlePazeClick]);

	// Set up event listeners for TokenizeJs
	useEffect(() => {
		if (!collect.current || !isPoyntLoaded) return;

		collect.current.on("close_wallet", () => {
			setError("");
		});

		collect.current.on("payment_authorized", async (event) => {
			const nonce = event?.nonce;

			if (nonce) {
				const checkoutBody = {
					paymentToken: nonce,
					paymentType: event?.source,
					paymentProvider: PaymentProvider.POYNT,
				};

				try {
					await confirmCheckout.mutateAsync(checkoutBody);
					event.complete();
				} catch (err: unknown) {
					if (err instanceof GraphQLErrorWithCodes) {
						const walletError: WalletError = {
							code: "invalid_payment_data",
							message:
								t.apiErrors?.[err.codes[0] as keyof typeof t.apiErrors] ||
								t.errors.errorProcessingPayment,
						};

						setCheckoutErrors(err.codes);

						track({
							eventId: eventIds.expressCheckoutError,
							type: TrackingEventType.EVENT,
							properties: {
								paymentType: event.source,
								provider: "poynt",
								errorCodes: err.codes.join(","),
							},
						});

						event.complete({ error: walletError });
					} else {
						track({
							eventId: eventIds.expressCheckoutError,
							type: TrackingEventType.EVENT,
							properties: {
								paymentType: event.source,
								provider: "poynt",
								errorType: "generic",
							},
						});

						const walletError: WalletError = {
							code: "invalid_payment_data",
							message: t.errors.errorProcessingPayment,
						};
						event.complete({ error: walletError });
					}
				}
			} else {
				track({
					eventId: eventIds.expressCheckoutError,
					type: TrackingEventType.EVENT,
					properties: {
						paymentType: event.source,
						provider: "poynt",
						errorCodes: "no_nonce",
					},
				});
				const walletError: WalletError = {
					code: "invalid_payment_data",
					message: t.errors.errorProcessingPayment,
				};
				event.complete({ error: walletError });
			}
		});

		collect.current.on("ready", () => {
			setIsCollectLoading(false);

			// Track Paze impression when available
			collect.current?.supportWalletPayments().then((supports) => {
				if (supports.paze) {
					track({
						eventId: eventIds.pazePayImpression,
						type: TrackingEventType.IMPRESSION,
						properties: {
							provider: "poynt",
						},
					});
				}
			});
		});

		collect.current.on("error", (event) => {
			setError(event?.data?.error?.message || t.errors.errorProcessingPayment);
		});
	}, [isPoyntLoaded, confirmCheckout.mutateAsync, t, setCheckoutErrors]);

	return (
		<>
			<div id="paze-pay-element" />
			{isCollectLoading ? (
				<div className="grid gap-1 grid-cols-1">
					<Skeleton className="h-12 w-full mb-1" />
				</div>
			) : null}
			{error ? <p className="text-destructive py-1">{error}</p> : null}
		</>
	);
}
