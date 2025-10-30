import type { Address } from '@/types';

export function formatSingleLineAddress(address?: Address): string {
  if (!address) return '';

  const { addressLine1, addressLine2, addressLine3, adminArea1, adminArea2, adminArea3, adminArea4, postalCode, countryCode } =
    address;

  const parts = [
    addressLine1,
    addressLine2,
    addressLine3,
    adminArea4,
    adminArea3,
    adminArea2,
    adminArea1,
    postalCode,
    countryCode,
  ];

  const seen = new Set<string>();
  const formattedParts = parts.filter((part): part is string => {
    if (!part || seen.has(part)) return false;
    seen.add(part);
    return true;
  });

  return formattedParts.join(', ');
}
