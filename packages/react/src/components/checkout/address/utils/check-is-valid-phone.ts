import { isPossiblePhoneNumber } from 'react-phone-number-input';

export function checkIsValidPhone(phoneNumber: string): boolean {
  const trimmed = phoneNumber?.trim();
  if (!trimmed) return false;

  return isPossiblePhoneNumber(trimmed);
}
