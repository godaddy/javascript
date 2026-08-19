import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import type { CheckoutFormData } from '@/components/checkout/checkout';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { isFreeOrderTotal } from '@/components/checkout/order/is-free-order';
import { useDraftOrderTotals } from '@/components/checkout/order/use-draft-order';
import {
  type BillingPolicy,
  canOfferShippingAddressAsBilling,
  getBillingPolicy,
} from '@/components/checkout/payment/utils/billing-collection';
import type { CheckoutSession, Totals } from '@/types';

export function resolveBillingPolicyForCheckoutState(input: {
  values: Pick<
    CheckoutFormData,
    'paymentMethod' | 'deliveryMethod' | 'paymentUseShippingAddress'
  >;
  session?: CheckoutSession | null;
  totals?: Totals | null;
}): BillingPolicy {
  return getBillingPolicy({
    isFreeOrder: isFreeOrderTotal(input.totals),
    deliveryMethod: input.values.deliveryMethod,
    paymentMethod: input.values.paymentMethod,
    paymentUseShippingAddress: input.values.paymentUseShippingAddress !== false,
    enableShipping: input.session?.enableShipping !== false,
    enableShippingAddressCollection:
      input.session?.enableShippingAddressCollection !== false,
    enableBillingAddressCollection:
      input.session?.enableBillingAddressCollection !== false,
    enableTaxCollection: input.session?.enableTaxCollection === true,
  });
}

export function useCanOfferShippingAddressAsBilling() {
  const form = useFormContext<CheckoutFormData>();
  const { session } = useCheckoutContext();
  const deliveryMethod = form.watch('deliveryMethod');

  return useMemo(
    () =>
      canOfferShippingAddressAsBilling({
        deliveryMethod,
        enableShipping: session?.enableShipping !== false,
        enableShippingAddressCollection:
          session?.enableShippingAddressCollection !== false,
      }),
    [deliveryMethod, session]
  );
}

export function useBillingPolicy(): BillingPolicy {
  const form = useFormContext<CheckoutFormData>();
  const { session } = useCheckoutContext();
  const { data: totals } = useDraftOrderTotals();
  const paymentMethod = form.watch('paymentMethod');
  const deliveryMethod = form.watch('deliveryMethod');
  const paymentUseShippingAddress = form.watch('paymentUseShippingAddress');

  return useMemo(
    () =>
      resolveBillingPolicyForCheckoutState({
        values: {
          paymentMethod,
          deliveryMethod,
          paymentUseShippingAddress,
        },
        session,
        totals,
      }),
    [deliveryMethod, paymentMethod, paymentUseShippingAddress, session, totals]
  );
}
