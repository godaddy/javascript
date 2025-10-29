import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useClearBillingAddress } from '@/components/checkout/address/utils/use-clear-billing-address';
import { useSyncBillingAddressWithShippingAddress } from '@/components/checkout/address/utils/use-sync-billing-address';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useGoDaddyContext } from '@/godaddy-provider';
import { eventIds } from '@/tracking/events';
import { TrackingEventType, track } from '@/tracking/track';

export function PaymentAddressToggle({ className }: { className?: string }) {
  const { t } = useGoDaddyContext();
  const { isConfirmingCheckout } = useCheckoutContext();
  const form = useFormContext();
  const syncBillingAddressWithShippingAddress = useSyncBillingAddressWithShippingAddress();
  const clearBillingAddress = useClearBillingAddress();

  return (
    <div className={className}>
      <FormField
        control={form.control}
        name='paymentUseShippingAddress'
        render={({ field }) => (
          <FormItem className='flex items-center space-x-2'>
            <FormControl>
              <Checkbox
                disabled={isConfirmingCheckout}
                checked={field.value}
                tabIndex={0}
                onCheckedChange={value => {
                  form.setValue('paymentUseShippingAddress', value, {
                    shouldDirty: false,
                  });

                  // Track billing address toggle
                  track({
                    eventId: eventIds.toggleSameAsBillingAddress,
                    type: TrackingEventType.CLICK,
                    properties: {
                      useShippingAddress: !!value,
                    },
                  });

                  if (value) {
                    syncBillingAddressWithShippingAddress();
                  } else {
                    clearBillingAddress();
                  }
                }}
              />
            </FormControl>
            <FormLabel className='text-sm font-normal'>{t.payment.billingAddress.useShippingAddress}</FormLabel>
          </FormItem>
        )}
      />
    </div>
  );
}
