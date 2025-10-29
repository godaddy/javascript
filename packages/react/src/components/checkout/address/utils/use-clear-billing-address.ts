import { useFormContext } from 'react-hook-form';
import { useTryUpdateDraftOrder } from '@/components/checkout/order/use-try-update-draft-order';

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
