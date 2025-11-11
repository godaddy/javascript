'use client';

import { use } from 'react';
import Product from '@/app/store/product/[productId]/product';

export default function ProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = use(params);

  return (
    <div className='p-4'>
      <Product productId={productId} />
    </div>
  );
}
