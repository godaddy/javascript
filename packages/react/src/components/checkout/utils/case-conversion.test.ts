import { describe, expect, it } from 'vitest';
import {
  camelToKebab,
  convertCamelCaseToKebabCase,
  convertCSSVariablesToCamelCase,
  kebabToCamel,
} from './case-conversion';

describe('kebabToCamel', () => {
  it('converts kebab-case strings to camelCase', () => {
    expect(kebabToCamel('font-sans')).toBe('fontSans');
  });

  it('leaves camelCase input unchanged', () => {
    expect(kebabToCamel('fontSans')).toBe('fontSans');
  });
});

describe('camelToKebab', () => {
  it('converts camelCase strings to kebab-case', () => {
    expect(camelToKebab('fontSans')).toBe('font-sans');
  });

  it('leaves kebab-case input unchanged', () => {
    expect(camelToKebab('font-sans')).toBe('font-sans');
  });
});

describe('convertCSSVariablesToCamelCase', () => {
  it('converts kebab-case keys and skips undefined values', () => {
    expect(
      convertCSSVariablesToCamelCase({
        'font-sans': 'Inter',
        'secondary-background': undefined,
        foreground: '#111',
      })
    ).toEqual({
      fontSans: 'Inter',
      foreground: '#111',
    });
  });
});

describe('convertCamelCaseToKebabCase', () => {
  it('round-trips with convertCSSVariablesToCamelCase', () => {
    const variables = {
      'font-sans': 'Inter',
      'secondary-background': '#fff',
      foreground: '#111',
    };

    expect(
      convertCamelCaseToKebabCase(convertCSSVariablesToCamelCase(variables))
    ).toEqual(variables);
  });
});
