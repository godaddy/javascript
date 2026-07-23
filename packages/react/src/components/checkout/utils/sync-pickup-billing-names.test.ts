import type { UseFormReturn } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import type { CheckoutFormData } from '@/components/checkout/checkout';
import { DeliveryMethods } from '@/components/checkout/delivery/delivery-methods';
import { getPickupBillingNamesPatch } from '@/components/checkout/utils/sync-pickup-billing-names';
import type { DraftOrder } from '@/types';

function mockForm(
  values: Partial<CheckoutFormData>
): UseFormReturn<CheckoutFormData> {
  return {
    getValues: vi.fn(() => values),
  } as unknown as UseFormReturn<CheckoutFormData>;
}

describe('getPickupBillingNamesPatch', () => {
  it('returns null when delivery method is not pickup', () => {
    const form = mockForm({
      deliveryMethod: DeliveryMethods.SHIP,
      billingFirstName: 'Jane',
      billingLastName: 'Doe',
    });

    expect(getPickupBillingNamesPatch(form, null)).toBeNull();
  });

  it('returns null when pickup names are incomplete', () => {
    const form = mockForm({
      deliveryMethod: DeliveryMethods.PICKUP,
      billingFirstName: 'Jane',
      billingLastName: '  ',
    });

    expect(getPickupBillingNamesPatch(form, null)).toBeNull();
  });

  it('returns null when form names already match the draft order', () => {
    const form = mockForm({
      deliveryMethod: DeliveryMethods.PICKUP,
      billingFirstName: 'Jane',
      billingLastName: 'Doe',
    });
    const draftOrder = {
      billing: { firstName: 'Jane', lastName: 'Doe' },
    } as DraftOrder;

    expect(getPickupBillingNamesPatch(form, draftOrder)).toBeNull();
  });

  it('returns a names-only billing patch without address', () => {
    const form = mockForm({
      deliveryMethod: DeliveryMethods.PICKUP,
      billingFirstName: ' Jane ',
      billingLastName: ' Doe ',
    });
    const draftOrder = {
      billing: {
        firstName: '',
        lastName: '',
        address: {
          addressLine1: 'Paid Pickup Billing St',
        },
      },
    } as DraftOrder;

    expect(getPickupBillingNamesPatch(form, draftOrder)).toEqual({
      billing: {
        firstName: 'Jane',
        lastName: 'Doe',
      },
    });
  });
});
