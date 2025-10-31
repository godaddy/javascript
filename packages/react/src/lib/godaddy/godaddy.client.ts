'use client';

import type { ResultOf } from '@/gql.tada';
import { graphqlRequestWithErrors } from '@/lib/graphql-with-errors.client';
import type {
  ApplyCheckoutSessionDeliveryMethodInput,
  ApplyCheckoutSessionDiscountInput,
  ApplyCheckoutSessionFulfillmentLocationInput,
  ApplyCheckoutSessionShippingMethodInput,
  CheckoutSession,
  ConfirmCheckoutMutationInput,
  RemoveAppliedCheckoutSessionShippingMethodInput,
  UpdateDraftOrderInput,
} from '@/types';
import {
  ApplyCheckoutSessionDeliveryMethodMutation,
  ApplyCheckoutSessionDiscountMutation,
  ApplyCheckoutSessionFulfillmentLocationMutation,
  ApplyCheckoutSessionShippingMethodMutation,
  ConfirmCheckoutSessionMutation,
  ExchangeCheckoutTokenMutation,
  RefreshCheckoutTokenMutation,
  RemoveAppliedCheckoutSessionShippingMethodMutation,
  UpdateCheckoutSessionDraftOrderMutation,
  VerifyCheckoutSessionAddressMutation,
} from './mutations';
import {
  AddressMatchesQuery,
  CheckoutSessionQuery,
  DraftOrderPriceAdjustmentsQuery,
  DraftOrderQuery,
  DraftOrderShippingRatesQuery,
  DraftOrderSkusQuery,
  DraftOrderTaxesQuery,
} from './queries';

function getHostByEnvironment(): string {
  return `https://checkout.commerce.${process.env.NEXT_PUBLIC_GODADDY_HOST || 'api.godaddy.com'}`;
}

function getAuthHeaders(
  auth: { jwt: string } | { session: CheckoutSession }
): HeadersInit {
  if ('jwt' in auth) {
    return { Authorization: `Bearer ${auth.jwt}` };
  }
  
  const { session } = auth;
  if (!session?.token || !session?.id) {
    throw new Error('No session token or ID provided');
  }
  
  return {
    'x-session-token': `${session.token}`,
    'x-session-id': session.id,
    'x-store-id': session.storeId,
  };
}

export async function exchangeCheckoutToken(
  sessionId: string,
  token: string
) {
  const GODADDY_HOST = getHostByEnvironment();
  const response = await graphqlRequestWithErrors<
    ResultOf<typeof ExchangeCheckoutTokenMutation>
  >(GODADDY_HOST, ExchangeCheckoutTokenMutation, {
    input: { sessionId, token },
  });

  return response.exchangeCheckoutToken!;
}

export async function refreshCheckoutToken(jwt: string) {
  const GODADDY_HOST = getHostByEnvironment();
  const response = await graphqlRequestWithErrors<
    ResultOf<typeof RefreshCheckoutTokenMutation>
  >(GODADDY_HOST, RefreshCheckoutTokenMutation, undefined, {
    Authorization: `Bearer ${jwt}`,
  });

  return response.refreshCheckoutToken!;
}

export async function getCheckoutSession(jwt: string) {
  const GODADDY_HOST = getHostByEnvironment();

  return graphqlRequestWithErrors<ResultOf<typeof CheckoutSessionQuery>>(
    GODADDY_HOST,
    CheckoutSessionQuery,
    undefined,
    {
      Authorization: `Bearer ${jwt}`,
    }
  );
}

export async function getAddressMatches(
  input: { query: string },
  auth: { jwt: string } | { session: CheckoutSession }
) {
  const GODADDY_HOST = getHostByEnvironment();

  return graphqlRequestWithErrors<ResultOf<typeof AddressMatchesQuery>>(
    GODADDY_HOST,
    AddressMatchesQuery,
    input,
    getAuthHeaders(auth)
  );
}

export function getDraftOrder(
  auth: { jwt: string } | { session: CheckoutSession }
) {
  const GODADDY_HOST = getHostByEnvironment();

  return graphqlRequestWithErrors<ResultOf<typeof DraftOrderQuery>>(
    GODADDY_HOST,
    DraftOrderQuery,
    undefined,
    getAuthHeaders(auth)
  );
}

export function getDraftOrderProducts(
  auth: { jwt: string } | { session: CheckoutSession }
) {
  const GODADDY_HOST = getHostByEnvironment();

  return graphqlRequestWithErrors<ResultOf<typeof DraftOrderSkusQuery>>(
    GODADDY_HOST,
    DraftOrderSkusQuery,
    undefined,
    getAuthHeaders(auth)
  );
}

export function getDraftOrderPriceAdjustments(
  discountCodes?: string[],
  shippingLines?: any,
  auth?: { jwt: string } | { session: CheckoutSession }
) {
  if (!auth) throw new Error('Auth required');
  
  const GODADDY_HOST = getHostByEnvironment();

  return graphqlRequestWithErrors<
    ResultOf<typeof DraftOrderPriceAdjustmentsQuery>
  >(
    GODADDY_HOST,
    DraftOrderPriceAdjustmentsQuery,
    { discountCodes, shippingLines },
    getAuthHeaders(auth)
  );
}

export function getDraftOrderShippingRates(
  destination: any,
  auth: { jwt: string } | { session: CheckoutSession }
) {
  const GODADDY_HOST = getHostByEnvironment();

  return graphqlRequestWithErrors<
    ResultOf<typeof DraftOrderShippingRatesQuery>
  >(
    GODADDY_HOST,
    DraftOrderShippingRatesQuery,
    { destination },
    getAuthHeaders(auth)
  );
}

export function getDraftOrderTaxes(
  destination: any,
  auth: { jwt: string } | { session: CheckoutSession }
) {
  const GODADDY_HOST = getHostByEnvironment();

  return graphqlRequestWithErrors<ResultOf<typeof DraftOrderTaxesQuery>>(
    GODADDY_HOST,
    DraftOrderTaxesQuery,
    { destination },
    getAuthHeaders(auth)
  );
}

export function applyDiscount(
  discountCodes: ApplyCheckoutSessionDiscountInput['input']['discountCodes'],
  auth: { jwt: string; sessionId: string } | { session: CheckoutSession }
) {
  const GODADDY_HOST = getHostByEnvironment();
  const sessionId = 'jwt' in auth ? auth.sessionId : auth.session.id;

  return graphqlRequestWithErrors<
    ResultOf<typeof ApplyCheckoutSessionDiscountMutation>
  >(
    GODADDY_HOST,
    ApplyCheckoutSessionDiscountMutation,
    { input: { discountCodes }, sessionId },
    getAuthHeaders(auth)
  );
}

export function applyShippingMethod(
  shippingMethods: ApplyCheckoutSessionShippingMethodInput['input'],
  auth: { jwt: string } | { session: CheckoutSession }
) {
  const GODADDY_HOST = getHostByEnvironment();

  return graphqlRequestWithErrors<
    ResultOf<typeof ApplyCheckoutSessionShippingMethodMutation>
  >(
    GODADDY_HOST,
    ApplyCheckoutSessionShippingMethodMutation,
    { input: [...shippingMethods] },
    getAuthHeaders(auth)
  );
}

export function removeShippingMethod(
  input: RemoveAppliedCheckoutSessionShippingMethodInput['input'],
  auth: { jwt: string } | { session: CheckoutSession }
) {
  const GODADDY_HOST = getHostByEnvironment();

  return graphqlRequestWithErrors<
    ResultOf<typeof RemoveAppliedCheckoutSessionShippingMethodMutation>
  >(
    GODADDY_HOST,
    RemoveAppliedCheckoutSessionShippingMethodMutation,
    { input },
    getAuthHeaders(auth)
  );
}

export function confirmCheckout(
  input: ConfirmCheckoutMutationInput['input'],
  auth: { jwt: string; sessionId: string } | { session: CheckoutSession }
) {
  const GODADDY_HOST = getHostByEnvironment();
  const sessionId = 'jwt' in auth ? auth.sessionId : auth.session.id;

  return graphqlRequestWithErrors<
    ResultOf<typeof ConfirmCheckoutSessionMutation>
  >(
    GODADDY_HOST,
    ConfirmCheckoutSessionMutation,
    { input, sessionId },
    getAuthHeaders(auth)
  );
}

export function updateDraftOrder(
  input: UpdateDraftOrderInput,
  auth: { jwt: string } | { session: CheckoutSession }
) {
  const GODADDY_HOST = getHostByEnvironment();

  return graphqlRequestWithErrors<
    ResultOf<typeof UpdateCheckoutSessionDraftOrderMutation>
  >(
    GODADDY_HOST,
    UpdateCheckoutSessionDraftOrderMutation,
    { input },
    getAuthHeaders(auth)
  );
}

export function applyDeliveryMethod(
  input: ApplyCheckoutSessionDeliveryMethodInput,
  auth: { jwt: string } | { session: CheckoutSession }
) {
  const GODADDY_HOST = getHostByEnvironment();

  return graphqlRequestWithErrors<
    ResultOf<typeof ApplyCheckoutSessionDeliveryMethodMutation>
  >(
    GODADDY_HOST,
    ApplyCheckoutSessionDeliveryMethodMutation,
    input,
    getAuthHeaders(auth)
  );
}

export function applyFulfillmentLocation(
  input: ApplyCheckoutSessionFulfillmentLocationInput,
  auth: { jwt: string } | { session: CheckoutSession }
) {
  const GODADDY_HOST = getHostByEnvironment();

  return graphqlRequestWithErrors<
    ResultOf<typeof ApplyCheckoutSessionFulfillmentLocationMutation>
  >(
    GODADDY_HOST,
    ApplyCheckoutSessionFulfillmentLocationMutation,
    input,
    getAuthHeaders(auth)
  );
}

export async function verifyAddress(
  input: { addressLine1: string; addressLine2?: string; adminArea1?: string; adminArea2?: string; adminArea3?: string; adminArea4?: string; countryCode: string; postalCode: string },
  auth: { jwt: string } | { session: CheckoutSession }
) {
  const GODADDY_HOST = getHostByEnvironment();

  return graphqlRequestWithErrors<
    ResultOf<typeof VerifyCheckoutSessionAddressMutation>
  >(
    GODADDY_HOST,
    VerifyCheckoutSessionAddressMutation,
    { input },
    getAuthHeaders(auth)
  );
}
