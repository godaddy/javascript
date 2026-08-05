'use client';

import { useDebouncedValue } from '@tanstack/react-pacer';
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useCheckoutContext } from '@/components/checkout/checkout';
import {
  useDraftOrderFieldDirtyMarker,
  useRegisterDraftOrderFieldSync,
} from '@/components/checkout/order/use-draft-order-sync';
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useGoDaddyContext } from '@/godaddy-provider';
import { eventIds } from '@/tracking/events';
import { TrackingEventType, track } from '@/tracking/track';

export function NotesForm() {
  const form = useFormContext();
  const { t } = useGoDaddyContext();
  const { isConfirmingCheckout, requiredFields } = useCheckoutContext();
  const notesField = form.watch('notes');

  const [notes] = useDebouncedValue(notesField, {
    wait: 1000,
  });

  // Track when notes are added (debounced)
  React.useEffect(() => {
    if (notes && notes.trim() !== '') {
      track({
        eventId: eventIds.addOrderNote,
        type: TrackingEventType.CLICK,
        properties: {
          hasNotes: true,
          noteLength: notes.length,
        },
      });
    }
  }, [notes]);

  useRegisterDraftOrderFieldSync(
    React.useMemo(
      () => ({
        id: 'notes',
        fieldNames: ['notes'],
        debounceMs: 1000,
        enabled: ({ values, draftOrder }) => {
          if (!draftOrder) return false;
          const orderNotes =
            draftOrder.notes?.find(note => note.authorType === 'CUSTOMER')
              ?.content || '';
          return orderNotes !== (values.notes || '');
        },
        buildPatch: ({ values }) => ({
          notes: values.notes?.trim()
            ? [
                {
                  authorType: 'CUSTOMER',
                  content: values.notes.trim(),
                },
              ]
            : null,
        }),
      }),
      []
    )
  );
  useDraftOrderFieldDirtyMarker({
    id: 'notes',
    fieldNames: ['notes'],
    disabled: isConfirmingCheckout,
  });

  return (
    <div>
      <FormField
        control={form.control}
        name='notes'
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel className='sr-only'>{t.general.notes}</FormLabel>
            <Textarea
              autoResize
              placeholder={t.shipping.notesPlaceholder}
              {...field}
              hasError={!!fieldState.error}
              aria-required={requiredFields?.notes}
              disabled={isConfirmingCheckout}
            />
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
