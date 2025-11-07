'use client';

import { ProductDetails } from '@godaddy/react';

export default function Product({ skuId }: { skuId: string }) {
  return (
    <div className='container mx-auto'>
      <ProductDetails
        sku={skuId}
        storeId='0eb49b3e-21ee-484b-93f2-a61d8717d890'
        clientId='e0640f63-e88b-4c55-a909-562567600f47'
      />
    </div>
  );
}
