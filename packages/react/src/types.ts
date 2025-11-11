import type { ResultOf, VariablesOf } from 'gql.tada';
import {
  SkuGroupQuery,
  SkuGroupsQuery,
  SkuQuery,
} from '@/lib/godaddy/catalog-storefront-queries.ts';
import type {
  ApplyCheckoutSessionDeliveryMethodMutation,
  ApplyCheckoutSessionDiscountMutation,
  ApplyCheckoutSessionFulfillmentLocationMutation,
  ApplyCheckoutSessionShippingMethodMutation,
  CalculateCheckoutSessionTaxesMutation,
  ConfirmCheckoutSessionMutation,
  CreateCheckoutSessionMutation,
  RemoveAppliedCheckoutSessionShippingMethodMutation,
  UpdateCheckoutSessionDraftOrderMutation,
  VerifyCheckoutSessionAddressMutation,
} from '@/lib/godaddy/checkout-mutations.ts';
import {
  DraftOrderPriceAdjustmentsQuery,
  DraftOrderQuery,
  DraftOrderShippingRatesQuery,
  DraftOrderSkusQuery,
  DraftOrderTaxesQuery,
} from '@/lib/godaddy/checkout-queries.ts';

export const PaymentProvider = {
  STRIPE: 'stripe',
  GOOGLE: 'google',
  GODADDY: 'godaddy',
  APPLE: 'apple',
  SQUARE: 'square',
  PAYPAL: 'paypal',
  PAZE: 'paze',
  OFFLINE: 'offline',
} as const;

export const CheckoutType = {
  EXPRESS: 'express',
  STANDARD: 'standard',
};

// Extract values from the object to create a union type
export type AvailablePaymentProviders =
  (typeof PaymentProvider)[keyof typeof PaymentProvider];

export const PaymentMethodType = {
  CREDIT_CARD: 'card',
  EXPRESS: 'express',
  PAYPAL: 'paypal',
  APPLE_PAY: 'applePay',
  GOOGLE_PAY: 'googlePay',
  OFFLINE: 'offline',
  PAZE: 'paze',
} as const;

// Union of all payment method keys
export type PaymentMethodKey = keyof typeof PaymentMethodType;

export type PaymentMethodValue =
  (typeof PaymentMethodType)[keyof typeof PaymentMethodType];

// Payment method config type
export type PaymentMethodConfig = {
  type: PaymentMethodValue;
  processor: AvailablePaymentProviders;
  checkoutTypes: Array<(typeof CheckoutType)[keyof typeof CheckoutType]>;
};

// Payment methods object type
export type PaymentMethods = {
  [K in PaymentMethodKey]: PaymentMethodConfig | null;
};

export interface CheckoutSessionOptions {
  auth?: {
    clientId: string;
    clientSecret: string;
  };
}

export type $Values<T> = T[keyof T];

export type CheckoutSession = CheckoutSessionResult & CheckoutSessionOptions;

export type CheckoutSessionResult = ResultOf<
  typeof CreateCheckoutSessionMutation
>['createCheckoutSession'];

export type CheckoutSessionInput = VariablesOf<
  typeof CreateCheckoutSessionMutation
>;

export type DraftOrderSession = ResultOf<typeof DraftOrderQuery>;

export type DraftOrder = NonNullable<
  NonNullable<ResultOf<typeof DraftOrderQuery>['checkoutSession']>['draftOrder']
>;

export type Totals = NonNullable<
  NonNullable<
    NonNullable<
      ResultOf<typeof DraftOrderQuery>['checkoutSession']
    >['draftOrder']
  >['totals']
>;

export type ShippingLines = NonNullable<
  NonNullable<
    NonNullable<
      NonNullable<
        ResultOf<typeof DraftOrderQuery>['checkoutSession']
      >['draftOrder']
    >['shippingLines']
  >[number]
>;

export type UpdateDraftOrderInput = VariablesOf<
  typeof UpdateCheckoutSessionDraftOrderMutation
>;

export type ApplyCheckoutSessionDiscountInput = VariablesOf<
  typeof ApplyCheckoutSessionDiscountMutation
>;

export type ApplyCheckoutSessionShippingMethodInput = VariablesOf<
  typeof ApplyCheckoutSessionShippingMethodMutation
>;

export type ApplyCheckoutSessionDeliveryMethodInput = VariablesOf<
  typeof ApplyCheckoutSessionDeliveryMethodMutation
>;

export type ApplyCheckoutSessionFulfillmentLocationInput = VariablesOf<
  typeof ApplyCheckoutSessionFulfillmentLocationMutation
>;

export type RemoveAppliedCheckoutSessionShippingMethodInput = VariablesOf<
  typeof RemoveAppliedCheckoutSessionShippingMethodMutation
>;

export type CalculateCheckoutSessionTaxesInput = VariablesOf<
  typeof CalculateCheckoutSessionTaxesMutation
>;

export type MutationVerifyAddress = ResultOf<
  typeof VerifyCheckoutSessionAddressMutation
>;

export type ConfirmCheckoutMutationInput = VariablesOf<
  typeof ConfirmCheckoutSessionMutation
>;

export type GetCheckoutSessionShippingRatesInput = VariablesOf<
  typeof DraftOrderShippingRatesQuery
>;

export type DraftOrderPriceAdjustmentsQueryInput = VariablesOf<
  typeof DraftOrderPriceAdjustmentsQuery
>;

export type GetCheckoutSessionTaxesInput = VariablesOf<
  typeof DraftOrderTaxesQuery
>;

export type ShippingMethod = NonNullable<
  NonNullable<
    NonNullable<
      NonNullable<
        ResultOf<typeof DraftOrderShippingRatesQuery>['checkoutSession']
      >['draftOrder']
    >['calculatedShippingRates']
  >['rates']
>[number];

export type Address = NonNullable<
  MutationVerifyAddress['verifyAddress']
>[number];

export type StoreHours = NonNullable<
  NonNullable<CheckoutSession>['locations']
>[number]['operatingHours'];

export type CheckoutSessionLocation = NonNullable<
  NonNullable<CheckoutSession>['locations']
>[number];

export type SKUProduct = NonNullable<
  NonNullable<
    NonNullable<
      NonNullable<
        ResultOf<typeof DraftOrderSkusQuery>['checkoutSession']
      >['skus']
    >['edges']
  >[number]
>['node'];

export type SkuGroupsInput = VariablesOf<typeof SkuGroupsQuery>;

export type SkuGroupInput = VariablesOf<typeof SkuGroupQuery>;

export type SKUGroup = NonNullable<ResultOf<typeof SkuGroupQuery>['skuGroup']>;

export type SKUGroupAttribute = NonNullable<
  NonNullable<
    NonNullable<
      NonNullable<ResultOf<typeof SkuGroupQuery>['skuGroup']>['attributes']
    >['edges']
  >[number]
>['node'];

export type SKUGroupAttributeValue = NonNullable<
  NonNullable<
    NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<
            NonNullable<
              NonNullable<
                ResultOf<typeof SkuGroupQuery>['skuGroup']
              >['attributes']
            >['edges']
          >[number]
        >['node']
      >['values']
    >['edges']
  >[number]
>['node'];

export type SKUGroupSKU = NonNullable<
  NonNullable<
    NonNullable<
      NonNullable<ResultOf<typeof SkuGroupQuery>['skuGroup']>['skus']
    >['edges']
  >[number]
>['node'];

export type SkuInput = VariablesOf<typeof SkuQuery>;

export type SKU = NonNullable<ResultOf<typeof SkuQuery>['sku']>;

export type SKUPrice = NonNullable<
  NonNullable<
    NonNullable<
      NonNullable<ResultOf<typeof SkuQuery>['sku']>['prices']
    >['edges']
  >[number]
>['node'];

export type SKUInventoryCount = NonNullable<
  NonNullable<
    NonNullable<
      NonNullable<ResultOf<typeof SkuQuery>['sku']>['inventoryCounts']
    >['edges']
  >[number]
>['node'];

export type SKUMedia = NonNullable<
  NonNullable<
    NonNullable<
      NonNullable<ResultOf<typeof SkuQuery>['sku']>['mediaObjects']
    >['edges']
  >[number]
>['node'];

export type SKUAttributeValue = NonNullable<
  NonNullable<
    NonNullable<
      NonNullable<ResultOf<typeof SkuQuery>['sku']>['attributeValues']
    >['edges']
  >[number]
>['node'];
