import { useFormContext } from 'react-hook-form';
import type { CheckoutFormData } from '@/components/checkout/checkout';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { DeliveryMethods } from '@/components/checkout/delivery/delivery-methods';
import { PaymentMethodType, type PaymentMethodValue } from '@/types';

export type BillingCollectionMode = 'none' | 'names' | 'address';
export type BillingCollectionContext =
  | 'top-level'
  | 'inline-payment-form'
  | 'free-payment-form';

const INLINE_BILLING_PAYMENT_METHODS: PaymentMethodValue[] = [
  PaymentMethodType.CREDIT_CARD,
  PaymentMethodType.ACH,
];

export function hasInlineBillingForm(
  paymentMethod?: PaymentMethodValue | string | null
) {
  return Boolean(
    paymentMethod &&
      INLINE_BILLING_PAYMENT_METHODS.includes(
        paymentMethod as PaymentMethodValue
      )
  );
}

export function getBillingCollectionMode({
  context,
  deliveryMethod,
  paymentMethod,
  paymentUseShippingAddress = true,
  enableBillingAddressCollection = true,
  enableTaxCollection = false,
}: {
  context: BillingCollectionContext;
  deliveryMethod?: DeliveryMethods | string | null;
  paymentMethod?: PaymentMethodValue | string | null;
  paymentUseShippingAddress?: boolean | null;
  enableBillingAddressCollection?: boolean | null;
  enableTaxCollection?: boolean | null;
}): BillingCollectionMode {
  const isDigital = deliveryMethod === DeliveryMethods.DIGITAL;
  const isPickup = deliveryMethod === DeliveryMethods.PICKUP;
  const isShipping = deliveryMethod === DeliveryMethods.SHIP;
  const isOffline = paymentMethod === PaymentMethodType.OFFLINE;
  const inlineBilling = hasInlineBillingForm(paymentMethod);
  const billingAddressEnabled = enableBillingAddressCollection !== false;
  const billingIsSeparateFromShipping =
    !isShipping || !paymentUseShippingAddress;

  if (context === 'top-level') {
    if (inlineBilling) return 'none';

    if (isDigital) {
      if (!billingAddressEnabled) return 'names';
      if (isOffline && !enableTaxCollection) return 'names';
      return 'address';
    }

    if (isPickup && isOffline && !enableTaxCollection) return 'names';
    if (!billingIsSeparateFromShipping) return 'none';
    return billingAddressEnabled ? 'address' : 'names';
  }

  if (context === 'inline-payment-form') {
    if (!inlineBilling) return 'none';
    if (isDigital) return billingAddressEnabled ? 'address' : 'names';
    if (!billingIsSeparateFromShipping) return 'none';
    return billingAddressEnabled ? 'address' : 'names';
  }

  if (isDigital) {
    if (!enableTaxCollection) return 'names';
    return billingAddressEnabled ? 'address' : 'names';
  }

  if (isPickup) return 'names';

  return 'none';
}

export function useBillingCollectionMode({
  context,
}: {
  context: BillingCollectionContext;
}): BillingCollectionMode {
  const form = useFormContext<CheckoutFormData>();
  const { session } = useCheckoutContext();

  return getBillingCollectionMode({
    context,
    deliveryMethod: form.watch('deliveryMethod'),
    paymentMethod: form.watch('paymentMethod'),
    paymentUseShippingAddress: form.watch('paymentUseShippingAddress'),
    enableBillingAddressCollection: session?.enableBillingAddressCollection,
    enableTaxCollection: session?.enableTaxCollection,
  });
}
