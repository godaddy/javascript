import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { GoDaddyProvider } from '@/godaddy-provider';
import {
  convertMajorToMinorUnits,
  formatCurrency,
  useFormatCurrency,
} from './format-currency';

describe('formatCurrency', () => {
  it('formats USD minor units with two decimals', () => {
    expect(formatCurrency({ amount: 1050, currencyCode: 'USD' })).toBe(
      '$10.50'
    );
  });

  it('formats JPY minor units with zero-decimal precision', () => {
    expect(formatCurrency({ amount: 1050, currencyCode: 'JPY' })).toBe(
      '¥1,050'
    );
  });

  it('formats KWD minor units with three-decimal precision', () => {
    expect(formatCurrency({ amount: 1050, currencyCode: 'KWD' })).toBe(
      'KWD 1.050'
    );
  });

  it('formats major units directly when inputInMinorUnits is false', () => {
    expect(
      formatCurrency({
        amount: 1050,
        currencyCode: 'USD',
        inputInMinorUnits: false,
      })
    ).toBe('$1,050.00');
  });

  it('returns raw major-unit output with en-US decimal formatting and no grouping', () => {
    expect(
      formatCurrency({
        amount: 123456,
        currencyCode: 'USD',
        locale: 'fr-FR',
        returnRaw: true,
      })
    ).toBe('1234.56');
  });

  it('falls back to en-US for an invalid locale without throwing', () => {
    expect(
      formatCurrency({
        amount: 1050,
        currencyCode: 'USD',
        locale: 'bad_locale',
      })
    ).toBe('$10.50');
  });
});

describe('convertMajorToMinorUnits', () => {
  it.each([
    { amount: '10.50', currencyCode: 'USD', expected: 1050 },
    { amount: '10,50', currencyCode: 'USD', expected: 0 },
    { amount: -1, currencyCode: 'USD', expected: 0 },
    { amount: Number.NaN, currencyCode: 'USD', expected: 0 },
    { amount: null, currencyCode: 'USD', expected: 0 },
    { amount: undefined, currencyCode: 'USD', expected: 0 },
    { amount: 100.5, currencyCode: 'JPY', expected: 101 },
    { amount: 1.2345, currencyCode: 'KWD', expected: 1235 },
  ])(
    'converts $amount $currencyCode major units to $expected minor units',
    ({ amount, currencyCode, expected }) => {
      expect(
        convertMajorToMinorUnits(
          amount as Parameters<typeof convertMajorToMinorUnits>[0],
          currencyCode
        )
      ).toBe(expected);
    }
  );
});

describe('useFormatCurrency', () => {
  function FormatCurrencyProbe({ locale }: { locale?: string }) {
    const format = useFormatCurrency();

    return React.createElement(
      'output',
      { 'data-testid': 'formatted' },
      format({ amount: 1050, currencyCode: 'USD', locale })
    );
  }

  it('uses the GoDaddyProvider locale when no explicit locale is passed', () => {
    render(
      React.createElement(GoDaddyProvider, {
        locale: 'fr-FR',
        children: React.createElement(FormatCurrencyProbe),
      })
    );

    expect(screen.getByTestId('formatted').textContent).toBe('10,50 $US');
  });

  it('lets an explicit locale option win over context locale', () => {
    render(
      React.createElement(GoDaddyProvider, {
        locale: 'fr-FR',
        children: React.createElement(FormatCurrencyProbe, { locale: 'en-US' }),
      })
    );

    expect(screen.getByTestId('formatted').textContent).toBe('$10.50');
  });
});
