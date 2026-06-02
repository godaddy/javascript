import type { Address } from '@/types';

const normalize = (value?: string | null): string =>
  value?.trim().toLowerCase() ?? '';

const convertCountryCode = (country?: string | null): string => {
  const normalizedCountry = country?.trim().toUpperCase();
  if (normalizedCountry === 'USA') return 'US';
  return normalizedCountry ?? '';
};

export function checkIsValidAddress(
  address: Address,
  verifiedAddress?: Address
) {
  return (
    normalize(address.addressLine1) ===
      normalize(verifiedAddress?.addressLine1) &&
    normalize(address.addressLine2) ===
      normalize(verifiedAddress?.addressLine2) &&
    normalize(address.adminArea1) === normalize(verifiedAddress?.adminArea1) &&
    normalize(address.adminArea2) === normalize(verifiedAddress?.adminArea3) &&
    normalize(address.postalCode) === normalize(verifiedAddress?.postalCode) &&
    convertCountryCode(address.countryCode) ===
      convertCountryCode(verifiedAddress?.countryCode)
  );
}
