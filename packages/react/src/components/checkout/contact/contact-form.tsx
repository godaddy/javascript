'use client';

import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useCheckoutContext } from '@/components/checkout/checkout';
import {
  useDraftOrderFieldDirtyMarker,
  useRegisterDraftOrderFieldSync,
} from '@/components/checkout/order/use-draft-order-sync';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useGoDaddyContext } from '@/godaddy-provider';
import { eventIds } from '@/tracking/events';
import { TrackingEventType, track } from '@/tracking/track';

export function ContactForm() {
  const form = useFormContext();
  const { t } = useGoDaddyContext();
  const { isConfirmingCheckout, requiredFields } = useCheckoutContext();

  useRegisterDraftOrderFieldSync(
    useMemo(
      () => ({
        id: 'contact-email',
        fieldNames: ['contactEmail'],
        debounceMs: 1000,
        enabled: ({ values, draftOrder: currentDraftOrder }) =>
          Boolean(
            currentDraftOrder &&
              values.contactEmail?.trim() &&
              (currentDraftOrder.shipping?.email !==
                values.contactEmail.trim() ||
                currentDraftOrder.billing?.email !== values.contactEmail.trim())
          ),
        buildPatch: ({ values, draftOrder: currentDraftOrder }) => {
          const email = values.contactEmail?.trim();
          if (!email || !currentDraftOrder) return null;

          return {
            ...(currentDraftOrder.shipping?.email !== email
              ? { shipping: { email } }
              : {}),
            ...(currentDraftOrder.billing?.email !== email
              ? { billing: { email } }
              : {}),
          };
        },
      }),
      []
    )
  );
  useDraftOrderFieldDirtyMarker({
    id: 'contact-email',
    fieldNames: ['contactEmail'],
    disabled: isConfirmingCheckout,
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
