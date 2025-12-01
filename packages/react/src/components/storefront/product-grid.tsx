'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useGoDaddyContext } from '@/godaddy-provider';
import { getSkuGroups } from '@/lib/godaddy/godaddy';
import { ProductCard } from './product-card';

interface ProductGridProps {
  storeId?: string;
  clientId?: string;
  enablePagination?: boolean;
  getProductHref?: (productId: string) => string;
  onAddToCartSuccess?: () => void;
  onAddToCartError?: (error: Error) => void;
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
  enablePagination = false,
  getProductHref,
  onAddToCartSuccess,
  onAddToCartError,
}: ProductGridProps) {
  const context = useGoDaddyContext();
  const { t } = context;
  const storeId = storeIdProp || context.storeId;
  const clientId = clientIdProp || context.clientId;

  const [perPage, setPerPage] = useState(12);
  const [pageCursors, setPageCursors] = useState<(string | null)[]>([null]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const first = enablePagination ? perPage : 100;
  const after = pageCursors[currentPageIndex] || undefined;

  const { data, isLoading, error } = useQuery({
    queryKey: ['sku-groups', { storeId, clientId, first, after }],
    queryFn: () =>
      getSkuGroups({ first, after }, storeId!, clientId!, context?.apiHost),
    enabled: !!storeId && !!clientId,
  });

  if (isLoading || !data) {
    return <ProductGridSkeleton count={enablePagination ? perPage : 6} />;
  }

  if (error) {
    return (
      <div>
        {t.storefront.errorLoadingProducts} {error.message}
      </div>
    );
  }

  const skuGroups = data?.skuGroups?.edges;
  const pageInfo = data?.skuGroups?.pageInfo;
  const totalCount = data?.skuGroups?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / perPage);
  const currentPage = currentPageIndex + 1;

  if (
    pageInfo?.endCursor &&
    pageInfo?.hasNextPage &&
    !pageCursors[currentPageIndex + 1]
  ) {
    setPageCursors([...pageCursors, pageInfo.endCursor]);
  }

  const handlePageChange = (page: number) => {
    setCurrentPageIndex(page - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePerPageChange = (value: string) => {
    setPerPage(Number(value));
    setCurrentPageIndex(0);
    setPageCursors([null]); // Reset cursors when changing per page
  };

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className='space-y-4'>
      {enablePagination && (
        <div className='flex justify-end'>
          <div className='flex items-center gap-2'>
            <span className='text-sm text-muted-foreground'>
              {t.storefront.itemsPerPage}
            </span>
            <Select
              value={perPage.toString()}
              onValueChange={handlePerPageChange}
            >
              <SelectTrigger className='w-20'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='12'>12</SelectItem>
                <SelectItem value='24'>24</SelectItem>
                <SelectItem value='36'>36</SelectItem>
                <SelectItem value='48'>48</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {skuGroups?.map(edge => {
          const group = edge?.node;
          if (!group?.id) return null;

          const href = getProductHref?.(group.id);
          return (
            <ProductCard
              key={group.id}
              product={group}
              href={href}
              onAddToCartSuccess={onAddToCartSuccess}
              onAddToCartError={onAddToCartError}
            />
          );
        })}
      </div>

      {enablePagination && totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href='#'
                onClick={e => {
                  e.preventDefault();
                  if (currentPage > 1) handlePageChange(currentPage - 1);
                }}
                aria-disabled={currentPage === 1}
                className={
                  currentPage === 1 ? 'pointer-events-none opacity-50' : ''
                }
              />
            </PaginationItem>

            {getPageNumbers().map((page, index) =>
              page === 'ellipsis' ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationLink
                    href='#'
                    onClick={e => {
                      e.preventDefault();
                      handlePageChange(page);
                    }}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                href='#'
                onClick={e => {
                  e.preventDefault();
                  if (currentPage < totalPages)
                    handlePageChange(currentPage + 1);
                }}
                aria-disabled={currentPage === totalPages}
                className={
                  currentPage === totalPages
                    ? 'pointer-events-none opacity-50'
                    : ''
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
