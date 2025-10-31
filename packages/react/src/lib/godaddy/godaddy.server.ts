'use server';

import type { ResultOf } from '@/gql.tada';
import { graphqlRequestWithErrors } from '@/lib/graphql-with-errors';
import type { CheckoutSessionInput } from '@/types';
import { CreateCheckoutSessionMutation } from './mutations';

function getHostByEnvironment(): string {
  return `https://checkout.commerce.${process.env.GODADDY_HOST || process.env.NEXT_PUBLIC_GODADDY_HOST || 'api.godaddy.com'}`;
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
