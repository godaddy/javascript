'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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
import type { SkuGroupsInput } from '@/types';
import { ProductCard } from './product-card';

interface ProductGridProps {
  storeId?: string;
  clientId?: string;
  /** Filter products by specific product IDs */
  productIds?: string[];
  /** Filter products by category IDs (maps to listId in GraphQL) */
  categoryIds?: string[];
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
  productIds,
  categoryIds,
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
  const [searchQuery, setSearchQuery] = useState('');

  const first = enablePagination ? perPage : 100;
  const after = pageCursors[currentPageIndex] || undefined;

  // Get search query from URL and update state when it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateSearchQuery = () => {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q') || '';
      setSearchQuery(q);
    };

    // Set initial value
    updateSearchQuery();

    // Listen for URL changes (both browser navigation and custom events)
    const handleUrlChange = () => {
      updateSearchQuery();
    };

    // Handle browser back/forward navigation
    window.addEventListener('popstate', handleUrlChange);
    // Handle custom URL change events (from ProductSearch)
    window.addEventListener('urlchange', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('urlchange', handleUrlChange);
    };
  }, []);

  // Reset pagination when search query changes
  useEffect(() => {
    setCurrentPageIndex(0);
    setPageCursors([null]);
  }, [searchQuery]);

  // Build filter object for GraphQL query
  // Map categoryIds to listId (GraphQL uses 'listId' for categories)
  // Only apply search filter if no productIds or categoryIds are provided
  const hasExplicitFilters =
    (productIds && productIds.length > 0) ||
    (categoryIds && categoryIds.length > 0);

  const filters: SkuGroupsInput = {
    first,
    after,
    ...(productIds && productIds.length > 0 && { id: { in: productIds } }),
    ...(categoryIds &&
      categoryIds.length > 0 && { listId: { in: categoryIds } }),
    // Search is only applied when no explicit product/category filters are set
    ...(!hasExplicitFilters &&
      searchQuery && { label: { contains: searchQuery } }),
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['sku-groups', { storeId, clientId, ...filters }],
    queryFn: () => getSkuGroups(filters, storeId!, clientId!, context?.apiHost),
    enabled: !!storeId && !!clientId,
  });

  if (isLoading || !data) {
    return <ProductGridSkeleton count={enablePagination ? perPage : 6} />;
  }

  if (error) {
    const message = error instanceof Error ? error.message : String(error);
    return (
      <div>
        {t.storefront.errorLoadingProducts} {message}
      </div>
    );
  }

  const skuGroups = data?.skuGroups?.edges;
  const pageInfo = data?.skuGroups?.pageInfo;
  const totalCount = data?.skuGroups?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / perPage);
  const currentPage = currentPageIndex + 1;

  useEffect(() => {
    if (pageInfo?.endCursor && pageInfo?.hasNextPage) {
      setPageCursors(prev => {
        if (prev[currentPageIndex + 1]) return prev;
        return [...prev, pageInfo.endCursor];
      });
    }
  }, [pageInfo?.endCursor, pageInfo?.hasNextPage, currentPageIndex]);

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

          return (
            <ProductCard
              key={group.id}
              product={group}
              getProductHref={getProductHref}
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
