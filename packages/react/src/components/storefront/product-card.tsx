'use client';

import { ChevronRight, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { SKUGroup } from '@/types.ts';

interface ProductCardProps {
  product: SKUGroup;
}

export function ProductCard({ product }: ProductCardProps) {
  const title = product?.label || product?.name || 'Product';
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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <Card className='group overflow-hidden border-border hover:shadow-lg transition-shadow duration-300 flex flex-col'>
      <div className='aspect-square overflow-hidden bg-muted relative'>
        {isOnSale && (
          <Badge className='absolute top-3 right-3 z-10 bg-destructive text-destructive-foreground font-semibold'>
            SALE
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
            No image
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
              ? `${formatCurrency(priceMin)} - ${formatCurrency(priceMax)}`
              : formatCurrency(priceMin)}
          </span>
          {hasOptions ? (
            <Button size='sm' variant='outline' className='gap-1'>
              <span>Select Options</span>
              <ChevronRight className='h-4 w-4' />
            </Button>
          ) : (
            <Button size='sm' onClick={handleAddToCart} className='gap-2'>
              <ShoppingBag className='h-4 w-4' />
              Add to Cart
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export type { ProductCardProps };
