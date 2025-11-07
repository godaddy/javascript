'use client';

import { use } from 'react';
import Product from '@/app/store/product/[skuId]/product';

export default function ProductPage({
  params,
}: {
  params: Promise<{ skuId: string }>;
}) {
  const { skuId } = use(params);

  return (
    <div className='p-4'>
      <Product skuId={skuId} />
    </div>
  );
}
