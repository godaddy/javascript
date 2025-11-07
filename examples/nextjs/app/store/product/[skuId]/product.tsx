'use client';

import { ProductDetails } from '@godaddy/react';

export default function Product({ skuId }: { skuId: string }) {
  return (
    <div className='container mx-auto'>
      <ProductDetails sku={skuId} />
    </div>
  );
}
