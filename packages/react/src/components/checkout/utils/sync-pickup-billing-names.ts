import type { UseFormReturn } from 'react-hook-form';
import type { CheckoutFormData } from '@/components/checkout/checkout';
import { DeliveryMethods } from '@/components/checkout/delivery/delivery-methods';
import type { DraftOrderPatch } from '@/components/checkout/order/draft-order-sync-provider';

type DraftOrderBillingNames = {
  billing?: {
    firstName?: string | null;
    lastName?: string | null;
  } | null;
} | null;

/**
 * Build a names-only billing patch for pickup when the form has names that are
 * not yet on the draft order. Omits `address` so paid-pickup billing addresses
 * are preserved.
 */
export function getPickupBillingNamesPatch(
  form: UseFormReturn<CheckoutFormData>,
  draftOrder?: DraftOrderBillingNames
): DraftOrderPatch | null {
  const values = form.getValues();
  if (values.deliveryMethod !== DeliveryMethods.PICKUP) {
    return null;
  }

  const firstName = String(values.billingFirstName ?? '').trim();
  const lastName = String(values.billingLastName ?? '').trim();
  if (!firstName || !lastName) {
    return null;
  }

  if (
    (draftOrder?.billing?.firstName || '') === firstName &&
    (draftOrder?.billing?.lastName || '') === lastName
  ) {
    return null;
  }

  return {
    billing: {
      firstName,
      lastName,
    },
  };
}
