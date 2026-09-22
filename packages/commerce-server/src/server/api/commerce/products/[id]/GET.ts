/**
 * GET /api/commerce/products/:id
 *
 * Proxy for the catalog `skuGroup` query — single-product (PDP) detail.
 * Re-call this route after the user picks attribute values to narrow the
 * SKU set (pass `?attributeValues=red&attributeValues=large`). Use the
 * `getSingleMatchedSku` helper returns the selected SKU, including price,
 * inventory, and media, without a separate SKU request.
 *
 * Query params:
 *   attributeValues - repeat for each chosen attribute value's `name` field
 *                      (from getProductAttributes), never its `id`.
 *   skuGroupFirst   - max SKUs to return before any attribute is picked (default 50)
 *
 * Response: { skuGroup: SKUGroup | null }
 */
import type { Request, Response } from 'express';
import { validateCommerceCartScope } from '@/lib/commerce/cart-scope';
import {
  buildSkuGroupVariables,
  catalogStorefrontEndpoint,
  type SkuGroupResult,
  type SkuGroupVariables,
} from '@/lib/commerce/catalog-subgraph';
import { type CommerceConfig, readCommerceConfigForResponse } from '@/lib/commerce/config';
import { gqlRequest, storefrontHeaders } from '@/lib/commerce/gql';

const skuGroupQuery = `
  query SkuGroup($id: String!, $first: Int, $attributeValues: [String!] = []) {
    skuGroup(id: $id) {
      id
      name
      label
      description
      htmlDescription
      type
      priceRange {
        min
        max
      }
      compareAtPriceRange {
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
      attributes {
        edges {
          node {
            id
            name
            label
            description
            htmlDescription
            values(first: 50) {
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
      skus(attributeValues: { has: $attributeValues }, first: $first) {
        pageInfo { hasNextPage }
        totalCount
        edges {
          node {
           id
           label
           name
            description
            prices(first: 10) {
              edges {
                node {
                  value { value currencyCode }
                  compareAtValue { value currencyCode }
                }
              }
            }
            mediaObjects(first: 25) {
              edges { node { url type } }
            }
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
    const productId: unknown = req.params.id;
    if (typeof productId !== 'string' || !productId) {
      res.status(400).json({ error: 'Missing product id' });
      return;
    }

    const config: CommerceConfig = readCommerceConfigForResponse(res);
    if (!validateCommerceCartScope(req, res, config)) return;
    const { storeId, clientId, apiBaseUrl } = config;

    const variables = buildSkuGroupVariables({
      productId,
      selectedAttributeValues: asStringArray(req.query.attributeValues),
      skuGroupFirst: asNumber(req.query.skuGroupFirst),
    });

    const data = await gqlRequest<SkuGroupResult, SkuGroupVariables>({
      endpoint: catalogStorefrontEndpoint({ storeId, apiBaseUrl }),
      query: skuGroupQuery,
      variables,
      headers: storefrontHeaders({ storeId, clientId }),
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to load product',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
