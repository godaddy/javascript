import { isPossiblePhoneNumber } from 'react-phone-number-input';

export function checkIsValidPhone(phoneNumber: string): boolean {
  if (!phoneNumber) return false;

  return isPossiblePhoneNumber(phoneNumber);
}
