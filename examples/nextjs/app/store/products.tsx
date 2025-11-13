'use client';

import { ProductGrid } from '@godaddy/react';

export default function ProductsPage() {
  return (
    <div className='container mx-auto'>
      <ProductGrid getProductHref={sku => `/store/product/${sku}`} />
    </div>
  );
}
