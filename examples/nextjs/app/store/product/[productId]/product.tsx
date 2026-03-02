'use client';

import { ProductDetails } from '@godaddy/react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '../../layout';
import { SellingPlanDropdown } from '../selling-plan-dropdown';

const storeId = process.env.NEXT_PUBLIC_GODADDY_STORE_ID ?? '';

export default function Product({ productId }: { productId: string }) {
  const { openCart } = useCart();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  return (
    <div className='container mx-auto'>
      <Link
        href='/store'
        className='inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6'
      >
        <ArrowLeft className='h-4 w-4' />
        Back to Store
      </Link>
      <ProductDetails
        productId={productId}
        onAddToCartSuccess={openCart}
        selectedSellingPlanId={selectedPlanId}
        childrenAboveAddToCart={({ skuId }) =>
          skuId && storeId ? (
            <SellingPlanDropdown
              storeId={storeId}
              skuId={skuId}
              selectedPlanId={selectedPlanId}
              onSelectionChange={setSelectedPlanId}
            />
          ) : null
        }
      />
    </div>
  );
}
