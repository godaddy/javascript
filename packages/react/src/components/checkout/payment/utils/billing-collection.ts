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

function getOfflineBillingMode({
  deliveryMethod,
  paymentUseShippingAddress,
  enableBillingAddressCollection,
  enableTaxCollection,
}: Pick<
  BillingPolicyInput,
  | 'deliveryMethod'
  | 'paymentUseShippingAddress'
  | 'enableBillingAddressCollection'
  | 'enableTaxCollection'
>): BillingCollectionMode {
  if (
    deliveryMethod === DeliveryMethods.SHIP &&
    paymentUseShippingAddress
  ) {
    return 'none';
  }

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
  deliveryMethod,
  paymentUseShippingAddress,
  enableBillingAddressCollection,
}: Pick<
  BillingPolicyInput,
  | 'deliveryMethod'
  | 'paymentUseShippingAddress'
  | 'enableBillingAddressCollection'
>): BillingCollectionMode {
  if (
    deliveryMethod === DeliveryMethods.SHIP &&
    paymentUseShippingAddress
  ) {
    return 'none';
  }

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
  enableBillingAddressCollection,
  enableTaxCollection,
}: BillingPolicyInput): BillingPolicy {
  const usesShippingAddress = Boolean(
    deliveryMethod === DeliveryMethods.SHIP && paymentUseShippingAddress
  );
  const effectivePaymentMethod = isFreeOrder
    ? PaymentMethodType.OFFLINE
    : paymentMethod;
  const isOffline = effectivePaymentMethod === PaymentMethodType.OFFLINE;
  const isInline = isInlineBillingPaymentMethod(effectivePaymentMethod);
  const mode = isOffline
    ? getOfflineBillingMode({
        deliveryMethod,
        paymentUseShippingAddress,
        enableBillingAddressCollection,
        enableTaxCollection,
      })
    : getPaidStandardBillingMode({
        deliveryMethod,
        paymentUseShippingAddress,
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
