import React, { useEffect, useMemo, useState } from 'react';
import type { FieldPath, UseFormReturn, UseFormTrigger } from 'react-hook-form';
import { FormProvider } from 'react-hook-form';
import type { CheckoutFormData } from '../checkout';
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

  // Update the ref on every render
  useEffect(() => {
    methodsRef.current = methods;
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
          const paymentUseShippingAddress =
            values.paymentUseShippingAddress as unknown as boolean;
          const isPickup = deliveryMethod === DeliveryMethods.PICKUP;
          const isShipping = deliveryMethod === DeliveryMethods.SHIP;
          const requireBillingAddress = !paymentUseShippingAddress || isPickup;

          // Get all field names and filter based on conditions
          const allFieldNames = Object.keys(values);
          let fieldNames = [...allFieldNames] as Array<FieldPath<TFormValues>>;

          /* If using shipping address for billing (and not pickup), filter out billing-related field validations */
          if (!requireBillingAddress) {
            fieldNames = fieldNames.filter(
              fieldName => !fieldName.startsWith('billing')
            );
          }

          /* If the delivery method is not shipping (i.e. pickup), filter out shipping-related field validations */
          if (!isShipping) {
            fieldNames = fieldNames.filter(
              fieldName => !fieldName.startsWith('shipping')
            );
          }

          // Trigger validation only on the filtered fields if any condition is true,
          // otherwise trigger on all fields
          if (paymentUseShippingAddress || isPickup) {
            result = await methods.trigger(fieldNames, triggerOptions);
          } else {
            result = await methods.trigger(undefined, triggerOptions);
          }
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
