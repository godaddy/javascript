/**
 * GoDaddy Commerce catalog-subgraph kit.
 *
 * Server-side proxy routes under `src/server/api/commerce/products` and
 * `src/server/api/commerce/skus` import this file to fetch SKUGroups and
 * SKUs. The catalog endpoint is public-readable but the proxy still owns
 * the `X-Store-ID` / `X-Client-ID` headers so the browser stays clean.
 *
 * The interfaces and view-model helpers (`getPrimaryImageUrl`,
 * `getProductAttributes`, `getSingleMatchedSkuId`,
 * `getAvailableInventoryQuantity`) are isomorphic and safe to import from
 * client components when shaping props from API responses.
 *
 * Domain notes:
 * - A storefront "product" is a SKUGroup; a purchasable variant is a SKU.
 * - Filters: `id.in` for explicit ids, `listId.in` for category lists,
 *   `label.contains` for search.
 * - SKU media/prices should override SKUGroup-level ones once a SKU is selected.
 */

export interface CatalogStorefrontEndpointInput {
  storeId: string;
  apiBaseUrl: string;
}

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

import type { Money } from './gql';

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

export function catalogStorefrontEndpoint({ storeId, apiBaseUrl }: CatalogStorefrontEndpointInput): string {
  return new URL(`/v2/commerce/stores/${storeId}/catalog-subgraph/storefront`, apiBaseUrl).toString();
}

export function buildSkuGroupsVariables(input: ProductGridVariablesInput): SkuGroupsVariables {
  const productIds = input.productIds?.filter(Boolean) ?? [];
  const categoryIds = input.categoryIds?.filter(Boolean) ?? [];
  const hasExplicitFilters = productIds.length > 0 || categoryIds.length > 0;

  return {
    ...(input.first !== undefined && { first: input.first }),
    ...(input.after && { after: input.after }),
    ...(productIds.length > 0 && { id: { in: [...productIds] } }),
    ...(categoryIds.length > 0 && { listId: { in: [...categoryIds] } }),
    ...(!hasExplicitFilters && input.searchQuery && { label: { contains: input.searchQuery } }),
  };
}

export function buildSkuGroupVariables({
  productId,
  selectedAttributeValues,
  skuGroupFirst,
}: ProductDetailsVariablesInput): SkuGroupVariables {
  const attributeValues = selectedAttributeValues ? [...selectedAttributeValues] : [];

  return {
    id: productId,
    attributeValues,
    ...(!attributeValues.length && { first: skuGroupFirst ?? 50 }),
  };
}

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

export function getImageUrls(item: MediaObjectContainer | null | undefined): string[] {
  return (
    item?.mediaObjects?.edges
      ?.filter((edge) => edge?.node?.type === 'IMAGE' && edge.node.url)
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
