import type { ResultOf } from '@/gql.tada';
import { graphqlRequestWithErrors } from '@/lib/graphql-with-errors';
import type {
  ApplyCheckoutSessionDeliveryMethodInput,
  ApplyCheckoutSessionDiscountInput,
  ApplyCheckoutSessionFulfillmentLocationInput,
  ApplyCheckoutSessionShippingMethodInput,
  CheckoutSession,
  CheckoutSessionInput,
  ConfirmCheckoutMutationInput,
  DraftOrderPriceAdjustmentsQueryInput,
  GetCheckoutSessionShippingRatesInput,
  GetCheckoutSessionTaxesInput,
  RemoveAppliedCheckoutSessionShippingMethodInput,
  UpdateDraftOrderInput,
} from '@/types';
import {
  ApplyCheckoutSessionDeliveryMethodMutation,
  ApplyCheckoutSessionDiscountMutation,
  ApplyCheckoutSessionFulfillmentLocationMutation,
  ApplyCheckoutSessionShippingMethodMutation,
  CalculateCheckoutSessionTaxesMutation,
  ConfirmCheckoutSessionMutation,
  CreateCheckoutSessionMutation,
  ExchangeCheckoutTokenMutation,
  RefreshCheckoutTokenMutation,
  RemoveAppliedCheckoutSessionShippingMethodMutation,
  UpdateCheckoutSessionDraftOrderMutation,
  VerifyCheckoutSessionAddressMutation,
} from './mutations';
import {
  AddressMatchesQuery,
  DraftOrderPriceAdjustmentsQuery,
  DraftOrderQuery,
  DraftOrderShippingRatesQuery,
  DraftOrderSkusQuery,
  DraftOrderTaxesQuery,
  GetCheckoutSessionQuery,
} from './queries';

function getHostByEnvironment(apiHost?: string): string {
  // Use provided apiHost, otherwise default to production
  return `https://checkout.commerce.${apiHost || 'api.godaddy.com'}`;
}

export async function createCheckoutSession(
  input: CheckoutSessionInput['input'],
  { accessToken, apiHost }: { accessToken: string; apiHost?: string }
): Promise<
  ResultOf<typeof CreateCheckoutSessionMutation>['createCheckoutSession']
> {
  if (!accessToken) {
    throw new Error('No public access token provided');
  }

  const GODADDY_HOST = getHostByEnvironment(apiHost);
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

export async function exchangeCheckoutToken(
  input: {
    sessionId: string;
    token: string;
  },
  apiHost?: string
) {
  if (!input.sessionId || !input.token) {
    throw new Error('No session ID or token provided');
  }

  const GODADDY_HOST = getHostByEnvironment(apiHost);
  // Browser automatically sends Origin header for CORS requests
  // No need to manually set it
  const response = await graphqlRequestWithErrors<
    ResultOf<typeof ExchangeCheckoutTokenMutation>
  >(GODADDY_HOST, ExchangeCheckoutTokenMutation, { input });
  return response.exchangeCheckoutToken;
}

export async function refreshCheckoutToken(
  accessToken: string,
  apiHost?: string
) {
  if (!accessToken) {
    throw new Error('No access token provided');
  }

  const GODADDY_HOST = getHostByEnvironment(apiHost);
  const response = await graphqlRequestWithErrors<
    ResultOf<typeof RefreshCheckoutTokenMutation>
  >(
    GODADDY_HOST,
    RefreshCheckoutTokenMutation,
    {},
    {
      Authorization: `Bearer ${accessToken}`,
    }
  );
  return response.refreshCheckoutToken;
}

export async function getCheckoutSession(
  { accessToken }: { accessToken: string },
  apiHost?: string
) {
  const GODADDY_HOST = getHostByEnvironment(apiHost);
  const response = await graphqlRequestWithErrors<
    ResultOf<typeof GetCheckoutSessionQuery>
  >(
    GODADDY_HOST,
    GetCheckoutSessionQuery,
    {},
    {
      Authorization: `Bearer ${accessToken}`,
    }
  );
  return response.checkoutSession;
}

export async function getAddressMatches(
  input: { query: string },
  session: CheckoutSession | undefined | null,
  apiHost?: string
): Promise<ResultOf<typeof AddressMatchesQuery>>;
export async function getAddressMatches(
  input: { query: string },
  auth: { accessToken: string | undefined },
  apiHost?: string
): Promise<ResultOf<typeof AddressMatchesQuery>>;
export async function getAddressMatches(
  input: { query: string },
  sessionOrAuth:
    | CheckoutSession
    | undefined
    | null
    | { accessToken: string | undefined },
  apiHost?: string
) {
  const GODADDY_HOST = getHostByEnvironment(apiHost);

  if (sessionOrAuth && 'accessToken' in sessionOrAuth) {
    if (!sessionOrAuth.accessToken) {
      throw new Error('No access token provided');
    }
    return graphqlRequestWithErrors<ResultOf<typeof AddressMatchesQuery>>(
      GODADDY_HOST,
      AddressMatchesQuery,
      input,
      {
        Authorization: `Bearer ${sessionOrAuth.accessToken}`,
      }
    );
  }

  const session = sessionOrAuth;
  if (!session?.token || !session?.id) {
    throw new Error('No session token or ID provided');
  }

  return graphqlRequestWithErrors<ResultOf<typeof AddressMatchesQuery>>(
    GODADDY_HOST,
    AddressMatchesQuery,
    input,
    {
      'x-session-token': `${session.token}`,
      'x-session-id': session.id,
      'x-store-id': session.storeId,
    }
  );
}

export function getDraftOrder(
  session: CheckoutSession | undefined | null,
  apiHost?: string
): Promise<ResultOf<typeof DraftOrderQuery>>;
export function getDraftOrder(
  auth: { accessToken: string | undefined },
  apiHost?: string
): Promise<ResultOf<typeof DraftOrderQuery>>;
export function getDraftOrder(
  sessionOrAuth:
    | CheckoutSession
    | undefined
    | null
    | { accessToken: string | undefined },
  apiHost?: string
) {
  const GODADDY_HOST = getHostByEnvironment(apiHost);

  if (sessionOrAuth && 'accessToken' in sessionOrAuth) {
    if (!sessionOrAuth.accessToken) {
      throw new Error('No access token provided');
    }
    return graphqlRequestWithErrors<ResultOf<typeof DraftOrderQuery>>(
      GODADDY_HOST,
      DraftOrderQuery,
      undefined,
      {
        Authorization: `Bearer ${sessionOrAuth.accessToken}`,
      }
    );
  }

  const session = sessionOrAuth;
  if (!session?.token || !session?.id) {
    throw new Error('No session token or ID provided');
  }

  return graphqlRequestWithErrors<ResultOf<typeof DraftOrderQuery>>(
    GODADDY_HOST,
    DraftOrderQuery,
    undefined,
    {
      'x-session-token': `${session.token}`,
      'x-session-id': session.id,
      'x-store-id': session.storeId,
    }
  );
}

export function getDraftOrderTaxes(
  session: CheckoutSession | undefined,
  params: {
    destination?: GetCheckoutSessionTaxesInput['destination'];
    lines?: GetCheckoutSessionTaxesInput['lines'];
  },
  apiHost?: string
): Promise<ResultOf<typeof DraftOrderTaxesQuery>>;
export function getDraftOrderTaxes(
  auth: { accessToken: string | undefined },
  params: {
    destination?: GetCheckoutSessionTaxesInput['destination'];
    lines?: GetCheckoutSessionTaxesInput['lines'];
  },
  apiHost?: string
): Promise<ResultOf<typeof DraftOrderTaxesQuery>>;
export function getDraftOrderTaxes(
  sessionOrAuth:
    | CheckoutSession
    | undefined
    | { accessToken: string | undefined },
  {
    destination,
    lines,
  }: {
    destination?: GetCheckoutSessionTaxesInput['destination'];
    lines?: GetCheckoutSessionTaxesInput['lines'];
  },
  apiHost?: string
) {
  const GODADDY_HOST = getHostByEnvironment(apiHost);

  if (sessionOrAuth && 'accessToken' in sessionOrAuth) {
    if (!sessionOrAuth.accessToken) {
      throw new Error('No access token provided');
    }
    return graphqlRequestWithErrors<ResultOf<typeof DraftOrderTaxesQuery>>(
      GODADDY_HOST,
      DraftOrderTaxesQuery,
      { destination, lines },
      {
        Authorization: `Bearer ${sessionOrAuth.accessToken}`,
      }
    );
  }

  const session = sessionOrAuth;
  if (!session?.token || !session?.id) {
    throw new Error('No session token or ID provided');
  }

  return graphqlRequestWithErrors<ResultOf<typeof DraftOrderTaxesQuery>>(
    GODADDY_HOST,
    DraftOrderTaxesQuery,
    { destination, lines },
    {
      'x-session-token': `${session.token}`,
      'x-session-id': session.id,
      'x-store-id': session.storeId,
    }
  );
}

export async function verifyAddress(
  input: {
    addressLine1: string;
    addressLine2: string;
    addressLine3: string;
    postalCode: string;
    countryCode: string;
    adminArea1?: string;
    adminArea2?: string;
    adminArea3?: string;
    adminArea4?: string;
  },
  session: CheckoutSession | undefined | null,
  apiHost?: string
): Promise<ResultOf<typeof VerifyCheckoutSessionAddressMutation>>;
export async function verifyAddress(
  input: {
    addressLine1: string;
    addressLine2: string;
    addressLine3: string;
    postalCode: string;
    countryCode: string;
    adminArea1?: string;
    adminArea2?: string;
    adminArea3?: string;
    adminArea4?: string;
  },
  auth: { accessToken: string | undefined },
  apiHost?: string
): Promise<ResultOf<typeof VerifyCheckoutSessionAddressMutation>>;
export async function verifyAddress(
  input: {
    addressLine1: string;
    addressLine2: string;
    addressLine3: string;
    postalCode: string;
    countryCode: string;
    adminArea1?: string;
    adminArea2?: string;
    adminArea3?: string;
    adminArea4?: string;
  },
  sessionOrAuth:
    | CheckoutSession
    | undefined
    | null
    | { accessToken: string | undefined },
  apiHost?: string
) {
  const GODADDY_HOST = getHostByEnvironment(apiHost);

  if (sessionOrAuth && 'accessToken' in sessionOrAuth) {
    if (!sessionOrAuth.accessToken) {
      throw new Error('No access token provided');
    }
    return graphqlRequestWithErrors<
      ResultOf<typeof VerifyCheckoutSessionAddressMutation>
    >(
      GODADDY_HOST,
      VerifyCheckoutSessionAddressMutation,
      { input: { ...input, adminArea3: input.adminArea2, adminArea2: '' } },
      {
        Authorization: `Bearer ${sessionOrAuth.accessToken}`,
      }
    );
  }

  const session = sessionOrAuth;
  if (!session?.token || !session?.id) {
    throw new Error('No session token or ID provided');
  }

  return graphqlRequestWithErrors<
    ResultOf<typeof VerifyCheckoutSessionAddressMutation>
  >(
    GODADDY_HOST,
    VerifyCheckoutSessionAddressMutation,
    { input: { ...input, adminArea3: input.adminArea2, adminArea2: '' } },
    {
      'x-session-token': `${session.token}`,
      'x-session-id': session.id,
      'x-store-id': session.storeId,
    }
  );
}

export async function updateDraftOrder(
  input: UpdateDraftOrderInput['input'],
  session: CheckoutSession | undefined | null,
  apiHost?: string
): Promise<ResultOf<typeof UpdateCheckoutSessionDraftOrderMutation>>;
export async function updateDraftOrder(
  input: UpdateDraftOrderInput['input'],
  auth: { accessToken: string | undefined },
  apiHost?: string
): Promise<ResultOf<typeof UpdateCheckoutSessionDraftOrderMutation>>;
export async function updateDraftOrder(
  input: UpdateDraftOrderInput['input'],
  sessionOrAuth:
    | CheckoutSession
    | undefined
    | null
    | { accessToken: string | undefined },
  apiHost?: string
) {
  const GODADDY_HOST = getHostByEnvironment(apiHost);

  if (sessionOrAuth && 'accessToken' in sessionOrAuth) {
    if (!sessionOrAuth.accessToken) {
      throw new Error('No access token provided');
    }
    return graphqlRequestWithErrors<
      ResultOf<typeof UpdateCheckoutSessionDraftOrderMutation>
    >(
      GODADDY_HOST,
      UpdateCheckoutSessionDraftOrderMutation,
      { input },
      {
        Authorization: `Bearer ${sessionOrAuth.accessToken}`,
      }
    );
  }

  const session = sessionOrAuth;
  if (!session?.token || !session?.id) {
    throw new Error('No session token or ID provided');
  }

  return graphqlRequestWithErrors<
    ResultOf<typeof UpdateCheckoutSessionDraftOrderMutation>
  >(
    GODADDY_HOST,
    UpdateCheckoutSessionDraftOrderMutation,
    { input },
    {
      'x-session-token': `${session.token}`,
      'x-session-id': session.id,
      'x-store-id': session.storeId,
    }
  );
}

export async function getProductsFromOrderSkus(
  session: CheckoutSession | undefined | null,
  apiHost?: string
): Promise<ResultOf<typeof DraftOrderSkusQuery>>;
export async function getProductsFromOrderSkus(
  auth: {
    accessToken: string | undefined;
  },
  apiHost?: string
): Promise<ResultOf<typeof DraftOrderSkusQuery>>;
export async function getProductsFromOrderSkus(
  sessionOrAuth:
    | CheckoutSession
    | undefined
    | null
    | { accessToken: string | undefined },
  apiHost?: string
) {
  const GODADDY_HOST = getHostByEnvironment(apiHost);

  if (sessionOrAuth && 'accessToken' in sessionOrAuth) {
    if (!sessionOrAuth.accessToken) {
      throw new Error('No access token provided');
    }
    return graphqlRequestWithErrors<ResultOf<typeof DraftOrderSkusQuery>>(
      GODADDY_HOST,
      DraftOrderSkusQuery,
      undefined,
      {
        Authorization: `Bearer ${sessionOrAuth.accessToken}`,
      }
    );
  }

  const session = sessionOrAuth;
  if (!session?.token || !session?.id) {
    throw new Error('No session token or ID provided');
  }

  return graphqlRequestWithErrors<ResultOf<typeof DraftOrderSkusQuery>>(
    GODADDY_HOST,
    DraftOrderSkusQuery,
    undefined,
    {
      'x-session-token': `${session.token}`,
      'x-session-id': session.id,
      'x-store-id': session.storeId,
    }
  );
}

export function updateDraftOrderTaxes(
  session: CheckoutSession | undefined | null,
  destination?: {
    addressLine1?: string | null;
    addressLine2?: string | null;
    addressLine3?: string | null;
    adminArea1?: string | null;
    adminArea2?: string | null;
    adminArea3?: string | null;
    countryCode?: string | null;
    postalCode?: string | null;
  },
  apiHost?: string
): Promise<ResultOf<typeof CalculateCheckoutSessionTaxesMutation>>;
export function updateDraftOrderTaxes(
  auth: { accessToken: string | undefined },
  destination?: {
    addressLine1?: string | null;
    addressLine2?: string | null;
    addressLine3?: string | null;
    adminArea1?: string | null;
    adminArea2?: string | null;
    adminArea3?: string | null;
    countryCode?: string | null;
    postalCode?: string | null;
  },
  apiHost?: string
): Promise<ResultOf<typeof CalculateCheckoutSessionTaxesMutation>>;
export function updateDraftOrderTaxes(
  sessionOrAuth:
    | CheckoutSession
    | undefined
    | null
    | { accessToken: string | undefined },
  destination?: {
    addressLine1?: string | null;
    addressLine2?: string | null;
    addressLine3?: string | null;
    adminArea1?: string | null;
    adminArea2?: string | null;
    adminArea3?: string | null;
    countryCode?: string | null;
    postalCode?: string | null;
  },
  apiHost?: string
) {
  const GODADDY_HOST = getHostByEnvironment(apiHost);

  if (sessionOrAuth && 'accessToken' in sessionOrAuth) {
    if (!sessionOrAuth.accessToken) {
      throw new Error('No access token provided');
    }
    return graphqlRequestWithErrors<
      ResultOf<typeof CalculateCheckoutSessionTaxesMutation>
    >(
      GODADDY_HOST,
      CalculateCheckoutSessionTaxesMutation,
      { destination },
      {
        Authorization: `Bearer ${sessionOrAuth.accessToken}`,
      }
    );
  }

  const session = sessionOrAuth;
  if (!session?.token || !session?.id) {
    throw new Error('No session token or ID provided');
  }

  return graphqlRequestWithErrors<
    ResultOf<typeof CalculateCheckoutSessionTaxesMutation>
  >(
    GODADDY_HOST,
    CalculateCheckoutSessionTaxesMutation,
    { destination },
    {
      'x-session-token': `${session.token}`,
      'x-session-id': session.id,
      'x-store-id': session.storeId,
    }
  );
}

export function applyDiscount(
  discountCodes: ApplyCheckoutSessionDiscountInput['input']['discountCodes'],
  session: CheckoutSession | undefined | null,
  apiHost?: string
): Promise<ResultOf<typeof ApplyCheckoutSessionDiscountMutation>>;
export function applyDiscount(
  discountCodes: ApplyCheckoutSessionDiscountInput['input']['discountCodes'],
  auth: { accessToken: string | undefined },
  apiHost?: string
): Promise<ResultOf<typeof ApplyCheckoutSessionDiscountMutation>>;
export function applyDiscount(
  discountCodes: ApplyCheckoutSessionDiscountInput['input']['discountCodes'],
  sessionOrAuth:
    | CheckoutSession
    | undefined
    | null
    | { accessToken: string | undefined },
  apiHost?: string
) {
  const GODADDY_HOST = getHostByEnvironment(apiHost);

  if (sessionOrAuth && 'accessToken' in sessionOrAuth) {
    if (!sessionOrAuth.accessToken) {
      throw new Error('No access token provided');
    }
    return graphqlRequestWithErrors<
      ResultOf<typeof ApplyCheckoutSessionDiscountMutation>
    >(
      GODADDY_HOST,
      ApplyCheckoutSessionDiscountMutation,
      { input: { discountCodes } },
      {
        Authorization: `Bearer ${sessionOrAuth.accessToken}`,
      }
    );
  }

  const session = sessionOrAuth;
  if (!session?.token || !session?.id) {
    throw new Error('No session token or ID provided');
  }

  return graphqlRequestWithErrors<
    ResultOf<typeof ApplyCheckoutSessionDiscountMutation>
  >(
    GODADDY_HOST,
    ApplyCheckoutSessionDiscountMutation,
    { input: { discountCodes }, sessionId: session.id },
    {
      'x-session-token': `${session.token}`,
      'x-session-id': session.id,
      'x-store-id': session.storeId,
    }
  );
}

export function applyShippingMethod(
  shippingMethods: ApplyCheckoutSessionShippingMethodInput['input'],
  session: CheckoutSession | undefined | null,
  apiHost?: string
): Promise<ResultOf<typeof ApplyCheckoutSessionShippingMethodMutation>>;
export function applyShippingMethod(
  shippingMethods: ApplyCheckoutSessionShippingMethodInput['input'],
  auth: { accessToken: string | undefined },
  apiHost?: string
): Promise<ResultOf<typeof ApplyCheckoutSessionShippingMethodMutation>>;
export function applyShippingMethod(
  shippingMethods: ApplyCheckoutSessionShippingMethodInput['input'],
  sessionOrAuth:
    | CheckoutSession
    | undefined
    | null
    | { accessToken: string | undefined },
  apiHost?: string
) {
  const GODADDY_HOST = getHostByEnvironment(apiHost);

  if (sessionOrAuth && 'accessToken' in sessionOrAuth) {
    if (!sessionOrAuth.accessToken) {
      throw new Error('No access token provided');
    }
    return graphqlRequestWithErrors<
      ResultOf<typeof ApplyCheckoutSessionShippingMethodMutation>
    >(
      GODADDY_HOST,
      ApplyCheckoutSessionShippingMethodMutation,
      { input: [...shippingMethods] },
      {
        Authorization: `Bearer ${sessionOrAuth.accessToken}`,
      }
    );
  }

  const session = sessionOrAuth;
  if (!session?.token || !session?.id) {
    throw new Error('No session token or ID provided');
  }

  return graphqlRequestWithErrors<
    ResultOf<typeof ApplyCheckoutSessionShippingMethodMutation>
  >(
    GODADDY_HOST,
    ApplyCheckoutSessionShippingMethodMutation,
    { input: [...shippingMethods] },
    {
      'x-session-token': `${session.token}`,
      'x-session-id': session.id,
      'x-store-id': session.storeId,
    }
  );
}

export function removeShippingMethod(
  input: RemoveAppliedCheckoutSessionShippingMethodInput['input'],
  session: CheckoutSession | undefined | null,
  apiHost?: string
): Promise<ResultOf<typeof RemoveAppliedCheckoutSessionShippingMethodMutation>>;
export function removeShippingMethod(
  input: RemoveAppliedCheckoutSessionShippingMethodInput['input'],
  auth: { accessToken: string | undefined },
  apiHost?: string
): Promise<ResultOf<typeof RemoveAppliedCheckoutSessionShippingMethodMutation>>;
export function removeShippingMethod(
  input: RemoveAppliedCheckoutSessionShippingMethodInput['input'],
  sessionOrAuth:
    | CheckoutSession
    | undefined
    | null
    | { accessToken: string | undefined },
  apiHost?: string
): Promise<
  ResultOf<typeof RemoveAppliedCheckoutSessionShippingMethodMutation>
> {
  const GODADDY_HOST = getHostByEnvironment(apiHost);

  if (sessionOrAuth && 'accessToken' in sessionOrAuth) {
    if (!sessionOrAuth.accessToken) {
      throw new Error('No access token provided');
    }
    return graphqlRequestWithErrors<
      ResultOf<typeof RemoveAppliedCheckoutSessionShippingMethodMutation>
    >(
      GODADDY_HOST,
      RemoveAppliedCheckoutSessionShippingMethodMutation,
      { input },
      {
        Authorization: `Bearer ${sessionOrAuth.accessToken}`,
      }
    );
  }

  const session = sessionOrAuth;
  if (!session?.token || !session?.id) {
    throw new Error('No session token or ID provided');
  }

  return graphqlRequestWithErrors<
    ResultOf<typeof RemoveAppliedCheckoutSessionShippingMethodMutation>
  >(
    GODADDY_HOST,
    RemoveAppliedCheckoutSessionShippingMethodMutation,
    { input },
    {
      'x-session-token': `${session.token}`,
      'x-session-id': session.id,
      'x-store-id': session.storeId,
    }
  );
}

export function confirmCheckout(
  input: ConfirmCheckoutMutationInput['input'],
  session: CheckoutSession | undefined | null,
  apiHost?: string
): Promise<ResultOf<typeof ConfirmCheckoutSessionMutation>>;
export function confirmCheckout(
  input: ConfirmCheckoutMutationInput['input'],
  auth: { accessToken: string | undefined },
  apiHost?: string
): Promise<ResultOf<typeof ConfirmCheckoutSessionMutation>>;
export function confirmCheckout(
  input: ConfirmCheckoutMutationInput['input'],
  sessionOrAuth:
    | CheckoutSession
    | undefined
    | null
    | { accessToken: string | undefined },
  apiHost?: string
) {
  const GODADDY_HOST = getHostByEnvironment(apiHost);

  if (sessionOrAuth && 'accessToken' in sessionOrAuth) {
    if (!sessionOrAuth.accessToken) {
      throw new Error('No access token provided');
    }
    return graphqlRequestWithErrors<
      ResultOf<typeof ConfirmCheckoutSessionMutation>
    >(
      GODADDY_HOST,
      ConfirmCheckoutSessionMutation,
      { input },
      {
        Authorization: `Bearer ${sessionOrAuth.accessToken}`,
      }
    );
  }

  const session = sessionOrAuth;
  if (!session?.token || !session?.id) {
    throw new Error('No session token or ID provided');
  }

  return graphqlRequestWithErrors<
    ResultOf<typeof ConfirmCheckoutSessionMutation>
  >(
    GODADDY_HOST,
    ConfirmCheckoutSessionMutation,
    { input, sessionId: session.id },
    {
      'x-session-token': `${session.token}`,
      'x-session-id': session.id,
      'x-store-id': session.storeId,
    }
  );
}

export function getDraftOrderShippingMethods(
  session: CheckoutSession | undefined | null,
  destination?: GetCheckoutSessionShippingRatesInput['destination'],
  apiHost?: string
): Promise<ResultOf<typeof DraftOrderShippingRatesQuery>>;
export function getDraftOrderShippingMethods(
  auth: { accessToken: string | undefined },
  destination?: GetCheckoutSessionShippingRatesInput['destination'],
  apiHost?: string
): Promise<ResultOf<typeof DraftOrderShippingRatesQuery>>;
export function getDraftOrderShippingMethods(
  sessionOrAuth:
    | CheckoutSession
    | undefined
    | null
    | { accessToken: string | undefined },
  destination?: GetCheckoutSessionShippingRatesInput['destination'],
  apiHost?: string
) {
  const GODADDY_HOST = getHostByEnvironment(apiHost);

  if (sessionOrAuth && 'accessToken' in sessionOrAuth) {
    if (!sessionOrAuth.accessToken) {
      throw new Error('No access token provided');
    }
    return graphqlRequestWithErrors<
      ResultOf<typeof DraftOrderShippingRatesQuery>
    >(
      GODADDY_HOST,
      DraftOrderShippingRatesQuery,
      { destination },
      {
        Authorization: `Bearer ${sessionOrAuth.accessToken}`,
      }
    );
  }

  const session = sessionOrAuth;
  if (!session?.token || !session?.id) {
    throw new Error('No session token or ID provided');
  }

  return graphqlRequestWithErrors<
    ResultOf<typeof DraftOrderShippingRatesQuery>
  >(
    GODADDY_HOST,
    DraftOrderShippingRatesQuery,
    { destination },
    {
      'x-session-token': `${session.token}`,
      'x-session-id': session.id,
      'x-store-id': session.storeId,
    }
  );
}

export function applyDeliveryMethod(
  input: ApplyCheckoutSessionDeliveryMethodInput['input'],
  session: CheckoutSession | undefined | null,
  apiHost?: string
): Promise<ResultOf<typeof ApplyCheckoutSessionDeliveryMethodMutation>>;
export function applyDeliveryMethod(
  input: ApplyCheckoutSessionDeliveryMethodInput['input'],
  auth: { accessToken: string | undefined },
  apiHost?: string
): Promise<ResultOf<typeof ApplyCheckoutSessionDeliveryMethodMutation>>;
export function applyDeliveryMethod(
  input: ApplyCheckoutSessionDeliveryMethodInput['input'],
  sessionOrAuth:
    | CheckoutSession
    | undefined
    | null
    | { accessToken: string | undefined },
  apiHost?: string
) {
  const GODADDY_HOST = getHostByEnvironment(apiHost);

  if (sessionOrAuth && 'accessToken' in sessionOrAuth) {
    if (!sessionOrAuth.accessToken) {
      throw new Error('No access token provided');
    }
    return graphqlRequestWithErrors<
      ResultOf<typeof ApplyCheckoutSessionDeliveryMethodMutation>
    >(
      GODADDY_HOST,
      ApplyCheckoutSessionDeliveryMethodMutation,
      { input },
      {
        Authorization: `Bearer ${sessionOrAuth.accessToken}`,
      }
    );
  }

  const session = sessionOrAuth;
  if (!session?.token || !session?.id) {
    throw new Error('No session token or ID provided');
  }

  return graphqlRequestWithErrors<
    ResultOf<typeof ApplyCheckoutSessionDeliveryMethodMutation>
  >(
    GODADDY_HOST,
    ApplyCheckoutSessionDeliveryMethodMutation,
    { input },
    {
      'x-session-token': `${session.token}`,
      'x-session-id': session.id,
      'x-store-id': session.storeId,
    }
  );
}

export function getDraftOrderPriceAdjustments(
  session: CheckoutSession | undefined | null,
  discountCodes?: DraftOrderPriceAdjustmentsQueryInput['discountCodes'],
  shippingLines?: DraftOrderPriceAdjustmentsQueryInput['shippingLines'],
  apiHost?: string
): Promise<ResultOf<typeof DraftOrderPriceAdjustmentsQuery>>;
export function getDraftOrderPriceAdjustments(
  auth: { accessToken: string | undefined },
  discountCodes?: DraftOrderPriceAdjustmentsQueryInput['discountCodes'],
  shippingLines?: DraftOrderPriceAdjustmentsQueryInput['shippingLines'],
  apiHost?: string
): Promise<ResultOf<typeof DraftOrderPriceAdjustmentsQuery>>;
export function getDraftOrderPriceAdjustments(
  sessionOrAuth:
    | CheckoutSession
    | undefined
    | null
    | { accessToken: string | undefined },
  discountCodes?: DraftOrderPriceAdjustmentsQueryInput['discountCodes'],
  shippingLines?: DraftOrderPriceAdjustmentsQueryInput['shippingLines'],
  apiHost?: string
) {
  const GODADDY_HOST = getHostByEnvironment(apiHost);

  if (sessionOrAuth && 'accessToken' in sessionOrAuth) {
    if (!sessionOrAuth.accessToken) {
      throw new Error('No access token provided');
    }
    return graphqlRequestWithErrors<
      ResultOf<typeof DraftOrderPriceAdjustmentsQuery>
    >(
      GODADDY_HOST,
      DraftOrderPriceAdjustmentsQuery,
      { shippingLines, discountCodes },
      {
        Authorization: `Bearer ${sessionOrAuth.accessToken}`,
      }
    );
  }

  const session = sessionOrAuth;
  if (!session?.token || !session?.id) {
    throw new Error('No session token or ID provided');
  }

  return graphqlRequestWithErrors<
    ResultOf<typeof DraftOrderPriceAdjustmentsQuery>
  >(
    GODADDY_HOST,
    DraftOrderPriceAdjustmentsQuery,
    { shippingLines, discountCodes },
    {
      'x-session-token': `${session.token}`,
      'x-session-id': session.id,
      'x-store-id': session.storeId,
    }
  );
}

export function applyFulfillmentLocation(
  input: ApplyCheckoutSessionFulfillmentLocationInput['input'],
  session: CheckoutSession | undefined,
  apiHost?: string
): Promise<ResultOf<typeof ApplyCheckoutSessionFulfillmentLocationMutation>>;
export function applyFulfillmentLocation(
  input: ApplyCheckoutSessionFulfillmentLocationInput['input'],
  auth: { accessToken: string | undefined },
  apiHost?: string
): Promise<ResultOf<typeof ApplyCheckoutSessionFulfillmentLocationMutation>>;
export function applyFulfillmentLocation(
  input: ApplyCheckoutSessionFulfillmentLocationInput['input'],
  sessionOrAuth:
    | CheckoutSession
    | undefined
    | { accessToken: string | undefined },
  apiHost?: string
) {
  const GODADDY_HOST = getHostByEnvironment(apiHost);

  if (sessionOrAuth && 'accessToken' in sessionOrAuth) {
    if (!sessionOrAuth.accessToken) {
      throw new Error('No access token provided');
    }
    return graphqlRequestWithErrors<
      ResultOf<typeof ApplyCheckoutSessionFulfillmentLocationMutation>
    >(
      GODADDY_HOST,
      ApplyCheckoutSessionFulfillmentLocationMutation,
      { input },
      {
        Authorization: `Bearer ${sessionOrAuth.accessToken}`,
      }
    );
  }

  const session = sessionOrAuth;
  if (!session?.token || !session?.id) {
    throw new Error('No session token or ID provided');
  }

  return graphqlRequestWithErrors<
    ResultOf<typeof ApplyCheckoutSessionFulfillmentLocationMutation>
  >(
    GODADDY_HOST,
    ApplyCheckoutSessionFulfillmentLocationMutation,
    { input },
    {
      'x-session-token': `${session.token}`,
      'x-session-id': session.id,
      'x-store-id': session.storeId,
    }
  );
}
