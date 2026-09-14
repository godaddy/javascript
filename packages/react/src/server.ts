'use server';

import * as GoDaddy from '@/lib/godaddy/godaddy';
import { CreateCheckoutSessionInputWithKebabCase } from '@/lib/godaddy/godaddy';
import { getEnvVar } from '@/lib/utils';
import type { CheckoutSessionOptions } from '@/types';

let accessToken: string | undefined;
let accessTokenExpiresAt: number | undefined;

export async function createCheckoutSession(
  input: CreateCheckoutSessionInputWithKebabCase,
  options?: CheckoutSessionOptions
) {
  const auth = options?.auth;
  const apiHost = getEnvVar('GODADDY_API_HOST') || 'api.godaddy.com';

  if (
    auth &&
    'personalAccessToken' in auth &&
    auth.personalAccessToken &&
    (('clientId' in auth && auth.clientId) ||
      ('clientSecret' in auth && auth.clientSecret))
  ) {
    throw new Error(
      'personalAccessToken and clientId/clientSecret are mutually exclusive. Provide one or the other.'
    );
  }

  if (auth && 'personalAccessToken' in auth && !auth.personalAccessToken) {
    throw new Error('personalAccessToken must not be empty');
  }

  let token: string | undefined;
  let endpoint: string | undefined;

  if (auth && 'personalAccessToken' in auth && auth.personalAccessToken) {
    token = auth.personalAccessToken;
    endpoint = `/v2/commerce/stores/${input.storeId}/checkout-subgraph`;
  } else {
    const CLIENT_ID = (auth && 'clientId' in auth ? auth.clientId : '') || '';
    const CLIENT_SECRET =
      (auth && 'clientSecret' in auth ? auth.clientSecret : '') || '';

    const now = Date.now() / 1000;

    if (
      !accessToken ||
      !accessTokenExpiresAt ||
      accessTokenExpiresAt - 60 < now
    ) {
      const getAccessTokenResponse = await getAccessToken({
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
      });

      accessToken = getAccessTokenResponse?.access_token;
      accessTokenExpiresAt = now + (getAccessTokenResponse?.expires_in || 0);
    }

    token = accessToken;
  }

  if (!token) {
    throw new Error('Failed to get access token');
  }

  return await GoDaddy.createCheckoutSession(input, {
    accessToken: token,
    apiHost,
    endpoint,
  });
}

function getHostByEnvironment(): string {
  return `https://${getEnvVar('GODADDY_API_HOST') || 'api.godaddy.com'}`;
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
  data.append('scope', 'commerce.product:read');
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
