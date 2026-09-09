import { DeliveryMethods } from '@/components/checkout/delivery/delivery-methods';
import { PaymentMethodType, type PaymentMethodValue } from '@/types';

export const BillingCollectionModes = {
  NONE: 'none',
  NAMES: 'names',
  ADDRESS: 'address',
} as const;

export type BillingCollectionMode =
  (typeof BillingCollectionModes)[keyof typeof BillingCollectionModes];

export const BillingCollectionLocations = {
  NONE: 'none',
  TOP_LEVEL: 'top-level',
  INLINE_PAYMENT_FORM: 'inline-payment-form',
  FREE_PAYMENT_FORM: 'free-payment-form',
} as const;

export type BillingCollectionLocation =
  (typeof BillingCollectionLocations)[keyof typeof BillingCollectionLocations];

export type BillingPolicyInput = {
  isFreeOrder: boolean;
  paymentMethod?: PaymentMethodValue | string | null;
  deliveryMethod?: DeliveryMethods | string | null;
  paymentUseShippingAddress: boolean;
  enableShipping: boolean;
  enableShippingAddressCollection: boolean;
  enableBillingAddressCollection: boolean;
  enableTaxCollection: boolean;
};

export type BillingPolicy = {
  mode: BillingCollectionMode;
  location: BillingCollectionLocation;
  usesShippingAddress: boolean;
};

const INLINE_BILLING_PAYMENT_METHODS: PaymentMethodValue[] = [
  PaymentMethodType.CREDIT_CARD,
  PaymentMethodType.ACH,
];

export function canOfferShippingAddressAsBilling({
  deliveryMethod,
  enableShipping,
  enableShippingAddressCollection,
}: Pick<
  BillingPolicyInput,
  'deliveryMethod' | 'enableShipping' | 'enableShippingAddressCollection'
>) {
  return Boolean(
    deliveryMethod === DeliveryMethods.SHIP &&
      enableShipping &&
      enableShippingAddressCollection
  );
}

export function isUsingShippingAddressAsBilling({
  paymentUseShippingAddress,
  ...input
}: Pick<
  BillingPolicyInput,
  | 'deliveryMethod'
  | 'paymentUseShippingAddress'
  | 'enableShipping'
  | 'enableShippingAddressCollection'
>) {
  return canOfferShippingAddressAsBilling(input) && paymentUseShippingAddress;
}

function getOfflineBillingMode({
  deliveryMethod,
  usesShippingAddress,
  enableBillingAddressCollection,
  enableTaxCollection,
}: Pick<
  BillingPolicyInput,
  'deliveryMethod' | 'enableBillingAddressCollection' | 'enableTaxCollection'
> & {
  usesShippingAddress: boolean;
}): BillingCollectionMode {
  if (usesShippingAddress) return BillingCollectionModes.NONE;

  if (deliveryMethod === DeliveryMethods.PICKUP) {
    return BillingCollectionModes.NAMES;
  }

  if (
    deliveryMethod === DeliveryMethods.PURCHASE ||
    deliveryMethod === DeliveryMethods.DIGITAL
  ) {
    if (!enableTaxCollection) return BillingCollectionModes.NAMES;
    return enableBillingAddressCollection
      ? BillingCollectionModes.ADDRESS
      : BillingCollectionModes.NAMES;
  }

  return enableBillingAddressCollection
    ? BillingCollectionModes.ADDRESS
    : BillingCollectionModes.NAMES;
}

function getPaidStandardBillingMode({
  usesShippingAddress,
  enableBillingAddressCollection,
}: Pick<BillingPolicyInput, 'enableBillingAddressCollection'> & {
  usesShippingAddress: boolean;
}): BillingCollectionMode {
  if (usesShippingAddress) return BillingCollectionModes.NONE;

  return enableBillingAddressCollection
    ? BillingCollectionModes.ADDRESS
    : BillingCollectionModes.NAMES;
}

function isInlineBillingPaymentMethod(
  paymentMethod?: PaymentMethodValue | string | null
) {
  return Boolean(
    paymentMethod &&
      INLINE_BILLING_PAYMENT_METHODS.includes(
        paymentMethod as PaymentMethodValue
      )
  );
}

export function getBillingPolicy({
  isFreeOrder,
  paymentMethod,
  deliveryMethod,
  paymentUseShippingAddress,
  enableShipping,
  enableShippingAddressCollection,
  enableBillingAddressCollection,
  enableTaxCollection,
}: BillingPolicyInput): BillingPolicy {
  const usesShippingAddress = isUsingShippingAddressAsBilling({
    deliveryMethod,
    paymentUseShippingAddress,
    enableShipping,
    enableShippingAddressCollection,
  });
  const effectivePaymentMethod = isFreeOrder
    ? PaymentMethodType.OFFLINE
    : paymentMethod;
  const isOffline = effectivePaymentMethod === PaymentMethodType.OFFLINE;
  const isInline = isInlineBillingPaymentMethod(effectivePaymentMethod);
  const mode = isOffline
    ? getOfflineBillingMode({
        deliveryMethod,
        usesShippingAddress,
        enableBillingAddressCollection,
        enableTaxCollection,
      })
    : getPaidStandardBillingMode({
        usesShippingAddress,
        enableBillingAddressCollection,
      });

  if (mode === BillingCollectionModes.NONE) {
    return {
      mode,
      location: BillingCollectionLocations.NONE,
      usesShippingAddress,
    };
  }

  if (isFreeOrder) {
    return {
      mode,
      location: BillingCollectionLocations.FREE_PAYMENT_FORM,
      usesShippingAddress,
    };
  }

  if (isInline) {
    return {
      mode,
      location: BillingCollectionLocations.INLINE_PAYMENT_FORM,
      usesShippingAddress,
    };
  }

  return {
    mode,
    location: BillingCollectionLocations.TOP_LEVEL,
    usesShippingAddress,
  };
}
