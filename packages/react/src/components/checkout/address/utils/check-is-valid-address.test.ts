import { describe, expect, it } from 'vitest';
import type { Address } from '@/types';
import { checkIsValidAddress } from './check-is-valid-address';

const formAddress = (overrides: Partial<Address> = {}): Address =>
  ({
    addressLine1: '123 Main St',
    addressLine2: 'Suite 100',
    addressLine3: null,
    adminArea1: 'GA',
    adminArea2: 'Atlanta',
    adminArea3: null,
    adminArea4: null,
    postalCode: '30301',
    countryCode: 'US',
    ...overrides,
  }) as Address;

const verifiedAddress = (overrides: Partial<Address> = {}): Address =>
  ({
    addressLine1: '123 Main St',
    addressLine2: 'Suite 100',
    addressLine3: null,
    adminArea1: 'GA',
    adminArea2: 'Fulton County',
    adminArea3: 'Atlanta',
    adminArea4: null,
    postalCode: '30301',
    countryCode: 'US',
    ...overrides,
  }) as Address;

describe('checkIsValidAddress', () => {
  it('returns true for identical normalized addresses', () => {
    const address = formAddress({ adminArea3: 'Atlanta' });

    expect(
      checkIsValidAddress(
        address,
        verifiedAddress({ adminArea2: 'Atlanta', adminArea3: 'Atlanta' })
      )
    ).toBe(true);
  });

  it('normalizes USA and US country codes', () => {
    expect(
      checkIsValidAddress(
        formAddress({ countryCode: 'US' }),
        verifiedAddress({ countryCode: 'USA' })
      )
    ).toBe(true);
  });

  it('compares the form city against verified adminArea3', () => {
    expect(
      checkIsValidAddress(
        formAddress({ adminArea2: 'Atlanta' }),
        verifiedAddress({ adminArea2: 'Fulton County', adminArea3: 'Atlanta' })
      )
    ).toBe(true);
  });

  it('trims and compares postal codes case-insensitively', () => {
    expect(
      checkIsValidAddress(
        formAddress({ countryCode: 'GB', postalCode: ' SW1A 1AA ' }),
        verifiedAddress({ countryCode: 'GB', postalCode: 'sw1a 1aa' })
      )
    ).toBe(true);
  });

  it('returns false when addressLine2 differs', () => {
    expect(
      checkIsValidAddress(
        formAddress({ addressLine2: 'Suite 100' }),
        verifiedAddress({ addressLine2: 'Suite 200' })
      )
    ).toBe(false);
  });
});
