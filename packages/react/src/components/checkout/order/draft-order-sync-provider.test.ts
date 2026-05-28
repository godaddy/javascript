import { describe, expect, it } from 'vitest';
import { mergeDraftOrderPatch } from './draft-order-sync-provider';

describe('mergeDraftOrderPatch', () => {
  it('merges objects recursively', () => {
    expect(
      mergeDraftOrderPatch(
        { billing: { firstName: 'A' } },
        { billing: { lastName: 'B' } }
      )
    ).toEqual({ billing: { firstName: 'A', lastName: 'B' } });
  });

  it('merges nested objects recursively', () => {
    expect(
      mergeDraftOrderPatch(
        { billing: { firstName: 'A' } },
        { billing: { address: { postalCode: '12345' } } }
      )
    ).toEqual({
      billing: {
        firstName: 'A',
        address: {
          postalCode: '12345',
        },
      },
    });
  });

  it('replaces arrays', () => {
    expect(
      mergeDraftOrderPatch(
        { lineItems: [{ id: '1' }] },
        { lineItems: [{ id: '2' }] }
      )
    ).toEqual({ lineItems: [{ id: '2' }] });
  });

  it('replaces objects with null', () => {
    expect(
      mergeDraftOrderPatch(
        { billing: { firstName: 'A', lastName: 'B' } },
        { billing: null }
      )
    ).toEqual({ billing: null });
  });

  it('skips undefined values', () => {
    expect(
      mergeDraftOrderPatch(
        { billing: { firstName: 'A', lastName: 'B' } },
        { billing: { firstName: undefined } }
      )
    ).toEqual({ billing: { firstName: 'A', lastName: 'B' } });
  });

  it('lets later scalar values win', () => {
    expect(
      mergeDraftOrderPatch(
        { billing: { firstName: 'A' } },
        { billing: { firstName: 'Jane' } }
      )
    ).toEqual({ billing: { firstName: 'Jane' } });
  });

  it('lets an object replace previous null values', () => {
    expect(
      mergeDraftOrderPatch(
        { billing: { address: null } },
        { billing: { address: { postalCode: '12345' } } }
      )
    ).toEqual({ billing: { address: { postalCode: '12345' } } });
  });
});
