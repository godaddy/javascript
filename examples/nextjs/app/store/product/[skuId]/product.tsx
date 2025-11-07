'use client';

import { ProductDetails } from '@godaddy/react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function Product({ skuId }: { skuId: string }) {
  return (
    <div className='container mx-auto'>
      <Link
        href='/store'
        className='inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6'
      >
        <ArrowLeft className='h-4 w-4' />
        Back to Store
      </Link>
      <ProductDetails sku={skuId} />
    </div>
  );
}
