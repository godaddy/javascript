'use server';

import * as GoDaddy from '@/lib/godaddy/godaddy';
import { CreateCheckoutSessionInputWithKebabCase } from '@/lib/godaddy/godaddy';
import { getEnvVar, normalizeApiHost } from '@/lib/utils';
import type { CheckoutSessionOptions } from '@/types';

export interface ExchangeIdpTokenOptions {
  clientId: string;
  clientSecret: string;
  idpToken: string;
  scopes?: string[];
  apiHost?: string;
}

export interface ExchangeIdpTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

let accessToken: string | undefined;
let accessTokenExpiresAt: number | undefined;

export async function createCheckoutSession(
  input: CreateCheckoutSessionInputWithKebabCase,
  options?: CheckoutSessionOptions
) {
  const CLIENT_ID = options?.auth?.clientId || '';
  const CLIENT_SECRET = options?.auth?.clientSecret || '';

  const now = Date.now() / 1000; // seconds

  if (
    !accessToken ||
    !accessTokenExpiresAt ||
    accessTokenExpiresAt - 60 < now // refresh 1 min before expiry
  ) {
    const getAccessTokenResponse = await getAccessToken({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
    });

    accessToken = getAccessTokenResponse?.access_token;
    accessTokenExpiresAt = now + (getAccessTokenResponse?.expires_in || 0);
  }

  if (!accessToken) {
    throw new Error('Failed to get access token');
  }

  return await GoDaddy.createCheckoutSession(input, {
    accessToken,
    apiHost: getEnvVar('GODADDY_API_HOST'),
  });
}

function getHostByEnvironment(): string {
  return normalizeApiHost();
}

async function getAccessToken({
  clientId,
  clientSecret,
}: {
  clientId: string;
  clientSecret: string;
}) {
  if (!clientId || !clientSecret) {
    return;
  }

  const host = getHostByEnvironment();

  const data = new URLSearchParams();
  data.append('grant_type', 'client_credentials');
  data.append('client_id', clientId);
  data.append('client_secret', clientSecret);
  data.append(
    'scope',
    'commerce.product:read commerce.order:read commerce.order:update location.address-verification:execute'
  );
  const response = await fetch(`${host}/v2/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: data.toString(),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(
      `Failed to get access token: ${response.status} ${response.statusText}`
    );
  }

  return (await response.json()) as {
    access_token: string;
    scope: string;
    expires_in: number;
  };
}

export async function exchangeIdpToken({
  clientId,
  clientSecret,
  idpToken,
  scopes = [],
  apiHost,
}: ExchangeIdpTokenOptions): Promise<ExchangeIdpTokenResponse> {
  if (!clientId || !clientSecret) {
    throw new Error('Client ID and secret are required');
  }

  if (!idpToken) {
    throw new Error('IDP token is required');
  }

  const host = normalizeApiHost(apiHost);

  const data = new URLSearchParams();
  data.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
  data.append('client_id', clientId);
  data.append('client_secret', clientSecret);
  data.append('assertion', idpToken);

  if (scopes.length > 0) {
    data.append('scope', scopes.join(' '));
  }

  const response = await fetch(`${host}/v2/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: data.toString(),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(
      `Failed to exchange IDP token: ${response.status} ${response.statusText}`
    );
  }

  return (await response.json()) as ExchangeIdpTokenResponse;
}
