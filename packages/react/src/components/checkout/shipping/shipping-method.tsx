import { useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { DeliveryMethods } from '@/components/checkout/delivery/delivery-method';
import {
  useDraftOrder,
  useDraftOrderShipping,
  useDraftOrderShippingAddress,
  useDraftOrderTotals,
} from '@/components/checkout/order/use-draft-order';
import { useUpdateTaxes } from '@/components/checkout/order/use-update-taxes';
import { useIsPaymentDisabled } from '@/components/checkout/payment/utils/use-is-payment-disabled';
import { ShippingMethodSkeleton } from '@/components/checkout/shipping/shipping-method-skeleton';
import { filterAndSortShippingMethods } from '@/components/checkout/shipping/utils/filter-shipping-methods';
import { useApplyShippingMethod } from '@/components/checkout/shipping/utils/use-apply-shipping-method';
import { useDraftOrderShippingMethods } from '@/components/checkout/shipping/utils/use-draft-order-shipping-methods';
import { formatCurrency } from '@/components/checkout/utils/format-currency';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useGoDaddyContext } from '@/godaddy-provider';
import { eventIds } from '@/tracking/events';
import { TrackingEventType, track } from '@/tracking/track';
import type { ShippingMethod } from '@/types';

// Helper function to build the shipping payload
function buildShippingPayload(method: ShippingMethod) {
  return [
    {
      taxTotal: {
        value: 0,
        currencyCode: method?.cost?.currencyCode || 'USD',
      },
      subTotal: {
        value: method?.cost?.value || 0,
        currencyCode: method?.cost?.currencyCode || 'USD',
      },
      requestedService: method?.serviceCode,
      requestedProvider: method?.carrierCode,
      name: method?.displayName || '',
    },
  ];
}

export function ShippingMethodForm() {
  const form = useFormContext();
  const { t } = useGoDaddyContext();
  const { session } = useCheckoutContext();
  const updateTaxes = useUpdateTaxes();
  const isPaymentDisabled = useIsPaymentDisabled();

  const { data: shippingMethodsData, isLoading: isShippingMethodsLoading } =
    useDraftOrderShippingMethods();
  const { data: shippingAddress, isLoading: isShippingAddressLoading } =
    useDraftOrderShippingAddress();
  const { data: totals } = useDraftOrderTotals();
  const { data: order, isLoading: isDraftOrderLoading } = useDraftOrder();
  const { data: shippingLines } = useDraftOrderShipping();

  const hasShippingAddress = Boolean(shippingAddress?.addressLine1);
  const isPickup = Boolean(
    order?.lineItems?.some(
      lineItem => lineItem.fulfillmentMode === DeliveryMethods.PICKUP
    )
  );

  const orderSubTotal = totals?.subTotal?.value || 0;

  const shippingMethods = filterAndSortShippingMethods({
    shippingMethods: shippingMethodsData || [],
    orderSubTotal,
    experimentalRules: session?.experimental_rules,
  });

  const applyShippingMethod = useApplyShippingMethod();

  // Track the last processed state to avoid duplicate API calls
  const lastProcessedStateRef = useRef<{
    serviceCode: string | null;
    cost: number | null;
    hadShippingMethods: boolean;
    wasPickup: boolean;
  }>({
    serviceCode: null,
    cost: null,
    hadShippingMethods: false,
    wasPickup: false,
  });

  useEffect(() => {
    if (isShippingMethodsLoading || isDraftOrderLoading) return;

    const hasShippingMethods = (shippingMethods?.length ?? 0) > 0;
    const currentServiceCode = shippingLines?.requestedService || null;
    const currentCost = shippingLines?.amount?.value ?? null;
    const lastState = lastProcessedStateRef.current;

    // Case 1: No shipping methods available but shipping line exists - clear it
    // Only clear once when transitioning from having methods to no methods, or when switching to pickup
    if (
      !hasShippingMethods &&
      hasShippingAddress &&
      ((currentServiceCode && lastState.hadShippingMethods) ||
        (isPickup && !lastState.wasPickup))
    ) {
      form.setValue('shippingMethod', '', { shouldDirty: false });
      applyShippingMethod.mutate([]);
      lastProcessedStateRef.current = {
        serviceCode: null,
        cost: null,
        hadShippingMethods: false,
        wasPickup: isPickup,
      };
      return;
    }

    // Case 1.5: Switching back from pickup to shipping (reset pickup state)
    if (!isPickup && lastState.wasPickup) {
      lastProcessedStateRef.current = {
        ...lastState,
        wasPickup: false,
      };
    }

    // Case 2: Shipping methods available - apply or re-apply as needed
    if (hasShippingMethods) {
      const firstMethod = shippingMethods[0];
      const currentFormMethod = form.getValues('shippingMethod');
      const existingMethod = currentServiceCode || currentFormMethod;

      // Try to find the existing method in available methods
      const matchedMethod = existingMethod
        ? shippingMethods.find(m => m.serviceCode === existingMethod)
        : null;

      const methodToApply = matchedMethod || firstMethod;
      const methodCost = methodToApply.cost?.value ?? null;

      // Check if we've already processed this exact state
      const alreadyProcessed =
        methodToApply.serviceCode === lastState.serviceCode &&
        methodCost === lastState.cost;

      if (!alreadyProcessed) {
        form.setValue('shippingMethod', methodToApply.serviceCode, {
          shouldDirty: false,
        });

        // Only mutate if the method or cost actually changed on the order
        const needsMutation =
          methodToApply.serviceCode !== currentServiceCode ||
          methodCost !== currentCost;

        if (needsMutation) {
          applyShippingMethod.mutate(buildShippingPayload(methodToApply));
        } else if (session?.enableTaxCollection) {
          updateTaxes.mutate(undefined);
        }

        lastProcessedStateRef.current = {
          serviceCode: methodToApply.serviceCode,
          cost: methodCost,
          hadShippingMethods: true,
          wasPickup: false,
        };
      }
    }
  }, [
    shippingMethods,
    shippingLines,
    hasShippingAddress,
    isShippingMethodsLoading,
    form,
    applyShippingMethod,
    updateTaxes.mutate,
    session?.enableTaxCollection,
    isPickup,
    isDraftOrderLoading,
  ]);

  if (isShippingMethodsLoading || isShippingAddressLoading) {
    return <ShippingMethodSkeleton />;
  }

  if (!hasShippingAddress && !isShippingMethodsLoading) {
    return (
      <div className='bg-muted rounded-md p-6 flex justify-center items-center'>
        <p className='text-sm text-center w-full'>
          {t?.shipping?.noShippingMethodAddress}
        </p>
      </div>
    );
  }

  if (
    hasShippingAddress &&
    !isShippingMethodsLoading &&
    shippingMethods?.length === 0
  ) {
    return (
      <div className='bg-muted rounded-md p-6 flex justify-center items-center'>
        <p className='text-sm text-center w-full'>
          {t?.shipping?.noShippingMethods}
        </p>
      </div>
    );
  }

  const currentMethod = form.watch('shippingMethod');
  const selectedValue = currentMethod || undefined;

  const handleValueChange = (value: string) => {
    const previousValue = form.getValues('shippingMethod');
    form.setValue('shippingMethod', value);

    const method = shippingMethods?.find(m => m.serviceCode === value);

    if (method) {
      // Track shipping method selection
      track({
        eventId: eventIds.selectShippingMethod,
        type: TrackingEventType.CLICK,
        properties: {
          shippingMethod: method.displayName,
          shippingMethodId: method.serviceCode,
          shippingCarrier: method.carrierCode,
          cost: method.cost?.value || 0,
          currencyCode: method.cost?.currencyCode || 'USD',
        },
      });

      applyShippingMethod
        .mutateAsync(buildShippingPayload(method))
        .catch(() => {
          form.setValue('shippingMethod', previousValue);
        });
    }
  };

  return (
    <div className='space-y-2'>
      <div>
        <Label>{t.shipping.method}</Label>
      </div>
      {shippingMethods.length === 1 ? (
        <Label
          htmlFor={shippingMethods[0].displayName || 'shipping-method-0'}
          className='font-medium'
        >
          <div className='flex items-center justify-between space-x-2 bg-card border border-border p-2 px-4 rounded-md'>
            <div className='flex items-center space-x-4'>
              <div className='inline-flex flex-col'>
                {shippingMethods[0].displayName}
                <p className='text-xs text-muted-foreground'>
                  {shippingMethods[0].description}
                </p>
              </div>
            </div>
            <div className='text-right text-sm'>
              {shippingMethods[0]?.cost?.value === 0 ? (
                <span className='font-semibold'>{t.general.free}</span>
              ) : (
                <span className='font-semibold'>
                  {formatCurrency({ amount: shippingMethods[0]?.cost?.value || 0, currencyCode: shippingMethods[0]?.cost?.currencyCode || 'USD' })}
                </span>
              )}
            </div>
          </div>
        </Label>
      ) : (
        <RadioGroup
          disabled={isPaymentDisabled}
          value={selectedValue}
          onValueChange={handleValueChange}
        >
          {shippingMethods?.map((method, index) => {
            const methodId = method.serviceCode || `shipping-method-${index}`;
            const isSelected = method.serviceCode === currentMethod;

            return (
              <Label key={methodId} htmlFor={methodId} className='font-medium'>
                <div
                  className={`flex items-center min-h-12 justify-between space-x-2 bg-card border border-border p-2 px-4 hover:bg-muted ${
                    index === 0 ? 'rounded-t-md' : ''
                  } ${index === shippingMethods.length - 1 ? 'rounded-b-md' : ''} ${index !== 0 ? 'border-t-0' : ''} ${
                    isSelected ? 'bg-muted' : ''
                  }`}
                >
                  <div className='flex items-center space-x-4'>
                    <RadioGroupItem value={methodId} id={methodId} />
                    <div className='inline-flex flex-col'>
                      {method.displayName}
                      <p className='text-xs text-muted-foreground'>
                        {method.description}
                      </p>
                    </div>
                  </div>
                  <div className='text-right text-sm'>
                    {method?.cost?.value === 0 ? (
                      <span className='font-semibold'>{t.general.free}</span>
                    ) : (
                      <span className='font-semibold'>
                        {formatCurrency({ amount: method?.cost?.value || 0, currencyCode: method?.cost?.currencyCode || 'USD' })}
                      </span>
                    )}
                  </div>
                </div>
              </Label>
            );
          })}
        </RadioGroup>
      )}
    </div>
  );
}
