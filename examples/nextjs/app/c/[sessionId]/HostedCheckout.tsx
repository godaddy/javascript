"use client";

import { Checkout, GoDaddyProvider } from "@godaddy/react";

export default function HostedCheckout() {
	return (
		<div>
			<GoDaddyProvider apiHost={process.env.NEXT_PUBLIC_GODADDY_API_HOST}>
				<Checkout
					godaddyPaymentsConfig={{
						businessId: process.env.NEXT_PUBLIC_GODADDY_BUSINESS_ID || "",
						appId: process.env.NEXT_PUBLIC_GODADDY_APP_ID || "",
					}}
				/>
			</GoDaddyProvider>
		</div>
	);
}
