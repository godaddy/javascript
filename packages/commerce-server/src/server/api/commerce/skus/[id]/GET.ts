/**
 * GET /api/commerce/skus/:id
 *
 * Proxy for the catalog `sku` query — once the PDP has resolved a single
 * SKU (single-variant SKUGroup, or attribute selection narrowed to one),
 * fetch the full SKU for prices, media, inventory, and description.
 *
 * Response: { sku: SKU | null }
 */
import type { Request, Response } from 'express';
import { assertCommerceCartScope } from '@/lib/commerce/cart-scope';
import {
  catalogStorefrontEndpoint,
  type SkuResult,
  type SkuVariables,
} from '@/lib/commerce/catalog-subgraph';
import { commerceRoute } from '@/lib/commerce/commerce-route';
import { type CommerceConfig, readCommerceConfigForResponse } from '@/lib/commerce/config';
import { InvalidRequestError } from '@/lib/commerce/errors';
import { gqlRequest, storefrontHeaders } from '@/lib/commerce/gql';

const skuQuery = `
  query Sku($id: String!) {
    sku(id: $id) {
      id
      label
      name
      description
      htmlDescription
      code
      prices {
        edges {
          node {
            id
            value {
              value
              currencyCode
            }
            compareAtValue {
              value
              currencyCode
            }
          }
        }
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
      mediaObjects {
        edges {
          node {
            id
            url
            type
            label
            position
          }
        }
      }
      attributeValues {
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
`;

async function readSku(req: Request, res: Response): Promise<void> {
  const skuId: unknown = req.params.id;
  if (typeof skuId !== 'string' || !skuId) {
    throw new InvalidRequestError('Missing sku id');
  }

  const config: CommerceConfig = readCommerceConfigForResponse(res);
  assertCommerceCartScope(req, config);
  const { storeId, clientId, apiBaseUrl } = config;

  const data = await gqlRequest<SkuResult, SkuVariables>({
    endpoint: catalogStorefrontEndpoint({ storeId, apiBaseUrl }),
    query: skuQuery,
    variables: { id: skuId },
    headers: storefrontHeaders({ storeId, clientId }),
  });

  res.json(data);
}

export default commerceRoute('Failed to load sku', readSku);
