import React, { useEffect, useMemo, useState } from 'react';
import type { FieldPath, UseFormReturn, UseFormTrigger } from 'react-hook-form';
import { FormProvider } from 'react-hook-form';
import { useDraftOrderTotals } from '@/components/checkout/order/use-draft-order';
import { resolveBillingPolicyForCheckoutState } from '@/components/checkout/payment/utils/use-billing-policy';
import { type CheckoutFormData, useCheckoutContext } from '../checkout';
import { DeliveryMethods } from '../delivery/delivery-method';

const SHIPPING_ADDRESS_FIELD_NAMES = new Set([
  'shippingFirstName',
  'shippingLastName',
  'shippingAddressLine1',
  'shippingAddressLine2',
  'shippingAddressLine3',
  'shippingAdminArea4',
  'shippingAdminArea3',
  'shippingAdminArea2',
  'shippingAdminArea1',
  'shippingPostalCode',
  'shippingCountryCode',
]);

const BILLING_ADDRESS_FIELD_NAMES = new Set([
  'billingAddressLine1',
  'billingAddressLine2',
  'billingAddressLine3',
  'billingAdminArea4',
  'billingAdminArea3',
  'billingAdminArea2',
  'billingAdminArea1',
  'billingPostalCode',
  'billingCountryCode',
]);

const BILLING_NAME_FIELD_NAMES = new Set([
  'billingFirstName',
  'billingLastName',
]);

const BUILT_IN_FIELD_NAMES = new Set([
  ...SHIPPING_ADDRESS_FIELD_NAMES,
  ...BILLING_ADDRESS_FIELD_NAMES,
  ...BILLING_NAME_FIELD_NAMES,
  'contactEmail',
  'deliveryMethod',
  'paymentUseShippingAddress',
  'shippingPhone',
  'shippingMethod',
  'billingPhone',
  'paymentCardNumber',
  'paymentCardNumberDisplay',
  'paymentCardType',
  'paymentExpiryDate',
  'paymentMonth',
  'paymentYear',
  'paymentSecurityCode',
  'paymentNameOnCard',
  'notes',
  'pickupDate',
  'pickupTime',
  'pickupLocationId',
  'pickupLeadTime',
  'pickupTimezone',
  'tipAmount',
  'tipPercentage',
  'paymentMethod',
  'stripePaymentIntent',
  'stripePaymentIntentId',
]);

function getCustomErrorMessages(errors: Record<string, unknown>) {
  return Object.entries(errors).flatMap(([fieldName, error]) => {
    if (BUILT_IN_FIELD_NAMES.has(fieldName)) return [];

    const message = (error as { message?: unknown })?.message;
    return typeof message === 'string' && message ? [message] : [];
  });
}

export function CustomFormProvider<
  TFormValues extends Record<string, unknown> = CheckoutFormData,
>({
  children,
  ...methods
}: { children: React.ReactNode } & UseFormReturn<TFormValues>) {
  const methodsRef = React.useRef(methods);
  const [, setForceUpdate] = useState({});
  const { session } = useCheckoutContext();
  const { data: totals } = useDraftOrderTotals();
  const sessionRef = React.useRef(session);
  const totalsRef = React.useRef(totals);

  useEffect(() => {
    methodsRef.current = methods;
    sessionRef.current = session;
    totalsRef.current = totals;
  });

  const enhancedMethods = useMemo(() => {
    const enhancedTrigger: UseFormTrigger<TFormValues> = async (
      name?:
        | FieldPath<TFormValues>
        | ReadonlyArray<FieldPath<TFormValues>>
        | Array<FieldPath<TFormValues>>,
      options?: { shouldFocus?: boolean }
    ) => {
      try {
        const currentMethods = methodsRef.current;

        const triggerOptions = { shouldFocus: true, ...options };

        let result: boolean;

        if (name) {
          result = await methods.trigger(name, triggerOptions);
        } else {
          const values = currentMethods.getValues();
          const isShipping = values.deliveryMethod === DeliveryMethods.SHIP;
          const currentSession = sessionRef.current;
          const policy = resolveBillingPolicyForCheckoutState({
            values: values as unknown as CheckoutFormData,
            session: currentSession,
            totals: totalsRef.current,
          });

          const shippingSectionIsCollectable = Boolean(
            isShipping && currentSession?.enableShipping
          );
          const shippingAddressIsCollectable = Boolean(
            shippingSectionIsCollectable &&
              currentSession?.enableShippingAddressCollection
          );
          const billingIsCollectable = policy.mode !== 'none';
          const billingAddressIsCollectable = policy.mode === 'address';
          const phoneIsCollectable =
            currentSession?.enablePhoneCollection === true;
          const notesAreCollectable =
            currentSession?.enableNotesCollection === true;

          const isCollectable = (fieldName: string) => {
            if (fieldName === 'shippingPhone') {
              return shippingAddressIsCollectable && phoneIsCollectable;
            }
            if (fieldName === 'billingPhone') {
              return billingIsCollectable && phoneIsCollectable;
            }
            if (SHIPPING_ADDRESS_FIELD_NAMES.has(fieldName)) {
              return shippingAddressIsCollectable;
            }
            if (fieldName === 'shippingMethod') {
              return shippingSectionIsCollectable;
            }
            if (BILLING_NAME_FIELD_NAMES.has(fieldName)) {
              return billingIsCollectable;
            }
            if (BILLING_ADDRESS_FIELD_NAMES.has(fieldName)) {
              return billingAddressIsCollectable;
            }
            if (fieldName === 'notes') {
              return notesAreCollectable;
            }
            return true;
          };

          const registeredFields = Object.keys(
            (
              currentMethods.control as unknown as {
                _fields?: Record<string, unknown>;
              }
            )._fields ?? {}
          );
          const fieldNames = Array.from(
            new Set([...Object.keys(values), ...registeredFields])
          ).filter(isCollectable) as Array<FieldPath<TFormValues>>;

          result = await methods.trigger(fieldNames, triggerOptions);

          const customRegisteredFields = registeredFields.filter(
            fieldName => !BUILT_IN_FIELD_NAMES.has(fieldName)
          ) as Array<FieldPath<TFormValues>>;
          if (customRegisteredFields.length > 0) {
            result =
              (await methods.trigger(customRegisteredFields, {
                shouldFocus: false,
              })) && result;
          }
        }

        setTimeout(() => {
          setForceUpdate({});
        }, 0);

        return result;
      } catch {
        return false;
      }
    };

    const result = {
      ...methods,
      trigger: enhancedTrigger,
    } as UseFormReturn<TFormValues>;

    Object.defineProperty(result, 'formState', {
      get: () => methodsRef.current.formState,
    });

    return result;
  }, []);

  const customErrorMessages = getCustomErrorMessages(
    methods.formState.errors as Record<string, unknown>
  );

  return (
    <FormProvider {...enhancedMethods}>
      {children}
      {customErrorMessages.length > 0 ? (
        <div className='sr-only' role='alert' aria-live='assertive'>
          {customErrorMessages.map(message => (
            <p key={message}>{message}</p>
          ))}
        </div>
      ) : null}
    </FormProvider>
  );
}
