'use client';

import { useDebouncedValue } from '@tanstack/react-pacer';
import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useDraftOrder } from '@/components/checkout/order/use-draft-order';
import { useDraftOrderFieldSync } from '@/components/checkout/order/use-draft-order-sync';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useGoDaddyContext } from '@/godaddy-provider';
import { eventIds } from '@/tracking/events';
import { TrackingEventType, track } from '@/tracking/track';

export function ContactForm() {
  const form = useFormContext();
  const { t } = useGoDaddyContext();
  const { isConfirmingCheckout, requiredFields } = useCheckoutContext();
  const { data: draftOrder } = useDraftOrder();

  const contactEmail = form.watch('contactEmail');

  // Check if email values differ from order values
  const emailHasChanged = useMemo(() => {
    if (!draftOrder) return true; // If no order, allow sync

    const shippingEmailMissing = !draftOrder?.shipping?.email;
    const billingEmailMissing = !draftOrder?.billing?.email;

    const shippingIsDifferent = draftOrder?.shipping?.email !== contactEmail;
    const billingIsDifferent = draftOrder?.billing?.email !== contactEmail;

    return !!contactEmail?.trim() && (shippingEmailMissing || billingEmailMissing || shippingIsDifferent || billingIsDifferent);
  }, [draftOrder, contactEmail]);

  const [email] = useDebouncedValue(contactEmail, {
    wait: 1000,
  });

  useDraftOrderFieldSync({
    key: 'email',
    data: email,
    deps: [email, emailHasChanged, draftOrder],
    enabled: emailHasChanged && email?.trim() && email === contactEmail && !!draftOrder,
    fieldNames: ['contactEmail'],
    mapToInput: emailValue => {
      if (!draftOrder) return {};

      const shippingIsDifferent = draftOrder?.shipping?.email !== emailValue;
      const billingIsDifferent = draftOrder?.billing?.email !== emailValue;

      return {
        ...(shippingIsDifferent ? { shipping: { email: emailValue?.trim() } } : {}),
        ...(billingIsDifferent ? { billing: { email: emailValue?.trim() } } : {}),
      };
    },
  });

  return (
    <div>
      <FormField
        control={form.control}
        name='contactEmail'
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t.contact.email}</FormLabel>
            <FormControl>
              <Input
                disabled={isConfirmingCheckout}
                type='email'
                hasError={!!fieldState.error}
                aria-required={requiredFields?.contactEmail}
                {...field}
                onBlur={e => {
                  field.onBlur();

                  // Only track on blur if value is present and valid
                  if (e.target.value && !fieldState.error) {
                    track({
                      eventId: eventIds.changeEmail,
                      type: TrackingEventType.CLICK,
                      properties: {
                        hasValue: !!e.target.value,
                        isValid: !fieldState.error,
                      },
                    });
                  }
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
