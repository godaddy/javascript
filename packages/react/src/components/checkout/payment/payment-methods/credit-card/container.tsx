import type { ReactNode } from 'react';
import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { AddressForm } from '@/components/checkout/address';
import { CheckoutSection } from '@/components/checkout/checkout-section';
import { CheckoutSectionHeader } from '@/components/checkout/checkout-section-header';
import { PaymentAddressToggle } from '@/components/checkout/payment/utils/payment-address-toggle';
import {
  useBillingPolicy,
  useCanOfferShippingAddressAsBilling,
} from '@/components/checkout/payment/utils/use-billing-policy';
import { useGoDaddyContext } from '@/godaddy-provider';
import { PaymentMethodType } from '@/types';

export function CreditCardContainer({ children }: { children?: ReactNode }) {
  const form = useFormContext();
  const { t } = useGoDaddyContext();
  const paymentMethod = form.watch('paymentMethod');
  const billingPolicy = useBillingPolicy();
  const canOfferShippingAddressAsBilling =
    useCanOfferShippingAddressAsBilling();
  const shouldShowBilling =
    billingPolicy.location === 'inline-payment-form' &&
    paymentMethod === PaymentMethodType.CREDIT_CARD &&
    billingPolicy.mode !== 'none';

  const billingCopy =
    billingPolicy.mode === 'names' && t.payment.billingInformation
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
      {canOfferShippingAddressAsBilling &&
        paymentMethod === PaymentMethodType.CREDIT_CARD && (
          <PaymentAddressToggle className='pt-4' />
        )}
      {shouldShowBilling ? (
        <CheckoutSection className='pt-5'>
          <CheckoutSectionHeader
            title={billingCopy.title}
            description={billingCopy.description}
          />
          <AddressForm
            sectionKey='billing'
            onlyNames={billingPolicy.mode === 'names'}
          />
        </CheckoutSection>
      ) : null}
    </>
  );
}
