import { DeliveryMethods } from '@/components/checkout/delivery/delivery-methods';
import { PaymentMethodType, type PaymentMethodValue } from '@/types';

export type BillingCollectionMode = 'none' | 'names' | 'address';

export type BillingCollectionLocation =
  | 'none'
  | 'top-level'
  | 'inline-payment-form'
  | 'free-payment-form';

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
  if (usesShippingAddress) return 'none';

  if (deliveryMethod === DeliveryMethods.PICKUP) return 'names';

  if (
    deliveryMethod === DeliveryMethods.PURCHASE ||
    deliveryMethod === DeliveryMethods.DIGITAL
  ) {
    if (!enableTaxCollection) return 'names';
    return enableBillingAddressCollection ? 'address' : 'names';
  }

  return enableBillingAddressCollection ? 'address' : 'names';
}

function getPaidStandardBillingMode({
  usesShippingAddress,
  enableBillingAddressCollection,
}: Pick<BillingPolicyInput, 'enableBillingAddressCollection'> & {
  usesShippingAddress: boolean;
}): BillingCollectionMode {
  if (usesShippingAddress) return 'none';

  return enableBillingAddressCollection ? 'address' : 'names';
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

  if (mode === 'none') {
    return { mode, location: 'none', usesShippingAddress };
  }

  if (isFreeOrder) {
    return { mode, location: 'free-payment-form', usesShippingAddress };
  }

  if (isInline) {
    return { mode, location: 'inline-payment-form', usesShippingAddress };
  }

  return { mode, location: 'top-level', usesShippingAddress };
}
