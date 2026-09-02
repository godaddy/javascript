import { describe, expect, it } from 'vitest';
import { getIncludedTaxTotal } from './get-included-tax-total';

describe('getIncludedTaxTotal', () => {
  it('totals only included tax constituents', () => {
    expect(
      getIncludedTaxTotal([
        { included: true, additional: false, amount: { value: 125 } },
        { included: false, additional: true, amount: { value: 300 } },
        { included: true, additional: null, amount: { value: 75 } },
        { included: true, additional: true, amount: { value: 500 } },
      ])
    ).toBe(200);
  });

  it('returns zero when included taxes have no positive amount', () => {
    expect(getIncludedTaxTotal()).toBe(0);
    expect(getIncludedTaxTotal([{ included: true, amount: null }])).toBe(0);
  });
});
