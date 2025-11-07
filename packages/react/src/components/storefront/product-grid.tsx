'use client';

import { useQuery } from '@tanstack/react-query';
import { getSkuGroups } from '@/lib/godaddy/godaddy';
import { ProductCard } from './product-card';

interface ProductGridProps {
  storeId: string;
  clientId: string;
  first?: number;
}

export function ProductGrid({
  storeId,
  clientId,
  first = 100,
}: ProductGridProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['sku-groups', { storeId, clientId, first }],
    queryFn: () => getSkuGroups(storeId, clientId, { first }),
    enabled: !!storeId && !!clientId,
  });

  if (isLoading) {
    return <div>Loading products...</div>;
  }

  if (error) {
    return <div>Error loading products: {error.message}</div>;
  }

  const skuGroups = data?.catalog?.skuGroups?.edges;

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
      {skuGroups?.map(edge => {
        const group = edge?.node;
        if (!group) return null;

        return <ProductCard key={group.id} product={group} />;
      })}
    </div>
  );
}
