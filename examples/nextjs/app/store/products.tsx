'use client';

import { ProductGrid } from '@godaddy/react';
import { useCart } from './layout';

export default function ProductsPage() {
  const { openCart } = useCart();

  return (
    <div className='container mx-auto'>
      <ProductGrid
        enablePagination
        getProductHref={sku => `/store/product/${sku}`}
        onAddToCartSuccess={openCart}
      />
    </div>
  );
}
