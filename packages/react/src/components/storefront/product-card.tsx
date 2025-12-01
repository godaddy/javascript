'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Loader2, ShoppingBag } from 'lucide-react';
import { useFormatCurrency } from '@/components/checkout/utils/format-currency';
import { useAddToCart } from '@/components/storefront/hooks/use-add-to-cart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RouterLink } from '@/components/ui/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useGoDaddyContext } from '@/godaddy-provider';
import { getSkuGroup } from '@/lib/godaddy/godaddy';
import { SKUGroup } from '@/types.ts';

interface ProductCardProps {
  product?: SKUGroup;
  productId?: string;
  storeId?: string;
  clientId?: string;
  href?: string;
  getProductHref?: (productId: string) => string;
  onAddToCartSuccess?: () => void;
  onAddToCartError?: (error: Error) => void;
}

export function ProductCard({
  product: productProp,
  productId,
  storeId: storeIdProp,
  clientId: clientIdProp,
  href: hrefProp,
  getProductHref,
  onAddToCartSuccess,
  onAddToCartError,
}: ProductCardProps) {
  // All hooks must be called at the top, before any conditional returns
  const context = useGoDaddyContext();
  const { t } = context;
  const formatCurrency = useFormatCurrency();
  const storeId = storeIdProp || context.storeId;
  const clientId = clientIdProp || context.clientId;

  // Fetch product by ID if productId is provided
  const { data: fetchedProductData, isLoading } = useQuery({
    queryKey: ['sku-group', productId, storeId, clientId],
    queryFn: () =>
      getSkuGroup({ id: productId! }, storeId!, clientId!, context.apiHost),
    enabled: !!productId && !!storeId && !!clientId && !productProp,
  });

  // Use shared add to cart hook
  const { addToCart, isLoading: isAddingToCart } = useAddToCart({
    onSuccess: onAddToCartSuccess,
    onError: onAddToCartError,
  });

  // Use fetched product or prop product
  const product = productProp || fetchedProductData?.skuGroup;

  // Compute href with priority: explicit href > getProductHref > no link
  const resolvedProductId = product?.id || productId;
  const href =
    hrefProp ||
    (getProductHref && resolvedProductId
      ? getProductHref(resolvedProductId)
      : undefined);

  // Show loading skeleton while fetching
  if (isLoading || !product) {
    return (
      <Card className='overflow-hidden border-border flex flex-col h-full'>
        <div className='aspect-square overflow-hidden bg-muted'>
          <Skeleton className='w-full h-full' />
        </div>
        <div className='p-4 space-y-2 flex flex-col flex-1'>
          <Skeleton className='h-5 w-3/4' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-2/3' />
          <div className='flex items-center justify-between pt-2 mt-auto'>
            <Skeleton className='h-6 w-20' />
            <Skeleton className='h-9 w-24' />
          </div>
        </div>
      </Card>
    );
  }
  const title = product?.label || product?.name || t.storefront.product;
  const description = product?.description || '';
  const priceMin = product?.priceRange?.min || 0;
  const priceMax = product?.priceRange?.max || priceMin;
  const compareAtMin = product?.compareAtPriceRange?.min;
  const isOnSale = compareAtMin && compareAtMin > priceMin;
  const hasOptions = false;
  const isPriceRange = priceMin !== priceMax;

  const imageUrl = product?.mediaObjects?.edges?.find(
    edge => edge?.node?.type === 'IMAGE'
  )?.node?.url;

  // Get first SKU and check inventory
  const firstSku = product?.skus?.edges?.[0]?.node;
  const skuId = firstSku?.id || product?.id || '';

  // Check available inventory for first SKU
  const inventoryCounts = firstSku?.inventoryCounts?.edges || [];
  const availableInventory =
    inventoryCounts.find((edge: any) => edge?.node?.type === 'AVAILABLE')?.node
      ?.quantity || 0;

  const isFirstSkuInStock = availableInventory > 0;
  const hasMultipleSkus = (product?.skus?.edges?.length || 0) > 1;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!skuId) {
      return;
    }

    await addToCart({
      skuId,
      name: title,
      quantity: 1,
      productAssetUrl: imageUrl || undefined,
    });
  };

  // Determine which button to show based on inventory and variants
  const getActionButton = () => {
    // If product has options (future use case), show "Select Options"
    if (hasOptions) {
      return (
        <Button size='sm' variant='outline' className='gap-1'>
          <span>{t.storefront.selectOptions}</span>
          <ChevronRight className='h-4 w-4' />
        </Button>
      );
    }

    // If first SKU is out of stock
    if (!isFirstSkuInStock) {
      // If there are multiple SKUs and an href, suggest viewing details
      if (hasMultipleSkus && href) {
        return (
          <Button size='sm' variant='secondary' className='gap-1'>
            <span>{t.storefront.viewDetails}</span>
            <ChevronRight className='h-4 w-4' />
          </Button>
        );
      }
      // Otherwise show out of stock button
      return (
        <Button size='sm' variant='secondary' disabled>
          {t.storefront.outOfStock}
        </Button>
      );
    }

    // First SKU is in stock, show "Add to Cart"
    return (
      <Button
        size='sm'
        onClick={handleAddToCart}
        className='gap-2'
        disabled={isAddingToCart}
      >
        {isAddingToCart ? (
          <Loader2 className='h-4 w-4 animate-spin' />
        ) : (
          <ShoppingBag className='h-4 w-4' />
        )}
        {isAddingToCart ? t.storefront.adding : t.storefront.addToCart}
      </Button>
    );
  };

  const cardContent = (
    <>
      <div className='aspect-square overflow-hidden bg-muted relative'>
        {isOnSale && (
          <Badge
            variant='accent'
            className='absolute top-3 right-3 z-10 font-semibold'
          >
            {t.storefront.sale}
          </Badge>
        )}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
          />
        ) : (
          <div className='w-full h-full flex items-center justify-center text-muted-foreground'>
            {t.storefront.noImage}
          </div>
        )}
      </div>
      <div className='p-4 space-y-2 flex flex-col flex-1'>
        <h3 className='font-medium text-foreground group-hover:text-primary transition-colors'>
          {title}
        </h3>
        <p className='text-sm text-muted-foreground line-clamp-2'>
          {description}
        </p>
        <div className='flex items-center justify-between pt-2 mt-auto'>
          <span className='text-md font-semibold text-foreground'>
            {isPriceRange
              ? `${formatCurrency({ amount: priceMin, currencyCode: 'USD', inputInMinorUnits: true })} - ${formatCurrency({ amount: priceMax, currencyCode: 'USD', inputInMinorUnits: true })}`
              : formatCurrency({
                  amount: priceMin,
                  currencyCode: 'USD',
                  inputInMinorUnits: true,
                })}
          </span>
          {getActionButton()}
        </div>
      </div>
    </>
  );

  if (href) {
    return (
      <RouterLink href={href} className='block'>
        <Card className='group overflow-hidden border-border hover:shadow-lg transition-shadow duration-300 flex flex-col h-full'>
          {cardContent}
        </Card>
      </RouterLink>
    );
  }

  return (
    <Card className='group overflow-hidden border-border hover:shadow-lg transition-shadow duration-300 flex flex-col'>
      {cardContent}
    </Card>
  );
}

export type { ProductCardProps };
