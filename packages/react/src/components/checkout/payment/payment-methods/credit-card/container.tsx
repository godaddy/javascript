import type { ReactNode } from 'react';
import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { AddressForm } from '@/components/checkout/address';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { CheckoutSection } from '@/components/checkout/checkout-section';
import { CheckoutSectionHeader } from '@/components/checkout/checkout-section-header';
import { DeliveryMethods } from '@/components/checkout/delivery/delivery-method';
import { PaymentAddressToggle } from '@/components/checkout/payment/utils/payment-address-toggle';
import { useGoDaddyContext } from '@/godaddy-provider';
import { PaymentMethodType } from '@/types';

export function CreditCardContainer({ children }: { children?: ReactNode }) {
  const { session } = useCheckoutContext();
  const form = useFormContext();
  const { t } = useGoDaddyContext();
  const paymentMethod = form.watch('paymentMethod');
  const useShippingAddress = form.watch('paymentUseShippingAddress');
  const deliveryMethod = form.watch('deliveryMethod');
  const isShipping = deliveryMethod === DeliveryMethods.SHIP;
  const isPickup = deliveryMethod === DeliveryMethods.PICKUP;
  const shouldShowBillingNamesOnly =
    paymentMethod === PaymentMethodType.CREDIT_CARD &&
    session?.enableBillingAddressCollection === false &&
    !useShippingAddress;

  const isBillingAddressRequired =
    !session?.enableShipping ||
    shouldShowBillingNamesOnly ||
    (session?.enableBillingAddressCollection &&
      (!useShippingAddress || isPickup) &&
      paymentMethod === PaymentMethodType.CREDIT_CARD);

  const billingCopy =
    shouldShowBillingNamesOnly && t.payment.billingInformation
      ? t.payment.billingInformation
      : t.payment.billingAddress;

  const getPaymentMethodDescription = useCallback((): string | undefined => {
    if (paymentMethod === 'card') {
      return t.payment.descriptions?.creditCard;
    }
    return undefined;
  }, [paymentMethod, t]);

  const description = getPaymentMethodDescription();

  if (!children) return null;

  return (
    <>
      {description && <div className='pb-4'>{description}</div>}
      {children}
      {session?.enableShipping &&
        isShipping &&
        paymentMethod === PaymentMethodType.CREDIT_CARD && (
          <PaymentAddressToggle className='pt-4' />
        )}
      {isBillingAddressRequired ? (
        <CheckoutSection className='pt-5'>
          <CheckoutSectionHeader
            title={billingCopy.title}
            description={billingCopy.description}
          />
          <AddressForm
            sectionKey='billing'
            onlyNames={shouldShowBillingNamesOnly}
          />
        </CheckoutSection>
      ) : null}
    </>
  );
}
