'use client';

import { ProductDetails } from '@godaddy/react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { SellingPlanOption } from '../../actions';
import { SellingPlanDropdown } from '../selling-plan-dropdown';
import { useCart } from '../../layout';

export default function Product({ productId }: { productId: string }) {
  const { openCart } = useCart();
  const [selectedSellingPlanId, setSelectedSellingPlanId] = useState<string | null>(null);
  const [selectedSellingPlan, setSelectedSellingPlan] = useState<SellingPlanOption | null>(null);

  const handleSellingPlanChange = (planId: string | null, plan: SellingPlanOption | null) => {
    setSelectedSellingPlanId(planId);
    setSelectedSellingPlan(plan);
  };

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
        selectedSellingPlanId={selectedSellingPlanId}
        selectedSellingPlan={selectedSellingPlan}
        childrenAboveAddToCart={({ skuId, storeId }) => (
          <SellingPlanDropdown
            storeId={storeId ?? process.env.NEXT_PUBLIC_GODADDY_STORE_ID ?? ''}
            skuId={skuId}
            selectedPlanId={selectedSellingPlanId}
            onSelectionChange={handleSellingPlanChange}
          />
        )}
      />
    </div>
  );
}
