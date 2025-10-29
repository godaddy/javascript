import { CircleAlert } from 'lucide-react';
import React from 'react';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useGoDaddyContext } from '@/godaddy-provider';
import { eventIds } from '@/tracking/events';
import { TrackingEventType, track } from '@/tracking/track';

export function CheckoutErrorList() {
  const { t } = useGoDaddyContext();
  const { checkoutErrors, isCheckoutDisabled } = useCheckoutContext();
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (checkoutErrors?.length && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Track checkout errors
      track({
        eventId: eventIds.formError,
        type: TrackingEventType.EVENT,
        properties: {
          errorCodes: checkoutErrors.join(','),
          errorCount: checkoutErrors.length,
        },
      });
    }
  }, [checkoutErrors]);

  if (!checkoutErrors?.length && !isCheckoutDisabled) return null;

  return (
    <div ref={ref} className='mb-4 rounded-md border border-destructive bg-destructive/10 p-4'>
      <div className='flex items-start'>
        <CircleAlert className='text-destructive w-5 h-5 mr-3' />
        <ul className='text-destructive-foreground list-disc pl-5'>
          {checkoutErrors?.map(code => (
            <li key={code} className='text-sm'>
              {t.apiErrors?.[code as keyof typeof t.apiErrors] || code}
            </li>
          ))}
          {isCheckoutDisabled && <li className='text-sm'>{t.general.checkoutDisabled}</li>}
        </ul>
      </div>
    </div>
  );
}
