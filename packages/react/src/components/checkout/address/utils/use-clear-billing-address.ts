import { useFormContext } from 'react-hook-form';
import { useTryUpdateDraftOrder } from '@/components/checkout/order/use-try-update-draft-order';

const BILLING_ADDRESS_FIELDS = [
  'billingAddressLine1',
  'billingAddressLine2',
  'billingAddressLine3',
  'billingAdminArea4',
  'billingAdminArea3',
  'billingAdminArea2',
  'billingAdminArea1',
  'billingPostalCode',
  'billingCountryCode',
];

/**
 * Clears the billing address but keeps the name and phone, for switching into a
 * names-only mode where the address inputs are no longer rendered. The names are
 * resent with the patch so the partial billing input cannot drop them.
 */
export function useClearBillingAddressDetails() {
  const form = useFormContext();
  const tryUpdateDraftOrder = useTryUpdateDraftOrder();

  return function clearBillingAddressDetails() {
    tryUpdateDraftOrder({
      billing: {
        firstName: String(form.getValues('billingFirstName') ?? '').trim(),
        lastName: String(form.getValues('billingLastName') ?? '').trim(),
        address: null,
      },
    });

    for (const fieldName of BILLING_ADDRESS_FIELDS) {
      form.setValue(fieldName, '');
    }
  };
}

export function useClearBillingAddress() {
  const form = useFormContext();
  const tryUpdateDraftOrder = useTryUpdateDraftOrder();

  return function clearBillingAddress() {
    tryUpdateDraftOrder({
      billing: null,
    });
    form.setValue('billingAddressLine1', '');
    form.setValue('billingAddressLine2', '');
    form.setValue('billingAddressLine3', '');
    form.setValue('billingAdminArea4', '');
    form.setValue('billingAdminArea3', '');
    form.setValue('billingAdminArea2', '');
    form.setValue('billingAdminArea1', '');
    form.setValue('billingPostalCode', '');
    form.setValue('billingCountryCode', '');
    form.setValue('billingFirstName', '');
    form.setValue('billingLastName', '');
    form.setValue('billingPhone', '');
  };
}
