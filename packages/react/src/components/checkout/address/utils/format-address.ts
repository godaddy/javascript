import type { Address } from '@/types';
import { countryTuples } from '../country-region-data';

const countryNamesByCode = new Map(
  countryTuples.map(([label, value]) => [value, label])
);

export function formatSingleLineAddress(address?: Address): string {
  if (!address) return '';

  const {
    addressLine1,
    addressLine2,
    addressLine3,
    adminArea1,
    adminArea2,
    adminArea3,
    adminArea4,
    postalCode,
    countryCode,
  } = address;

  const country = countryCode
    ? (countryNamesByCode.get(countryCode) ?? countryCode)
    : undefined;

  const parts = [
    addressLine1,
    addressLine2,
    addressLine3,
    adminArea4,
    adminArea3,
    adminArea2,
    adminArea1,
    postalCode,
    country,
  ];

  const seen = new Set<string>();
  const formattedParts = parts.filter((part): part is string => {
    const trimmedPart = part?.trim();
    if (!trimmedPart || seen.has(trimmedPart)) return false;
    seen.add(trimmedPart);
    return true;
  });

  return formattedParts.join(', ');
}
