'use client';

import { ProductGrid, ProductSearch } from '@godaddy/react';
import { useCart } from './layout';
import { getSellingSellingPlans } from './actions';

export default function ProductsPage() {
  const { openCart } = useCart();

  return (
    <div className='container mx-auto'>
      <div className='mb-6 max-w-md'>
        <ProductSearch />
      </div>
      <ProductGrid
        enablePagination
        getProductHref={sku => `/store/product/${sku}`}
        getSellingPlans={(storeId, skuIds) =>
          getSellingSellingPlans(storeId, { skuIds })
        }
        onAddToCartSuccess={openCart}
      />
    </div>
  );
}
