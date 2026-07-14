import { useCallback } from 'react';
import { useFormContext, type FieldPath, type UseFormReturn } from 'react-hook-form';
import type { CheckoutFormData } from '@/components/checkout/checkout';
import { DeliveryMethods } from '@/components/checkout/delivery/delivery-methods';
import type { CheckoutSession } from '@/types';

export function getPickupPrerequisiteFields(
  values: Pick<
    CheckoutFormData,
    'deliveryMethod' | 'pickupLocationId' | 'pickupDate' | 'pickupTime'
  >,
  session?: CheckoutSession | null
): Array<FieldPath<CheckoutFormData>> {
  if (values.deliveryMethod !== DeliveryMethods.PICKUP) {
    return [];
  }

  const fields: Array<FieldPath<CheckoutFormData>> = [
    'contactEmail',
    'billingFirstName',
    'billingLastName',
    'pickupLocationId',
  ];

  const location = session?.locations?.find(
    loc => loc.id === values.pickupLocationId
  );
  const storeHours =
    location?.operatingHours ?? session?.defaultOperatingHours;

  if (storeHours?.pickupWindowInDays !== 0) {
    fields.push('pickupDate', 'pickupTime');
  }

  return fields;
}

export async function validatePickupPrerequisites(
  form: UseFormReturn<CheckoutFormData>,
  session?: CheckoutSession | null
): Promise<boolean> {
  const values = form.getValues();
  const fields = getPickupPrerequisiteFields(values, session);

  if (fields.length === 0) {
    return true;
  }

  return form.trigger(fields);
}

export function useValidatePickupPrerequisites(
  session?: CheckoutSession | null
) {
  const form = useFormContext<CheckoutFormData>();

  return useCallback(async () => {
    return validatePickupPrerequisites(form, session);
  }, [form, session]);
}
