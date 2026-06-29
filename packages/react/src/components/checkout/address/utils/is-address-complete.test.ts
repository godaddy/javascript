import { describe, expect, it } from 'vitest';
import { isAddressComplete } from './is-address-complete';

const completeAddress = {
  addressLine1: '123 Main St',
  adminArea1: 'GA',
  adminArea2: 'Jasper',
  postalCode: '30143',
  countryCode: 'US',
};

describe('isAddressComplete', () => {
  it('returns true only when all required fields are non-empty', () => {
    expect(isAddressComplete(completeAddress)).toBe(true);
    expect(isAddressComplete({ ...completeAddress, addressLine1: '   ' })).toBe(
      false
    );
    expect(isAddressComplete({ ...completeAddress, adminArea2: '' })).toBe(
      false
    );
    expect(isAddressComplete({ ...completeAddress, countryCode: '' })).toBe(
      false
    );
  });

  it('does not require state for countries with no region data', () => {
    expect(
      isAddressComplete({
        addressLine1: '10 High Street',
        adminArea1: '',
        adminArea2: 'London',
        postalCode: 'SW1A 1AA',
        countryCode: 'ZZ',
      })
    ).toBe(true);
  });

  it('returns false for an empty postal code when the country requires it', () => {
    expect(isAddressComplete({ ...completeAddress, postalCode: '  ' })).toBe(
      false
    );
  });
});
