import { describe, expect, it } from 'vitest';
import {
  getAvailableInventoryQuantity,
  getLabeledSkuOptions,
  getSingleMatchedSku,
  getSkuPrice,
  type SKU,
  type SKUGroup,
} from './catalog-model';

const sku = (id: string, label = id): SKU => ({ id, label });
const group = (skus: SKU[], extra = {}): SKUGroup => ({
  skus: { edges: skus.map((node) => ({ node })), totalCount: skus.length, ...extra },
});
describe('safe SKU selection', () => {
  it.each([null, undefined, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects unusable SKU price amounts: %s',
    (value: number | null | undefined): void => {
      expect(
        getSkuPrice(
          { prices: { edges: [null, { node: null }, { node: { value: { value, currencyCode: 'USD' } } }] } },
          'USD',
        ),
      ).toBeNull();
    },
  );
  it('preserves the matched currency price and its compare-at value', (): void => {
    const price = {
      value: { value: 1000, currencyCode: 'CAD' },
      compareAtValue: { value: 1500, currencyCode: 'CAD' },
    };
    expect(getSkuPrice({ prices: { edges: [{ node: price }] } }, 'CAD')).toBe(price);
  });
  it('only permits direct purchase for exactly one complete SKU result', () => {
    expect(getSingleMatchedSku(group([sku('one')]))?.id).toBe('one');
    expect(getSingleMatchedSku(group([sku('one')], { totalCount: 2 }))).toBeNull();
    expect(getSingleMatchedSku(group([sku('one')], { pageInfo: { hasNextPage: true } }))).toBeNull();
    expect(getSingleMatchedSku(group([sku('one'), sku('two')]))).toBeNull();
    expect(getSingleMatchedSku(group([]))).toBeNull();
  });
  it('supports a complete set of uniquely labeled SKUs when product attributes are absent', () => {
    expect(getLabeledSkuOptions(group([sku('one', 'Small'), sku('two', 'Large')]))).toHaveLength(2);
    expect(getLabeledSkuOptions(group([sku('one', 'Same'), sku('two', 'same')]))).toEqual([]);
    expect(getLabeledSkuOptions(group([sku('one'), sku('two')], { totalCount: 3 }))).toEqual([]);
    expect(
      getLabeledSkuOptions(group([sku('one'), sku('two')], { pageInfo: { hasNextPage: true } })),
    ).toEqual([]);
    expect(
      getLabeledSkuOptions({
        ...group([sku('one'), sku('two')]),
        attributes: { edges: [{ node: { name: 'size' } }] },
      }),
    ).toEqual([]);
  });
  it('distinguishes untracked inventory from unavailable inventory', () => {
    expect(getAvailableInventoryQuantity(sku('digital'))).toBeNull();
    expect(getAvailableInventoryQuantity({ inventoryCounts: { edges: [] } })).toBeNull();
    expect(
      getAvailableInventoryQuantity({
        inventoryCounts: { edges: [{ node: { type: 'ON_HAND', quantity: 8 } }] },
      }),
    ).toBe(0);
    expect(
      getAvailableInventoryQuantity({
        inventoryCounts: { edges: [{ node: { type: 'AVAILABLE', quantity: 2 } }] },
      }),
    ).toBe(2);
  });
});
