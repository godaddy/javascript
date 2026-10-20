/**
 * GET /api/commerce/products/:id
 *
 * Proxy for the catalog `skuGroup` query — single-product (PDP) detail.
 * Only ACTIVE groups appear on a product page, matching the catalog list.
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
 * Response: { skuGroup: SKUGroup } for an active product, otherwise 404.
 */
import type { Request, Response } from 'express';
import { assertCommerceCartScope } from '@/lib/commerce/cart-scope';
import {
  buildSkuGroupVariables,
  catalogStorefrontEndpoint,
  type SkuGroupResult,
  type SkuGroupsResult,
  type SkuGroupVariables,
} from '@/lib/commerce/catalog-subgraph';
import { commerceRoute } from '@/lib/commerce/commerce-route';
import { type CommerceConfig, readCommerceConfigForResponse } from '@/lib/commerce/config';
import { InvalidRequestError, NotFoundError } from '@/lib/commerce/errors';
import { gqlRequest, storefrontHeaders } from '@/lib/commerce/gql';

type ProductDetailsResult = SkuGroupResult & { activeSkuGroups?: SkuGroupsResult['skuGroups'] };

const skuGroupQuery = `
  query SkuGroup($id: String!, $first: Int, $attributeValues: [String!] = []) {
    activeSkuGroups: skuGroups(id: { in: [$id] }, status: { eq: "ACTIVE" }, first: 1) {
      edges { node { id } }
    }
    skuGroup(id: $id) {
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
      skus(attributeValues: { has: $attributeValues }, first: $first, status: { eq: "ACTIVE" }) {
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

async function readProduct(req: Request, res: Response): Promise<void> {
  const productId: unknown = req.params.id;
  if (typeof productId !== 'string' || !productId) {
    throw new InvalidRequestError('Missing product id');
  }

  const config: CommerceConfig = readCommerceConfigForResponse(res);
  assertCommerceCartScope(req, config);
  const { storeId, clientId, apiBaseUrl } = config;

  const variables = buildSkuGroupVariables({
    productId,
    selectedAttributeValues: asStringArray(req.query.attributeValues),
    skuGroupFirst: asNumber(req.query.skuGroupFirst),
  });

  const data = await gqlRequest<ProductDetailsResult, SkuGroupVariables>({
    endpoint: catalogStorefrontEndpoint({ storeId, apiBaseUrl }),
    query: skuGroupQuery,
    variables,
    headers: storefrontHeaders({ storeId, clientId }),
  });

  if (!data.skuGroup || !data.activeSkuGroups?.edges?.some((edge) => edge?.node?.id === productId)) {
    throw new NotFoundError('Product not found');
  }

  res.json({ skuGroup: data.skuGroup });
}

export default commerceRoute('Failed to load product', readProduct);
