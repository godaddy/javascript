'use client';

import { ChevronRight, Loader2, ShoppingBag } from 'lucide-react';
import { useFormatCurrency } from '@/components/checkout/utils/format-currency';
import { useAddToCart } from '@/components/storefront/hooks/use-add-to-cart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RouterLink } from '@/components/ui/link';
import { useGoDaddyContext } from '@/godaddy-provider';
import { SKUGroup } from '@/types.ts';

interface ProductCardProps {
  product: SKUGroup;
  href?: string;
  onAddToCartSuccess?: () => void;
  onAddToCartError?: (error: Error) => void;
}

export function ProductCard({
  product,
  href,
  onAddToCartSuccess,
  onAddToCartError,
}: ProductCardProps) {
  const formatCurrency = useFormatCurrency();
  const { t } = useGoDaddyContext();
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

  // Get first SKU for products without options
  const firstSku = product?.skus?.edges?.[0]?.node;
  const skuId = firstSku?.id || product?.id || '';

  // Use shared add to cart hook
  const { addToCart, isLoading: isAddingToCart } = useAddToCart({
    onSuccess: onAddToCartSuccess,
    onError: onAddToCartError,
  });

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

  const cardContent = (
    <>
      <div className='aspect-square overflow-hidden bg-muted relative'>
        {isOnSale && (
          <Badge className='absolute top-3 right-3 z-10 bg-destructive text-destructive-foreground font-semibold'>
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
          {hasOptions ? (
            <Button size='sm' variant='outline' className='gap-1'>
              <span>{t.storefront.selectOptions}</span>
              <ChevronRight className='h-4 w-4' />
            </Button>
          ) : (
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
          )}
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
