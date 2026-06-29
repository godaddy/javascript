import { describe, expect, it } from 'vitest';
import type { Address } from '@/types';
import { formatSingleLineAddress } from './format-address';

const address = (overrides: Partial<Address> = {}): Address =>
  ({
    addressLine1: '123 Main St',
    addressLine2: 'Suite 100',
    addressLine3: null,
    adminArea1: 'GA',
    adminArea2: 'Jasper',
    adminArea3: null,
    adminArea4: null,
    postalCode: '30143',
    countryCode: 'US',
    ...overrides,
  }) as Address;

describe('formatSingleLineAddress', () => {
  it('renders a standard US address comma-separated with no duplicates', () => {
    expect(formatSingleLineAddress(address())).toBe(
      '123 Main St, Suite 100, Jasper, GA, 30143, United States'
    );
  });

  it('omits a missing addressLine2 without leaving a double comma', () => {
    expect(formatSingleLineAddress(address({ addressLine2: null }))).toBe(
      '123 Main St, Jasper, GA, 30143, United States'
    );
  });

  it('falls back to the country code when the country is unknown', () => {
    expect(formatSingleLineAddress(address({ countryCode: 'ZZ' }))).toBe(
      '123 Main St, Suite 100, Jasper, GA, 30143, ZZ'
    );
  });

  it('de-duplicates admin areas when city and admin area have the same value', () => {
    expect(
      formatSingleLineAddress(
        address({
          adminArea1: 'Jasper',
          adminArea2: 'Jasper',
          countryCode: 'US',
        })
      )
    ).toBe('123 Main St, Suite 100, Jasper, 30143, United States');
  });

  it('returns an empty string when no address is provided', () => {
    expect(formatSingleLineAddress()).toBe('');
  });
});
