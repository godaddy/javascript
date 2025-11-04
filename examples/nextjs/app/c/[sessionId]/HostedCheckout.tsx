"use client";

import { Checkout, GoDaddyProvider } from "@godaddy/react";

export default function HostedCheckout() {
	return (
		<div>
			<GoDaddyProvider apiHost="http://localhost:3000">
				<Checkout
					godaddyPaymentsConfig={{
						businessId: "a39780b8-4bd4-4a91-9ac1-0164b2d8f673",
						appId: "urn:aid:169cc037-752f-4794-b9a2-954d20a1c7b6",
					}}
				/>
			</GoDaddyProvider>
		</div>
	);
}
