import type { Address } from '@/types';

const convertCountryCode = (country?: string | null): string | null | undefined => {
  if (country === 'USA') return 'US';
  return country;
};

export function checkIsValidAddress(address: Address, verifiedAddress?: Address) {
  return (
    address.addressLine1?.toLowerCase() === verifiedAddress?.addressLine1?.toLowerCase() &&
    address.adminArea1?.toLowerCase() === verifiedAddress?.adminArea1?.toLowerCase() &&
    address.adminArea2?.toLowerCase() === verifiedAddress?.adminArea3?.toLowerCase() &&
    address.postalCode?.toLowerCase() === verifiedAddress?.postalCode?.toLowerCase() &&
    address.countryCode?.toLowerCase() === convertCountryCode(verifiedAddress?.countryCode)?.toLowerCase()
  );
}
