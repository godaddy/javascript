'use client';

import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { useGoDaddyContext } from '@/godaddy-provider';
import { getSkuGroups } from '@/lib/godaddy/godaddy';
import { ProductCard } from './product-card';

interface ProductGridProps {
  storeId?: string;
  clientId?: string;
  first?: number;
  getProductHref?: (productId: string) => string;
}

function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className='flex flex-col space-y-3'>
          <Skeleton className='h-48 w-full rounded-lg' />
          <div className='space-y-2'>
            <Skeleton className='h-4 w-3/4' />
            <Skeleton className='h-4 w-1/2' />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductGrid({
  storeId: storeIdProp,
  clientId: clientIdProp,
  first = 100,
  getProductHref,
}: ProductGridProps) {
  const context = useGoDaddyContext();
  const storeId = storeIdProp || context.storeId;
  const clientId = clientIdProp || context.clientId;

  const { data, isLoading, error } = useQuery({
    queryKey: ['sku-groups', { storeId, clientId, first }],
    queryFn: () =>
      getSkuGroups({ first }, storeId!, clientId!, context?.apiHost),
    enabled: !!storeId && !!clientId,
  });

  if (isLoading || !data) {
    return <ProductGridSkeleton />;
  }

  if (error) {
    return <div>Error loading products: {error.message}</div>;
  }

  const skuGroups = data?.skuGroups?.edges;

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
      {skuGroups?.map(edge => {
        const group = edge?.node;
        if (!group?.id) return null;

        const href = getProductHref?.(group.id);
        return <ProductCard key={group.id} product={group} href={href} />;
      })}
    </div>
  );
}
