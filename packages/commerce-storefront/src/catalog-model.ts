export interface PageInfo {
  hasNextPage?: boolean | null;
  hasPreviousPage?: boolean | null;
  startCursor?: string | null;
  endCursor?: string | null;
}

export interface ConnectionEdge<T> {
  cursor?: string | null;
  node?: T | null;
}

export interface Connection<T> {
  edges?: Array<ConnectionEdge<T> | null> | null;
  pageInfo?: PageInfo | null;
  totalCount?: number | null;
}

export interface PriceRange {
  min?: number | null;
  max?: number | null;
}

export interface MediaObject {
  id?: string | null;
  url?: string | null;
  type?: string | null;
  label?: string | null;
  position?: number | null;
}

export interface InventoryCount {
  id?: string | null;
  quantity?: number | null;
  type?: string | null;
}

export interface SKUGroupAttributeValue {
  id?: string | null;
  name?: string | null;
  label?: string | null;
}

export interface SKUGroupAttribute {
  id?: string | null;
  name?: string | null;
  label?: string | null;
  description?: string | null;
  htmlDescription?: string | null;
  values?: Connection<SKUGroupAttributeValue> | null;
}

export type SKUGroupSKU = SKU;

export interface SKUGroup {
  id?: string | null;
  name?: string | null;
  label?: string | null;
  description?: string | null;
  htmlDescription?: string | null;
  type?: string | null;
  priceRange?: PriceRange | null;
  compareAtPriceRange?: PriceRange | null;
  mediaObjects?: Connection<MediaObject> | null;
  attributes?: Connection<SKUGroupAttribute> | null;
  skus?: Connection<SKUGroupSKU> | null;
}

import type { Money } from './cart-model';

export interface SKUPrice {
  id?: string | null;
  value?: Money | null;
  compareAtValue?: Money | null;
}

export interface SKUAttributeValue {
  id?: string | null;
  name?: string | null;
  label?: string | null;
}

export interface SKU {
  id?: string | null;
  label?: string | null;
  name?: string | null;
  description?: string | null;
  htmlDescription?: string | null;
  code?: string | null;
  prices?: Connection<SKUPrice> | null;
  inventoryCounts?: Connection<InventoryCount> | null;
  mediaObjects?: Connection<MediaObject> | null;
  attributeValues?: Connection<SKUAttributeValue> | null;
}

export interface StringInFilter {
  in: string[];
}

export interface LabelFilter {
  contains: string;
}

export interface SkuGroupsVariables {
  first?: number | null;
  after?: string | null;
  id?: StringInFilter;
  listId?: StringInFilter;
  label?: LabelFilter;
}

export interface SkuGroupVariables {
  id: string;
  first?: number | null;
  /** Attribute value `name` fields — the catalog API's `has` filter matches by `name`, not `id`. */
  attributeValues?: string[];
}

export interface SkuVariables {
  id: string;
}

export interface SkuGroupsResult {
  skuGroups?: Connection<SKUGroup> | null;
}

export interface SkuGroupResult {
  skuGroup?: SKUGroup | null;
}

export interface SkuResult {
  sku?: SKU | null;
}

export interface ProductGridVariablesInput {
  first?: number | null;
  after?: string | null;
  productIds?: readonly string[];
  categoryIds?: readonly string[];
  searchQuery?: string;
}

export interface ProductDetailsVariablesInput {
  productId: string;
  /** Attribute value `name` fields, not `id`. */
  selectedAttributeValues?: readonly string[];
  /** Number of SKUs to request before attributes are selected. Defaults to 50. */
  skuGroupFirst?: number;
}

export interface StorefrontProductAttributeValue {
  id: string;
  name: string;
  label: string;
}

export interface StorefrontProductAttribute {
  id: string;
  name: string;
  label: string;
  values: StorefrontProductAttributeValue[];
}

type InventoryCountContainer = {
  inventoryCounts?: Connection<InventoryCount> | null;
};

type MediaObjectContainer = {
  mediaObjects?: Connection<MediaObject> | null;
};

export function getSingleMatchedSkuId(skuGroup: SKUGroup | null | undefined): string | null {
  return getSingleMatchedSku(skuGroup)?.id ?? null;
}

export function getSingleMatchedSku(skuGroup: SKUGroup | null | undefined): SKU | null {
  const connection: Connection<SKUGroupSKU> | null | undefined = skuGroup?.skus;
  if (connection?.pageInfo?.hasNextPage || (connection?.totalCount ?? 0) > 1) return null;
  const edges: Array<ConnectionEdge<SKUGroupSKU> | null> = connection?.edges ?? [];
  const sku: SKU | null | undefined = edges.length === 1 ? edges[0]?.node : null;
  return sku?.id ? sku : null;
}

export function getLabeledSkuOptions(skuGroup: SKUGroup | null | undefined): SKU[] {
  if (getProductAttributes(skuGroup).length > 0) return [];
  const connection: Connection<SKU> | null | undefined = skuGroup?.skus;
  const edges: Array<ConnectionEdge<SKU> | null> = connection?.edges ?? [];
  if (
    edges.length < 2 ||
    connection?.pageInfo?.hasNextPage ||
    (connection?.totalCount ?? edges.length) !== edges.length
  )
    return [];
  const skus: SKU[] = edges.flatMap((edge: ConnectionEdge<SKU> | null): SKU[] =>
    edge?.node?.id && (edge.node.label?.trim() || edge.node.name?.trim()) ? [edge.node] : [],
  );
  const labels: Set<string> = new Set(
    skus.map((sku: SKU): string => (sku.label?.trim() || sku.name?.trim() || '').toLowerCase()),
  );
  const ids: Set<string | null | undefined> = new Set(
    skus.map((sku: SKU): string | null | undefined => sku.id),
  );
  return skus.length === edges.length && labels.size === skus.length && ids.size === skus.length ? skus : [];
}

export function getAvailableInventoryQuantity(
  item: InventoryCountContainer | null | undefined,
): number | null {
  const edges = item?.inventoryCounts?.edges;
  if (!edges || edges.length === 0) {
    // No inventory records = inventory not tracked (digital goods, services, etc.).
    // Return null so callers can distinguish "unlimited" from "out of stock" (0).
    return null;
  }
  return edges.find((edge) => edge?.node?.type === 'AVAILABLE')?.node?.quantity ?? 0;
}

// The catalog API still returns `PHOTO` for media created before the `IMAGE` type.
const imageMediaTypes: ReadonlySet<string> = new Set(['IMAGE', 'PHOTO']);

export function getImageUrls(item: MediaObjectContainer | null | undefined): string[] {
  return (
    item?.mediaObjects?.edges
      ?.filter((edge) => imageMediaTypes.has(edge?.node?.type ?? '') && edge?.node?.url)
      .map((edge) => edge?.node?.url)
      .filter((url): url is string => Boolean(url)) ?? []
  );
}

export function getPrimaryImageUrl(item: MediaObjectContainer | null | undefined): string | null {
  return getImageUrls(item)[0] ?? null;
}

export function getProductAttributes(skuGroup: SKUGroup | null | undefined): StorefrontProductAttribute[] {
  return (
    skuGroup?.attributes?.edges?.map((edge) => {
      const attributeNode = edge?.node;
      const values =
        attributeNode?.values?.edges?.map((valueEdge) => {
          const valueNode = valueEdge?.node;
          return {
            id: valueNode?.id || '',
            name: valueNode?.name || '',
            label: valueNode?.label || valueNode?.name || '',
          };
        }) ?? [];

      return {
        id: attributeNode?.id || '',
        name: attributeNode?.name || '',
        label: attributeNode?.label || attributeNode?.name || '',
        values,
      };
    }) ?? []
  );
}

/** The product's display name: its label, then its name. */
export function getProductName(skuGroup: SKUGroup): string {
  return skuGroup.label ?? skuGroup.name ?? 'Product';
}

/** Lowercases a label for use mid-sentence, leaving acronyms alone: "Size" becomes "size", "US Size" stays. */
export const inSentence = (label: string): string =>
  label.replace(/^[A-Z](?=[a-z])/, (first) => first.toLowerCase());

/** Whether `compareAt` is above `price`, so the price is a sale price. */
export function isOnSale(price: number | null | undefined, compareAt: number | null | undefined): boolean {
  return typeof price === 'number' && typeof compareAt === 'number' && compareAt > price;
}

interface PairedPrice {
  value: number;
  compareAt: number | null;
}

/**
 * Each SKU's price paired with its own compare-at price, or `null` unless the response has every SKU and each has a
 * price. The catalog list returns too few SKUs and no SKU prices, so its cards fall back to the product's ranges.
 */
function getPairedPrices(product: SKUGroup | null | undefined): PairedPrice[] | null {
  const connection: Connection<SKU> | null | undefined = product?.skus;
  const skus: SKU[] = connection?.edges?.flatMap((edge) => (edge?.node ? [edge.node] : [])) ?? [];
  if (
    !skus.length ||
    connection?.pageInfo?.hasNextPage ||
    (connection?.totalCount ?? skus.length) !== skus.length
  )
    return null;
  const pairs: PairedPrice[] = skus.flatMap((sku) => {
    const price: SKUPrice | null | undefined = sku.prices?.edges?.find((entry) => entry?.node?.value)?.node;
    return typeof price?.value?.value === 'number'
      ? [{ value: price.value.value, compareAt: price.compareAtValue?.value ?? null }]
      : [];
  });
  return pairs.length === skus.length ? pairs : null;
}

/**
 * Whether some SKU's compare-at price is above that SKU's own price. Without every SKU's price, only a product whose
 * lowest compare-at price is above its highest price is certainly on sale, so other products show no badge.
 */
export function isProductOnSale(product: SKUGroup | null | undefined): boolean {
  const pairs: PairedPrice[] | null = getPairedPrices(product);
  if (pairs) return pairs.some((pair) => isOnSale(pair.value, pair.compareAt));
  return isOnSale(product?.priceRange?.max, product?.compareAtPriceRange?.min);
}

/**
 * The compare-at price that belongs with the product's starting price, so a struck-through price never pairs one
 * SKU's price with another SKU's compare-at price. With every SKU and its price loaded, the cheapest SKUs must share
 * one compare-at price above their price. Otherwise the product needs a single price and a single compare-at price.
 */
export function getStartingCompareAt(product: SKUGroup | null | undefined): number | null {
  const price: PriceRange | null | undefined = product?.priceRange;
  const compareAt: PriceRange | null | undefined = product?.compareAtPriceRange;
  const pairs: PairedPrice[] | null = getPairedPrices(product);
  if (pairs) {
    const lowest: number = Math.min(...pairs.map((pair) => pair.value));
    if (lowest !== price?.min) return null;
    const compareAts: Set<number | null> = new Set(
      pairs.flatMap((pair) => (pair.value === lowest ? [pair.compareAt] : [])),
    );
    const [only] = compareAts;
    return compareAts.size === 1 && only != null && isOnSale(lowest, only) ? only : null;
  }
  return price?.min === price?.max &&
    compareAt?.min === compareAt?.max &&
    isOnSale(price?.min, compareAt?.min)
    ? (compareAt?.min ?? null)
    : null;
}

/** The SKU's attribute value names, or `null` when the response does not include them. */
export function getSkuAttributeValueNames(sku: SKU | null | undefined): string[] | null {
  const edges = sku?.attributeValues?.edges;
  if (!edges) return null;
  return edges.flatMap((edge) => (edge?.node?.name ? [edge.node.name] : []));
}
