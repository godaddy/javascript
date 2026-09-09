import { describe, expect, it } from 'vitest';
import type { Totals } from '@/types';
import { isFreeOrderTotal } from './is-free-order';

function totals(value: number | null | undefined) {
  return { total: { value, currencyCode: 'USD' } } as Totals;
}

describe('isFreeOrderTotal', () => {
  it('is free when the total is zero', () => {
    expect(isFreeOrderTotal(totals(0))).toBe(true);
  });

  it('is not free when the total is positive', () => {
    expect(isFreeOrderTotal(totals(1000))).toBe(false);
  });

  it('is not free without a numeric total', () => {
    expect(isFreeOrderTotal(undefined)).toBe(false);
    expect(isFreeOrderTotal(null)).toBe(false);
    expect(isFreeOrderTotal({} as Totals)).toBe(false);
    expect(isFreeOrderTotal(totals(null))).toBe(false);
    expect(isFreeOrderTotal(totals(undefined))).toBe(false);
  });

  it('is not free when a tip makes a zero total payable', () => {
    expect(isFreeOrderTotal(totals(0), 500)).toBe(false);
  });

  it('stays free when the tip is zero or omitted', () => {
    expect(isFreeOrderTotal(totals(0), 0)).toBe(true);
    expect(isFreeOrderTotal(totals(0), undefined)).toBe(true);
  });

  it('stays payable when a tip is added to a positive total', () => {
    expect(isFreeOrderTotal(totals(1000), 500)).toBe(false);
  });

  it('ignores a tip when there is no numeric total', () => {
    expect(isFreeOrderTotal(undefined, 500)).toBe(false);
    expect(isFreeOrderTotal(totals(null), 500)).toBe(false);
  });

  it('is free when a credit total is not fully offset by the tip', () => {
    expect(isFreeOrderTotal(totals(-1000), 500)).toBe(true);
  });

  it('is free when a tip exactly offsets a credit total', () => {
    expect(isFreeOrderTotal(totals(-500), 500)).toBe(true);
  });

  it('is not free when a tip exceeds a credit total', () => {
    expect(isFreeOrderTotal(totals(-500), 1000)).toBe(false);
  });
});
