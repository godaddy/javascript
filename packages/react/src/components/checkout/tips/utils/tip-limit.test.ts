import { describe, expect, it } from 'vitest';
import { isTipWithinLimit } from './tip-limit';

/**
 * The bound these assert is the API's, not this module's: `checkout-api` accepts
 * a tip up to `max(orderTotal, 2000)` minor units. A preset wrongly withheld here
 * costs the merchant a tip; a preset wrongly offered is a `TIP_EXCEEDS_LIMIT` at
 * Pay, after the customer has chosen it.
 */
describe('isTipWithinLimit', () => {
  describe('on an order larger than the floor', () => {
    it('accepts a tip under the total', () => {
      expect(isTipWithinLimit(1500, 10000)).toBe(true);
    });

    it('accepts a tip worth exactly the total', () => {
      expect(isTipWithinLimit(10000, 10000)).toBe(true);
    });

    it('rejects a tip over the total', () => {
      expect(isTipWithinLimit(10001, 10000)).toBe(false);
    });
  });

  describe('on an order smaller than the floor', () => {
    it('accepts a tip worth more than the order', () => {
      // The $10 order does not bound the tip, the $20 floor does.
      expect(isTipWithinLimit(1500, 1000)).toBe(true);
    });

    it('accepts a tip worth exactly the floor', () => {
      expect(isTipWithinLimit(2000, 1000)).toBe(true);
    });

    it('rejects a tip over the floor', () => {
      expect(isTipWithinLimit(2500, 1000)).toBe(false);
    });
  });

  describe('on an order with nothing left to pay', () => {
    it('accepts a tip within the floor', () => {
      // A fully discounted order can still be tipped.
      expect(isTipWithinLimit(1500, 0)).toBe(true);
    });

    it('rejects a tip over the floor', () => {
      // Nothing owed is not an absent limit: the floor still applies.
      expect(isTipWithinLimit(2500, 0)).toBe(false);
    });
  });

  it('accepts no tip at all', () => {
    expect(isTipWithinLimit(0, 0)).toBe(true);
  });
});
