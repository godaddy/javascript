/**
 * GET /api/commerce/products
 *
 * Proxy for the catalog `skuGroups` query — paginated product grid backing
 * the catalog page. Browser callers MUST go through this route; never call
 * the catalog subgraph directly so the browser never sees `X-Store-ID` /
 * `X-Client-ID` and the server can layer caching, abuse protection, or
 * per-tenant filtering later without touching the client.
 *
 * Query params (all optional):
 *   first        - page size (number)
 *   after        - pagination cursor (string)
 *   searchQuery  - filter by `label.contains` (ignored if productIds/categoryIds set)
 *   productIds   - repeat to filter to a specific id set: ?productIds=a&productIds=b
 *   categoryIds  - repeat to filter by category list ids: ?categoryIds=x
 *
 * Response: { skuGroups: Connection<SKUGroup> } — same shape as the GraphQL
 * `data` field. Use the helpers in lib/commerce/catalog-subgraph.ts to extract view-model fields.
 */
import type { Request, Response } from 'express';
import { validateCommerceCartScope } from '@/lib/commerce/cart-scope';
import {
  buildSkuGroupsVariables,
  catalogStorefrontEndpoint,
  type SkuGroupsResult,
  type SkuGroupsVariables,
} from '@/lib/commerce/catalog-subgraph';
import { type CommerceConfig, readCommerceConfigForResponse } from '@/lib/commerce/config';
import { gqlRequest, storefrontHeaders } from '@/lib/commerce/gql';

// Cards use group pricing/media and SKU identity/inventory for quick-add.
// Nested SKU price money fields would exceed the catalog API's depth limit of 10.
const skuGroupsQuery = `
  query SkuGroups($first: Int, $after: String, $id: SKUGroupIdsFilter, $listId: ListIdFilter, $label: LabelFilter) {
    skuGroups(
      first: $first
      after: $after
      id: $id
      listId: $listId
      label: $label
      status: { eq: "ACTIVE" }
    ) {
      edges {
        cursor
        node {
          id
          name
          label
          description
          htmlDescription
          type
          priceRange(status: { eq: "ACTIVE" }) {
            min
            max
          }
          compareAtPriceRange(status: { eq: "ACTIVE" }) {
            min
            max
          }
          mediaObjects(first: 25) {
            edges {
              node {
                url
                type
              }
            }
          }
          attributes(first: 50, orderBy: { position: ASC }) {
            edges {
              node {
                id
                name
                label
                description
                htmlDescription
                values(first: 50, orderBy: { position: ASC }) {
                  edges {
                    node {
                      id
                      name
                      label
                    }
                  }
                }
              }
            }
          }
          skus(first: 2, status: { eq: "ACTIVE" }) {
            pageInfo { hasNextPage }
            totalCount
            edges {
              node {
               id
               label
               name
               inventoryCounts {
                  edges {
                    node {
                      id
                      quantity
                      type
                    }
                  }
                }
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  if (typeof value === 'string' && value.length > 0) return [value];
  return [];
}

function asNumber(value: unknown): number | undefined {
  if (typeof value !== 'string' || value.length === 0) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export default async function handler(req: Request, res: Response): Promise<void> {
  try {
    const config: CommerceConfig = readCommerceConfigForResponse(res);
    if (!validateCommerceCartScope(req, res, config)) return;
    const { storeId, clientId, apiBaseUrl } = config;

    const variables = buildSkuGroupsVariables({
      first: asNumber(req.query.first) ?? 24,
      after: typeof req.query.after === 'string' ? req.query.after : undefined,
      searchQuery: typeof req.query.searchQuery === 'string' ? req.query.searchQuery : undefined,
      productIds: asStringArray(req.query.productIds),
      categoryIds: asStringArray(req.query.categoryIds),
    });

    const data = await gqlRequest<SkuGroupsResult, SkuGroupsVariables>({
      endpoint: catalogStorefrontEndpoint({ storeId, apiBaseUrl }),
      query: skuGroupsQuery,
      variables,
      headers: storefrontHeaders({ storeId, clientId }),
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to load products',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
