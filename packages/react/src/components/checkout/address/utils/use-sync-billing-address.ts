import { useFormContext } from 'react-hook-form';
import { useTryUpdateDraftOrder } from '@/components/checkout/order/use-try-update-draft-order';

export function useSyncBillingAddressWithShippingAddress() {
  const form = useFormContext();
  const tryUpdateDraftOrder = useTryUpdateDraftOrder();

  return function syncBillingAddressWithShippingAddress() {
    tryUpdateDraftOrder({
      billing: {
        firstName: form.getValues('shippingFirstName'),
        lastName: form.getValues('shippingLastName'),
        phone: form.getValues('shippingPhone'),
        address: {
          // Use the shipping address fields for billing address
          // This assumes that the form has these fields defined
          // and they are correctly populated with shipping address data
          addressLine1: form.getValues('shippingAddressLine1'),
          addressLine2: form.getValues('shippingAddressLine2'),
          addressLine3: form.getValues('shippingAddressLine3'),
          adminArea4: form.getValues('shippingAdminArea4'),
          adminArea3: form.getValues('shippingAdminArea3'),
          adminArea2: form.getValues('shippingAdminArea2'),
          adminArea1: form.getValues('shippingAdminArea1'),
          postalCode: form.getValues('shippingPostalCode'),
          countryCode: form.getValues('shippingCountryCode'),
        },
      },
    });
    form.setValue('billingFirstName', form.getValues('shippingFirstName'), {
      shouldValidate: true,
    });
    form.setValue('billingLastName', form.getValues('shippingLastName'), {
      shouldValidate: true,
    });
    form.setValue('billingPhone', form.getValues('shippingPhone'), {
      shouldValidate: true,
    });
    form.setValue('billingAddressLine1', form.getValues('shippingAddressLine1'), {
      shouldValidate: true,
    });
    form.setValue('billingAddressLine2', form.getValues('shippingAddressLine2'), {
      shouldValidate: true,
    });
    form.setValue('billingAddressLine3', form.getValues('shippingAddressLine3'), {
      shouldValidate: true,
    });
    form.setValue('billingAdminArea4', form.getValues('shippingAdminArea4'), {
      shouldValidate: true,
    });
    form.setValue('billingAdminArea3', form.getValues('shippingAdminArea3'), {
      shouldValidate: true,
    });
    form.setValue('billingAdminArea2', form.getValues('shippingAdminArea2'), {
      shouldValidate: true,
    });
    form.setValue('billingAdminArea1', form.getValues('shippingAdminArea1'), {
      shouldValidate: true,
    });
    form.setValue('billingPostalCode', form.getValues('shippingPostalCode'), {
      shouldValidate: true,
    });
    form.setValue('billingCountryCode', form.getValues('shippingCountryCode'), {
      shouldValidate: true,
    });
  };
}
