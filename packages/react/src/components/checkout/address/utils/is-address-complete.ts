/**
 * Utility to check if an address has all required fields for shipping/tax calculations.
 *
 * @param address - Address object to validate
 * @returns true if all required fields are present and non-empty
 */
export function isAddressComplete(address: {
  addressLine1?: string;
  adminArea1?: string;
  adminArea2?: string;
  postalCode?: string;
  countryCode?: string;
}): boolean {
  return !!(
    address.addressLine1?.trim() &&
    address.adminArea1?.trim() &&
    address.adminArea2?.trim() &&
    address.postalCode?.trim() &&
    address.countryCode?.trim()
  );
}
