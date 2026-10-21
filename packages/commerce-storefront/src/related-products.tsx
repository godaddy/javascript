import { useQuery } from '@tanstack/react-query';
import { type ReactElement, type ReactNode, useId, useMemo } from 'react';
import { useParams } from 'react-router';
import { request } from './api';
import { catalogGridClass } from './catalog';
import type { SKUGroup, SkuGroupsResult } from './catalog-model';
import { useCommerce } from './commerce-provider';
import { hasChildren, partProps } from './part';
import { CatalogItemContext, PackagedCardParts, ProductCardRoot, packagedCardClass } from './product-card';
import { StorefrontSurface } from './storefront-surface';

export interface RelatedProductsProps {
  /** The product to leave out. Defaults to the route's `:productId` parameter. */
  productId?: string;
  /** The H2. Defaults to "You may also like". */
  title?: ReactNode;
  /** The most products to show, a whole number from 1 to 24. Defaults to 4. */
  limit?: number;
  /** Added to the root `<section>`. */
  className?: string;
  /** One card, rendered for every product. Defaults to the packaged card. */
  children?: ReactNode;
}

const packagedCard: ReactElement = (
  <ProductCardRoot className={packagedCardClass}>
    <PackagedCardParts />
  </ProductCardRoot>
);

/**
 * Other products from the catalog's first page, leaving out the current one. Optional and separate from
 * `ProductDetails`: place it wherever it fits, such as after the product page. There is no related-products API, so
 * the products are the catalog's first ones. Renders nothing until they load, when none are left, if the request
 * fails, or while no store is connected.
 */
export function RelatedProducts({
  productId: productIdProp,
  title = 'You may also like',
  limit = 4,
  className,
  children,
}: RelatedProductsProps): ReactElement | null {
  const { productId: routeProductId = '' } = useParams();
  const productId: string = productIdProp ?? routeProductId;
  const { config, connection } = useCommerce();
  const headingId = useId();
  // One extra, in case the current product is among them.
  const first: number = limit + 1;
  const products = useQuery({
    retry: false,
    enabled: connection === 'ready',
    // The same key as a catalog page of this size, so the two share the request.
    queryKey: ['commerce', config.cartScope, 'products', first, ''],
    queryFn: ({ signal }) =>
      request<SkuGroupsResult>(`/products?first=${first}`, {
        signal,
        headers: { 'X-Commerce-Scope': config.cartScope },
      }),
  });
  const related = useMemo(
    (): SKUGroup[] =>
      (products.data?.skuGroups?.edges ?? [])
        .flatMap((edge) => (edge?.node?.id && edge.node.id !== productId ? [edge.node] : []))
        .slice(0, limit),
    [products.data, productId, limit],
  );
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 24)
    throw new Error(`RelatedProducts limit must be a whole number from 1 to 24, not ${limit}.`);
  if (connection !== 'ready' || !related.length) return null;
  const card: ReactNode = hasChildren(children) ? children : packagedCard;
  return (
    <StorefrontSurface>
      <section aria-labelledby={headingId} {...partProps('related-products', className)}>
        <h2 id={headingId} className='mb-6 text-xl font-semibold tracking-tight'>
          {title}
        </h2>
        <div className={catalogGridClass}>
          {related.map((product) => (
            <CatalogItemContext.Provider key={product.id} value={{ source: 'live', product }}>
              {card}
            </CatalogItemContext.Provider>
          ))}
        </div>
      </section>
    </StorefrontSurface>
  );
}
