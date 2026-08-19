import React, { useEffect, useMemo, useState } from 'react';
import type { FieldPath, UseFormReturn, UseFormTrigger } from 'react-hook-form';
import { FormProvider } from 'react-hook-form';
import { useDraftOrderTotals } from '@/components/checkout/order/use-draft-order';
import {
  getBillingCollectionMode,
  hasInlineBillingForm,
} from '@/components/checkout/payment/utils/billing-collection';
import { PaymentMethodType } from '@/types';
import { type CheckoutFormData, useCheckoutContext } from '../checkout';
import { DeliveryMethods } from '../delivery/delivery-method';

/**
 * Custom FormProvider that extends React Hook Form's FormProvider
 * to add smart validation that respects unregistered fields
 */
export function CustomFormProvider<
  TFormValues extends Record<string, unknown> = CheckoutFormData,
>({
  children,
  ...methods
}: { children: React.ReactNode } & UseFormReturn<TFormValues>) {
  // Original methods reference to use in the enhancedTrigger
  const methodsRef = React.useRef(methods);
  // Use state to force re-render
  const [, setForceUpdate] = useState({});
  const { customSchemaFields, session } = useCheckoutContext();
  const { data: totals } = useDraftOrderTotals();
  const customSchemaFieldsRef = React.useRef(customSchemaFields);
  const sessionRef = React.useRef(session);
  const totalsRef = React.useRef(totals);

  // Update the refs on every render
  useEffect(() => {
    methodsRef.current = methods;
    customSchemaFieldsRef.current = customSchemaFields;
    sessionRef.current = session;
    totalsRef.current = totals;
  });

  const enhancedMethods = useMemo(() => {
    // Override the trigger function with a type-safe version that ensures error messages are displayed
    const enhancedTrigger: UseFormTrigger<TFormValues> = async (
      name?:
        | FieldPath<TFormValues>
        | ReadonlyArray<FieldPath<TFormValues>>
        | Array<FieldPath<TFormValues>>,
      options?: { shouldFocus?: boolean }
    ) => {
      try {
        const currentMethods = methodsRef.current;

        // Always enable shouldFocus by default unless explicitly disabled
        const triggerOptions = { shouldFocus: true, ...options };

        let result: boolean;

        // If specific fields are provided, use the original trigger
        if (name) {
          // Use original methods directly to ensure formState is properly updated
          result = await methods.trigger(name, triggerOptions);
        }
        // Get the current delivery method using type assertion for safety
        else {
          const values = currentMethods.getValues();
          const deliveryMethod = values.deliveryMethod as unknown as string;
          const paymentMethod = values.paymentMethod as unknown as string;
          const paymentUseShippingAddress =
            values.paymentUseShippingAddress as unknown as boolean;
          const isPickup = deliveryMethod === DeliveryMethods.PICKUP;
          const isShipping = deliveryMethod === DeliveryMethods.SHIP;
          const isOfflinePayment = paymentMethod === PaymentMethodType.OFFLINE;
          const currentSession = sessionRef.current;
          const orderTotal =
            totalsRef.current?.total?.value ??
            currentSession?.draftOrder?.totals?.total?.value;
          const isFreeOrder = typeof orderTotal === 'number' && orderTotal <= 0;
          const isOfflinePickup = isOfflinePayment && isPickup;
          let billingContext:
            | 'top-level'
            | 'inline-payment-form'
            | 'free-payment-form' = 'top-level';
          if (hasInlineBillingForm(paymentMethod)) {
            billingContext = 'inline-payment-form';
          } else if (isFreeOrder && isOfflinePayment) {
            billingContext = 'free-payment-form';
          }
          const billingMode = getBillingCollectionMode({
            context: billingContext,
            deliveryMethod,
            paymentMethod,
            paymentUseShippingAddress,
            enableBillingAddressCollection:
              currentSession?.enableBillingAddressCollection,
            enableTaxCollection: currentSession?.enableTaxCollection,
          });

          // Get all field names and filter based on conditions
          const allFieldNames = Object.keys(values);
          let fieldNames = [...allFieldNames] as Array<FieldPath<TFormValues>>;
          const shippingAddressFieldNames = new Set([
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
          const billingAddressFieldNames = new Set([
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
          const billingNameFieldNames = new Set([
            'billingFirstName',
            'billingLastName',
          ]);
          const shippingSectionIsCollectable = Boolean(
            isShipping && currentSession?.enableShipping
          );
          const shippingAddressIsCollectable = Boolean(
            shippingSectionIsCollectable &&
              currentSession?.enableShippingAddressCollection
          );
          const billingNamesAreCollectable = billingMode !== 'none';
          const billingAddressIsCollectable = billingMode === 'address';
          const phoneIsCollectable =
            currentSession?.enablePhoneCollection === true;
          const notesAreCollectable =
            currentSession?.enableNotesCollection === true;

          const isCollectable = (fieldName: string) => {
            if (fieldName === 'shippingPhone') {
              return shippingAddressIsCollectable && phoneIsCollectable;
            }
            if (fieldName === 'billingPhone') {
              return billingNamesAreCollectable && phoneIsCollectable;
            }
            if (shippingAddressFieldNames.has(fieldName)) {
              return shippingAddressIsCollectable;
            }
            if (fieldName === 'shippingMethod') {
              return shippingSectionIsCollectable;
            }
            if (billingNameFieldNames.has(fieldName)) {
              return billingNamesAreCollectable;
            }
            if (billingAddressFieldNames.has(fieldName)) {
              return billingAddressIsCollectable;
            }
            if (fieldName.startsWith('shipping')) {
              return shippingSectionIsCollectable;
            }
            if (fieldName.startsWith('billing')) {
              return billingNamesAreCollectable;
            }
            if (fieldName === 'notes') {
              return notesAreCollectable;
            }
            return true;
          };
          fieldNames = fieldNames.filter(fieldName => isCollectable(fieldName));

          const customFieldNames = new Set<string>(
            (customSchemaFieldsRef.current ?? []).filter(isCollectable)
          );
          const isSkippable = (fieldName: string) =>
            !customFieldNames.has(fieldName);

          /* For offline pickup orders, only validate billingFirstName and billingLastName */
          if (isOfflinePickup) {
            fieldNames = fieldNames.filter(
              fieldName =>
                !fieldName.startsWith('billing') ||
                fieldName === 'billingFirstName' ||
                fieldName === 'billingLastName' ||
                !isSkippable(fieldName)
            );
          } else if (paymentUseShippingAddress && isShipping) {
            /* If using shipping address for billing, filter out billing-related field validations.
             * We require isShipping (not just !isPickup) so that PURCHASE / all-NONE
             * fulfillment orders, or sessions with enableShipping: false, still validate
             * billing fields — there's no shipping address to copy from in those cases. */
            fieldNames = fieldNames.filter(
              fieldName =>
                !fieldName.startsWith('billing') || !isSkippable(fieldName)
            );
          }

          /* If the delivery method is not shipping (i.e. pickup), filter out shipping-related field validations */
          if (!isShipping) {
            fieldNames = fieldNames.filter(
              fieldName =>
                !fieldName.startsWith('shipping') || !isSkippable(fieldName)
            );
          }

          result = await methods.trigger(fieldNames, triggerOptions);
        }

        // Force update to ensure error messages show immediately
        setTimeout(() => {
          setForceUpdate({});
        }, 0);

        return result;
      } catch {
        return false;
      }
    };

    // Return the enhanced methods object with properly typed trigger and original state
    const result = {
      ...methods,
      trigger: enhancedTrigger,
    } as UseFormReturn<TFormValues>;

    // Make sure we're not losing formState reactivity
    Object.defineProperty(result, 'formState', {
      get: () => methodsRef.current.formState,
    });

    return result;
  }, []);

  return <FormProvider {...enhancedMethods}>{children}</FormProvider>;
}
