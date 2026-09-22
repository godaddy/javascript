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
import { validateCommerceCartScope } from '../../../../../lib/commerce/cart-scope';
import {
  catalogStorefrontEndpoint,
  type SkuResult,
  type SkuVariables,
} from '../../../../../lib/commerce/catalog-subgraph';
import { type CommerceConfig, readCommerceConfigForResponse } from '../../../../../lib/commerce/config';
import { gqlRequest, storefrontHeaders } from '../../../../../lib/commerce/gql';

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

export default async function handler(req: Request, res: Response): Promise<void> {
  try {
    const skuId: unknown = req.params.id;
    if (typeof skuId !== 'string' || !skuId) {
      res.status(400).json({ error: 'Missing sku id' });
      return;
    }

    const config: CommerceConfig = readCommerceConfigForResponse(res);
    if (!validateCommerceCartScope(req, res, config)) return;
    const { storeId, clientId, apiBaseUrl } = config;

    const data = await gqlRequest<SkuResult, SkuVariables>({
      endpoint: catalogStorefrontEndpoint({ storeId, apiBaseUrl }),
      query: skuQuery,
      variables: { id: skuId },
      headers: storefrontHeaders({ storeId, clientId }),
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to load sku',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
