"use server";

import type {
	CheckoutSessionInput,
	CheckoutSessionOptions,
	Environments,
} from "@/types";
import * as GoDaddy from "./lib/godaddy/godaddy";

let accessToken: string | undefined = undefined;
let accessTokenExpiresAt: number | undefined = undefined;

export async function createCheckoutSession(
	input: CheckoutSessionInput["input"],
	options?: CheckoutSessionOptions,
) {
	const CLIENT_ID = options?.auth?.clientId || "";
	const CLIENT_SECRET = options?.auth?.clientSecret || "";

	const now = Date.now() / 1000; // seconds

	if (
		!accessToken ||
		!accessTokenExpiresAt ||
		accessTokenExpiresAt - 60 < now // refresh 1 min before expiry
	) {
		const getAccessTokenResponse = await getAccessToken({
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			environment: input?.environment || "dev",
		});

		accessToken = getAccessTokenResponse?.access_token;
		accessTokenExpiresAt = now + (getAccessTokenResponse?.expires_in || 0);
	}

	if (!accessToken) {
		throw new Error("Failed to get access token");
	}

	return await GoDaddy.createCheckoutSession(input, {
		accessToken,
		environment: input?.environment || "dev",
	});
}

function getHostByEnvironment(): string {
	return process.env.GODADDY_HOST || "https://api.godaddy.com";
}

async function getAccessToken({
								  clientId,
								  clientSecret,
							  }: {
	clientId: string;
	clientSecret: string;
	environment: Environments;
}) {
	if (!clientId || !clientSecret) {
		return;
	}

	const host = getHostByEnvironment();

	const data = new URLSearchParams();
	data.append("grant_type", "client_credentials");
	data.append("client_id", clientId);
	data.append("client_secret", clientSecret);
	data.append(
		"scope",
		"commerce.product:read commerce.order:read commerce.order:update location.address-verification:execute",
	);

	try {
		const response = await fetch(`${host}/v2/oauth2/token`, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: data.toString(),
			cache: "no-store",
		});

		if (!response.ok) {
			throw new Error(
				`Failed to get access token: ${response.status} ${response.statusText}`,
			);
		}

		const result = (await response.json()) as {
			access_token: string;
			scope: string;
			expires_in: number;
		};

		return result;
	} catch (err) {
		console.error("Failed to get access token:", err);
		throw err;
	}
}