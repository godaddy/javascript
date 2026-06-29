import { Store, Truck } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  type CheckoutFormData,
  useCheckoutContext,
} from '@/components/checkout/checkout';
import { useIsPaymentDisabled } from '@/components/checkout/payment/utils/use-is-payment-disabled';
import { FormControl, FormField, FormItem } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useGoDaddyContext } from '@/godaddy-provider';
import { cn } from '@/lib/utils';
import { eventIds } from '@/tracking/events';
import { TrackingEventType, track } from '@/tracking/track';
import { DeliveryMethods } from './delivery-methods';

export { DeliveryMethods };

export interface DeliveryMethod {
  id: CheckoutFormData['deliveryMethod'];
  name: string;
  description: string;
  icon: React.ReactNode;
}

const DELIVERY_METHODS: DeliveryMethod[] = [
  {
    id: DeliveryMethods.SHIP,
    name: 'Shipping', // This will be replaced with localized version in component
    description: 'Ship to your address', // This will be replaced with localized version in component
    icon: <Truck className='h-4 w-4 opacity-50' />,
  },
  {
    id: DeliveryMethods.PICKUP,
    name: 'Local Pickup', // This will be replaced with localized version in component
    description: 'Pick up from store location', // This will be replaced with localized version in component
    icon: <Store className='h-4 w-4 opacity-50' />,
  },
];

export function DeliveryMethodForm() {
  const { t } = useGoDaddyContext();
  const form = useFormContext();
  const { session, isConfirmingCheckout } = useCheckoutContext();
  const isPaymentDisabled = useIsPaymentDisabled();
  const isDisabled = isConfirmingCheckout || isPaymentDisabled;

  const handleDeliveryMethodChange = (value: DeliveryMethods) => {
    if (isDisabled || form.getValues('deliveryMethod') === value) return;

    form.setValue('deliveryMethod', value, {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (value === DeliveryMethods.PICKUP) {
      form.setValue('shippingMethod', undefined, { shouldDirty: true });
    }
    track({
      eventId: eventIds.changeDeliveryMethod,
      type: TrackingEventType.CLICK,
      properties: {
        deliveryMethod: value,
      },
    });
  };

  const getDeliveryMethodLabel = (methodId: DeliveryMethods) => {
    switch (methodId) {
      case DeliveryMethods.SHIP:
        return t.delivery.shipping;
      case DeliveryMethods.PICKUP:
        return t.delivery.localPickup;
      default:
        return methodId;
    }
  };

  const getDeliveryMethodDescription = (methodId: DeliveryMethods) => {
    switch (methodId) {
      case DeliveryMethods.SHIP:
        return t.delivery.shipToAddress;
      case DeliveryMethods.PICKUP:
        return t.delivery.pickupFromStore;
      default:
        return undefined;
    }
  };

  const availableMethods = useMemo(
    () => [
      ...(session?.enableShipping ? [DELIVERY_METHODS[0]] : []),
      ...(session?.enableLocalPickup ? [DELIVERY_METHODS[1]] : []),
    ],
    [session?.enableShipping, session?.enableLocalPickup]
  );

  // Set default delivery method when component loads
  useEffect(() => {
    const currentValue = form.getValues('deliveryMethod');
    const isCurrentValueValid = availableMethods.some(
      method => method.id === currentValue
    );

    if (!currentValue || !isCurrentValueValid) {
      const defaultMethod =
        availableMethods.length === 1
          ? availableMethods[0].id
          : DeliveryMethods.SHIP;
      form.setValue('deliveryMethod', defaultMethod);
    }
  }, [availableMethods, form]);

  if (availableMethods.length === 0) {
    return null;
  }

  return (
    <div className='space-y-2'>
      <div>
        <Label>{t.delivery.method}</Label>
      </div>
      {availableMethods.length === 1 ? (
        <Label htmlFor={availableMethods[0].id} className='font-medium'>
          <div className='flex items-center justify-between space-x-2 bg-card border border-border p-2 px-4 rounded-md'>
            <div className='flex items-center space-x-4'>
              <div className='inline-flex flex-col'>
                {getDeliveryMethodLabel(availableMethods[0].id)}
                {getDeliveryMethodDescription(availableMethods[0].id) ? (
                  <p className='text-xs text-muted-foreground'>
                    {getDeliveryMethodDescription(availableMethods[0].id)}
                  </p>
                ) : null}
              </div>
            </div>
            <div className='flex items-center'>{availableMethods[0].icon}</div>
          </div>
        </Label>
      ) : (
        <FormField
          control={form.control}
          name='deliveryMethod'
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={handleDeliveryMethodChange}
                  required
                  disabled={isDisabled}
                >
                  {availableMethods.map((method, index) => (
                    <Label
                      key={method.id}
                      htmlFor={method.id}
                      className={cn(
                        'font-medium',
                        isDisabled && 'cursor-not-allowed opacity-60'
                      )}
                    >
                      <div
                        className={cn(
                          'flex items-center justify-between space-x-2 bg-card border border-border p-2 px-4',
                          !isDisabled && 'hover:bg-muted cursor-pointer',
                          isDisabled && 'pointer-events-none',
                          index === 0 ? 'rounded-t-md' : 'border-t-0',
                          index === availableMethods.length - 1 &&
                            'rounded-b-md',
                          method.id === field.value && 'bg-muted'
                        )}
                      >
                        <div className='flex items-center space-x-4'>
                          <FormControl>
                            <RadioGroupItem
                              value={method.id}
                              id={method.id}
                              aria-label={getDeliveryMethodLabel(method.id)}
                            />
                          </FormControl>
                          <div className='inline-flex flex-col'>
                            {getDeliveryMethodLabel(method.id)}
                            {getDeliveryMethodDescription(method.id) ? (
                              <p className='text-xs text-muted-foreground'>
                                {getDeliveryMethodDescription(method.id)}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <div className='flex items-center'>{method.icon}</div>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
