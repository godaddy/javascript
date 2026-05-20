import { describe, expect, it } from 'vitest';

/**
 * Helper function to determine which billing fields are required
 * based on payment method and delivery method.
 *
 * This mirrors the validation logic in checkout.tsx and custom-form-provider.tsx
 */
function getRequiredBillingFields(
  paymentMethod: string,
  deliveryMethod: string,
  paymentUseShippingAddress: boolean
): string[] {
  const isFreeOrder = paymentMethod === 'offline';
  const isPickup = deliveryMethod === 'PICKUP';
  const isFreePickup = isFreeOrder && isPickup;

  // For free pickup orders, only require name fields
  if (isFreePickup) {
    return ['billingFirstName', 'billingLastName'];
  }

  // For paid pickup or when not using shipping address, require full billing
  const requireBillingAddress = !paymentUseShippingAddress || isPickup;

  if (requireBillingAddress) {
    return [
      'billingFirstName',
      'billingLastName',
      'billingAddressLine1',
      'billingAdminArea2',
      'billingPostalCode',
      'billingCountryCode',
    ];
  }

  // When using shipping address for billing (non-pickup), no billing fields required
  return [];
}

/**
 * Helper function to filter billing field names for validation
 * This mirrors the logic in custom-form-provider.tsx
 */
function filterBillingFieldsForValidation(
  allFieldNames: string[],
  paymentMethod: string,
  deliveryMethod: string,
  paymentUseShippingAddress: boolean
): string[] {
  const isFreeOrder = paymentMethod === 'offline';
  const isPickup = deliveryMethod === 'PICKUP';
  const isFreePickup = isFreeOrder && isPickup;

  if (isFreePickup) {
    // For free pickup, only include billingFirstName and billingLastName
    return allFieldNames.filter(
      fieldName =>
        !fieldName.startsWith('billing') ||
        fieldName === 'billingFirstName' ||
        fieldName === 'billingLastName'
    );
  }

  if (paymentUseShippingAddress && !isPickup) {
    // Filter out all billing fields when using shipping address
    return allFieldNames.filter(fieldName => !fieldName.startsWith('billing'));
  }

  // Return all fields for other cases
  return allFieldNames;
}

describe('FreePaymentForm - Billing validation logic', () => {
  describe('getRequiredBillingFields', () => {
    it('should only require first and last name for free pickup orders', () => {
      const result = getRequiredBillingFields('offline', 'PICKUP', true);

      expect(result).toEqual(['billingFirstName', 'billingLastName']);
      expect(result).not.toContain('billingAddressLine1');
      expect(result).not.toContain('billingPostalCode');
    });

    it('should require full billing address for paid pickup orders', () => {
      const result = getRequiredBillingFields('card', 'PICKUP', true);

      expect(result).toContain('billingFirstName');
      expect(result).toContain('billingLastName');
      expect(result).toContain('billingAddressLine1');
      expect(result).toContain('billingAdminArea2');
      expect(result).toContain('billingPostalCode');
      expect(result).toContain('billingCountryCode');
    });

    it('should require full billing when not using shipping address', () => {
      const result = getRequiredBillingFields('card', 'SHIP', false);

      expect(result).toContain('billingFirstName');
      expect(result).toContain('billingAddressLine1');
    });

    it('should not require billing fields when using shipping address for shipping orders', () => {
      const result = getRequiredBillingFields('card', 'SHIP', true);

      expect(result).toEqual([]);
    });

    it('should only require names for free orders with SHIP delivery using shipping address', () => {
      // Free order with shipping that uses shipping address - no billing needed
      const result = getRequiredBillingFields('offline', 'SHIP', true);

      // For free non-pickup orders using shipping address, no billing required
      expect(result).toEqual([]);
    });
  });

  describe('filterBillingFieldsForValidation', () => {
    const allFields = [
      'contactEmail',
      'deliveryMethod',
      'billingFirstName',
      'billingLastName',
      'billingAddressLine1',
      'billingAdminArea1',
      'billingAdminArea2',
      'billingPostalCode',
      'billingCountryCode',
      'shippingFirstName',
      'shippingLastName',
      'shippingAddressLine1',
    ];

    it('should filter billing fields to only names for free pickup', () => {
      const result = filterBillingFieldsForValidation(
        allFields,
        'offline',
        'PICKUP',
        true
      );

      expect(result).toContain('contactEmail');
      expect(result).toContain('billingFirstName');
      expect(result).toContain('billingLastName');
      expect(result).not.toContain('billingAddressLine1');
      expect(result).not.toContain('billingPostalCode');
    });

    it('should keep all billing fields for paid pickup', () => {
      const result = filterBillingFieldsForValidation(
        allFields,
        'card',
        'PICKUP',
        true
      );

      expect(result).toContain('billingFirstName');
      expect(result).toContain('billingAddressLine1');
      expect(result).toContain('billingPostalCode');
    });

    it('should filter out all billing fields when using shipping address for non-pickup', () => {
      const result = filterBillingFieldsForValidation(
        allFields,
        'card',
        'SHIP',
        true
      );

      expect(result).toContain('contactEmail');
      expect(result).toContain('shippingFirstName');
      expect(result).not.toContain('billingFirstName');
      expect(result).not.toContain('billingAddressLine1');
    });

    it('should keep all fields when not using shipping address', () => {
      const result = filterBillingFieldsForValidation(
        allFields,
        'card',
        'SHIP',
        false
      );

      expect(result).toContain('billingFirstName');
      expect(result).toContain('billingAddressLine1');
      expect(result).toContain('shippingFirstName');
    });
  });
});
