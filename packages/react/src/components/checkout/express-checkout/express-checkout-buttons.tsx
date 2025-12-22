import React from 'react';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { CheckoutSection } from '@/components/checkout/checkout-section';
import { PaymentMethodRenderer } from '@/components/checkout/payment/payment-method-renderer';
import { CheckoutTargetSlot } from '@/components/checkout/target/target';
import { eventIds } from '@/tracking/events';
import { TrackingEventType, track } from '@/tracking/track';
import type { AvailablePaymentProviders, PaymentMethodValue } from '@/types';

export function ExpressCheckoutButtons() {
  const { session } = useCheckoutContext();

  // Track express checkout impression when the component loads
  React.useEffect(() => {
    track({
      eventId: eventIds.expressCheckoutImpression,
      type: TrackingEventType.IMPRESSION,
      properties: {
        availableMethods: Object.keys(session?.paymentMethods || {})
          .filter(provider => {
            const method =
              session?.paymentMethods?.[provider as PaymentMethodValue];
            return (
              method &&
              Array.isArray(method.checkoutTypes) &&
              method.checkoutTypes.includes('express')
            );
          })
          .join(','),
      },
    });
  }, [session?.paymentMethods]);

  const expressProviders = React.useMemo(() => {
    if (!session?.paymentMethods) return [];

    return Object.entries(session.paymentMethods)
      .filter(
        ([, method]) =>
          method &&
          Array.isArray(method.checkoutTypes) &&
          method.checkoutTypes.includes('express')
      )
      .map(([provider]) => provider);
  }, [session?.paymentMethods]);

  const availableExpressButtons = expressProviders
    .map(provider => {
      const processor =
        session?.paymentMethods?.[provider as PaymentMethodValue]?.processor;

      return (
        <PaymentMethodRenderer
          key={`express-${provider}`}
          isExpress
          type='button'
          method={provider as PaymentMethodValue}
          provider={processor as AvailablePaymentProviders}
        />
      );
    })
    .filter(Boolean);

  if (availableExpressButtons.length === 0) {
    return null;
  }

  return (
    <CheckoutSection style={{ gridArea: 'express-checkout' }}>
      <CheckoutTargetSlot id='checkout.form.express-checkout.before' />
      <div className='grid gap-4 mb-0'>
        <div className='flex flex-col gap-3'>{availableExpressButtons}</div>
        <div className='relative'>
          <div
            aria-hidden='true'
            className='absolute inset-0 flex items-center'
          >
            <div className='w-full border-t border-border' />
          </div>
          <div className='relative flex justify-center'>
            <span className='bg-background px-4 text-sm font-medium text-foreground'>
              OR
            </span>
          </div>
        </div>
      </div>
      <CheckoutTargetSlot id='checkout.form.express-checkout.after' />
    </CheckoutSection>
  );
}
