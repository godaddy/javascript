'use server';

import type { ResultOf } from '@/gql.tada';
import { graphqlRequestWithErrors } from '@/lib/graphql-with-errors';
import { getEnvVar } from '@/lib/utils';
import type { CheckoutSessionInput } from '@/types';
import { CreateCheckoutSessionMutation } from './mutations';

function getHostByEnvironment(): string {
  if (getEnvVar('GODADDY_ENV') === 'local') {
    return 'http://localhost:3000';
  }
  return `https://checkout.commerce.${getEnvVar('GODADDY_HOST') || 'api.godaddy.com'}`;
}

export async function createCheckoutSession(
  input: CheckoutSessionInput['input'],
  { accessToken }: { accessToken: string }
): Promise<
  ResultOf<typeof CreateCheckoutSessionMutation>['createCheckoutSession']
> {
  if (!accessToken) {
    throw new Error('No public access token provided');
  }

  const GODADDY_HOST = getHostByEnvironment();
  const response = await graphqlRequestWithErrors<
    ResultOf<typeof CreateCheckoutSessionMutation>
  >(
    GODADDY_HOST,
    CreateCheckoutSessionMutation,
    { input },
    { Authorization: `Bearer ${accessToken}` }
  );

  return response.createCheckoutSession;
}
