'use client';

import { useQuery } from '@tanstack/react-query';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { parseAsString, useQueryStates } from 'nuqs';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import { useGoDaddyContext } from '@/godaddy-provider';
import { getSkuGroups } from '@/lib/godaddy/godaddy';
import { formatCurrency } from '@/lib/utils';

interface ProductDetailsProps {
  sku: string;
  storeId?: string;
  clientId?: string;
}

/**
 * TODO: Product Details Enhancements
 *
 * 1. Variant SKU Management
 *    - [ ] Fetch individual variant SKUs based on selected attribute combinations
 *    - [ ] Query SKU-level data when attributes change (size, color, etc.)
 *    - [ ] Update product price and images when variant changes
 *    - [ ] Handle variant-specific media objects
 *
 * 2. Inventory Management
 *    - [ ] Check real-time inventory levels for the selected variant
 *    - [ ] Display available quantity or low stock warnings
 *    - [ ] Integrate inventory API calls
 *    - [ ] Cache inventory data with appropriate TTL
 *
 * 3. Out of Stock UI
 *    - [ ] Add "Out of Stock" badge when inventory is depleted
 *    - [ ] Disable "Add to Cart" button for out-of-stock items
 *    - [ ] Show "Notify When Available" option for out-of-stock products
 *    - [ ] Display estimated restock date if available
 *
 * 4. Unavailable Variant UI
 *    - [ ] Disable attribute options that result in unavailable variants
 *    - [ ] Show strikethrough or greyed-out style for unavailable options
 *    - [ ] Display tooltip explaining why option is unavailable
 *    - [ ] Prevent selection of invalid attribute combinations
 *    - [ ] Show nearest available alternative when variant is unavailable
 */

function ProductDetailsSkeleton() {
  return (
    <div className='grid md:grid-cols-2 gap-8 p-4'>
      <div className='space-y-4'>
        {/* Main Image Skeleton */}
        <div className='relative'>
          <Card className='overflow-hidden aspect-square bg-muted border-border'>
            <Skeleton className='w-full h-full' />
          </Card>
        </div>

        {/* Thumbnail Skeletons */}
        <div className='grid grid-cols-4 gap-2'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className='aspect-square w-full rounded-md border border-input overflow-hidden'
            >
              <Skeleton className='w-full h-full' />
            </div>
          ))}
        </div>
      </div>
      <div className='space-y-6'>
        <div>
          <Skeleton className='h-10 w-3/4 mb-4' />
          <Skeleton className='h-8 w-1/3 mb-2' />
          <Skeleton className='h-6 w-1/4' />
        </div>
        <div className='space-y-2 border-t border-border pt-4'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-3/4' />
        </div>
        {/* Add to Cart Button Skeleton */}
        <Skeleton className='h-11 w-full rounded-md' />
        {/* Additional Product Information Skeleton */}
        <div className='border-t border-border pt-4 space-y-2'>
          <div className='flex justify-between'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-4 w-32' />
          </div>
          <div className='flex justify-between'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-4 w-40' />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductDetails({
  sku,
  storeId: storeIdProp,
  clientId: clientIdProp,
}: ProductDetailsProps) {
  const context = useGoDaddyContext();

  // Props take priority over context values
  const storeId = storeIdProp || context.storeId;
  const clientId = clientIdProp || context.clientId;

  const [quantity, setQuantity] = useState(1);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [thumbnailApi, setThumbnailApi] = useState<CarouselApi>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Track variant attributes in URL query params
  // Using nuqs to sync selected attributes (size, color, etc.) with the URL
  const [variantParams, setVariantParams] = useQueryStates(
    {
      size: parseAsString.withDefault(''),
      color: parseAsString.withDefault(''),
    },
    {
      history: 'push',
      shallow: true,
    }
  );

  // Convert nuqs attributes to the format expected by the component
  const selectedAttributes = useMemo(() => {
    const attrs: Record<string, string> = {};
    Object.entries(variantParams).forEach(([key, value]) => {
      if (value) attrs[key] = value;
    });
    return attrs;
  }, [variantParams]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['sku-group', { storeId, clientId, sku }],
    queryFn: () => getSkuGroups(storeId!, clientId!, { ids: [sku] }),
    enabled: !!storeId && !!clientId && !!sku,
  });

  // Track main carousel selection and sync thumbnail carousel
  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      const index = carouselApi.selectedScrollSnap();
      setCurrentImageIndex(index);

      // Sync thumbnail carousel to show the selected thumbnail
      if (thumbnailApi) {
        thumbnailApi.scrollTo(index);
      }
    };

    // Set initial index
    onSelect();

    // Listen for selection changes
    carouselApi.on('select', onSelect);

    // Cleanup
    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi, thumbnailApi]);

  if (isLoading) {
    return <ProductDetailsSkeleton />;
  }

  if (error) {
    return (
      <div className='p-4'>
        <div className='text-center text-destructive'>
          Error loading product: {error.message}
        </div>
      </div>
    );
  }

  const product = data?.catalog?.skuGroups?.edges?.[0]?.node;

  if (!product) {
    return (
      <div className='p-4'>
        <div className='text-center text-muted-foreground'>
          Product not found
        </div>
      </div>
    );
  }

  const title = product?.label || product?.name || 'Product';
  const description = product?.description || '';
  const htmlDescription = product?.htmlDescription || '';
  const priceMin = product?.priceRange?.min || 0;
  const priceMax = product?.priceRange?.max || priceMin;
  const compareAtMin = product?.compareAtPriceRange?.min;
  const compareAtMax = product?.compareAtPriceRange?.max;
  const isOnSale = compareAtMin && compareAtMin > priceMin;
  const isPriceRange = priceMin !== priceMax;
  const isCompareAtPriceRange =
    compareAtMin && compareAtMax && compareAtMin !== compareAtMax;

  // Get all media objects (images)
  const mediaObjects = product?.mediaObjects?.edges || [];

  const images = mediaObjects
    .filter((edge: any) => edge?.node?.type === 'IMAGE')
    .map((edge: any) => edge?.node?.url)
    .filter(Boolean);

  // const images = [...imagesSrc, ...imagesSrc, ...imagesSrc];

  // Placeholder for product attributes (size, color, etc.)
  // In a real implementation, these would come from SKU-level data
  // SKUGroups don't have attributes, individual SKUs within the group do
  const attributes = [
    {
      id: 'size',
      name: 'size',
      label: 'Size',
      values: [
        { id: 'xs', name: 'XS', label: 'Extra Small' },
        { id: 's', name: 'S', label: 'Small' },
        { id: 'm', name: 'M', label: 'Medium' },
        { id: 'l', name: 'L', label: 'Large' },
        { id: 'xl', name: 'XL', label: 'Extra Large' },
      ],
    },
    {
      id: 'color',
      name: 'color',
      label: 'Color',
      values: [
        { id: 'black', name: 'Black', label: 'Black' },
        { id: 'white', name: 'White', label: 'White' },
        { id: 'blue', name: 'Blue', label: 'Blue' },
        { id: 'red', name: 'Red', label: 'Red' },
      ],
    },
  ];

  const handleAttributeChange = (attributeName: string, valueId: string) => {
    // Update the URL query params with the new attribute value
    setVariantParams({
      [attributeName]: valueId,
    });
  };

  const handleQuantityChange = (change: number) => {
    setQuantity(prev => Math.max(1, prev + change));
  };

  const handleThumbnailClick = (index: number) => {
    // Scroll both carousels to the selected index
    carouselApi?.scrollTo(index);
    thumbnailApi?.scrollTo(index);
  };

  const handleAddToCart = () => {
    // Placeholder for add to cart functionality
  };

  return (
    <div className='grid md:grid-cols-2 gap-8 p-4'>
      {/* Product Images */}
      <div className='space-y-4'>
        {/* Main Image Carousel */}
        <div className='relative'>
          {isOnSale && (
            <Badge className='absolute top-4 right-4 z-10 bg-destructive text-destructive-foreground font-semibold'>
              SALE
            </Badge>
          )}
          <Carousel
            setApi={setCarouselApi}
            opts={{
              align: 'center',
              loop: true,
            }}
            className='w-full'
          >
            <CarouselContent>
              {images.length > 0 ? (
                images.map((image: string, index: number) => (
                  <CarouselItem key={index}>
                    <Card className='overflow-hidden aspect-square bg-muted border-border'>
                      <img
                        src={image}
                        alt={`${title} - ${index + 1}`}
                        className='w-full h-full object-cover'
                      />
                    </Card>
                  </CarouselItem>
                ))
              ) : (
                <CarouselItem>
                  <Card className='overflow-hidden aspect-square bg-muted'>
                    <div className='w-full h-full flex items-center justify-center text-muted-foreground'>
                      No image available
                    </div>
                  </Card>
                </CarouselItem>
              )}
            </CarouselContent>
            {images.length > 1 && (
              <>
                <CarouselPrevious className='left-4' />
                <CarouselNext className='right-4' />
              </>
            )}
          </Carousel>
        </div>

        {/* Thumbnail Grid or Carousel */}
        {images.length > 1 && (
          <>
            {images.length <= 4 ? (
              // Simple grid for 4 or fewer images
              <div className='grid grid-cols-4 gap-2'>
                {images.map((image: string, index: number) => (
                  <Button
                    key={index}
                    variant='outline'
                    className={`p-0 h-auto aspect-square overflow-hidden ${
                      currentImageIndex === index
                        ? 'ring-2 ring-primary ring-offset-2'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                    onClick={() => handleThumbnailClick(index)}
                  >
                    <img
                      src={image}
                      alt={`${title} - thumbnail ${index + 1}`}
                      className='w-full h-full object-cover'
                    />
                  </Button>
                ))}
              </div>
            ) : (
              // Carousel for more than 4 images
              <Carousel
                setApi={setThumbnailApi}
                opts={{
                  align: 'start',
                  slidesToScroll: 1,
                  containScroll: 'keepSnaps',
                }}
                className='w-full'
              >
                <CarouselContent className='-ml-2'>
                  {images.map((image: string, index: number) => (
                    <CarouselItem key={index} className='pl-2 basis-1/4'>
                      <div className='p-1'>
                        <Button
                          variant='outline'
                          className={`p-0 h-auto aspect-square overflow-hidden w-full ${
                            currentImageIndex === index
                              ? 'ring-2 ring-primary ring-offset-2'
                              : 'opacity-60 hover:opacity-100'
                          }`}
                          onClick={() => handleThumbnailClick(index)}
                        >
                          <img
                            src={image}
                            alt={`${title} - thumbnail ${index + 1}`}
                            className='w-full h-full object-cover'
                          />
                        </Button>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className='-left-4' />
                <CarouselNext className='-right-4' />
              </Carousel>
            )}
          </>
        )}
      </div>

      {/* Product Information */}
      <div className='space-y-6'>
        <div>
          <h1 className='text-3xl font-bold text-foreground mb-2'>{title}</h1>

          {/* Price */}
          <div className='flex items-baseline gap-3 mb-4'>
            <span className='text-2xl font-bold text-foreground'>
              {isPriceRange
                ? `${formatCurrency(priceMin)} - ${formatCurrency(priceMax)}`
                : formatCurrency(priceMin)}
            </span>
            {isOnSale && compareAtMin && (
              <span className='text-lg text-muted-foreground line-through'>
                {isCompareAtPriceRange
                  ? `${formatCurrency(compareAtMin)} - ${formatCurrency(compareAtMax!)}`
                  : formatCurrency(compareAtMin)}
              </span>
            )}
          </div>

          {/* Status Badge */}
          {product?.status && (
            <Badge variant='outline' className='mb-4'>
              {product.status}
            </Badge>
          )}
        </div>

        {/* Description */}
        <div className='border-t border-border pt-4'>
          {htmlDescription ? (
            <div
              className='text-muted-foreground prose prose-sm max-w-none'
              dangerouslySetInnerHTML={{ __html: htmlDescription }}
            />
          ) : (
            <p className='text-muted-foreground'>{description}</p>
          )}
        </div>

        {/* Product Attributes (Size, Color, etc.) */}
        <div className='space-y-4 border-t border-border pt-4'>
          {attributes.map(attribute => (
            <div key={attribute.id}>
              <label className='text-sm font-medium text-foreground mb-2 block'>
                {attribute.label}
              </label>
              <div className='flex flex-wrap gap-2'>
                {attribute.values.map(value => (
                  <Button
                    key={value.id}
                    variant={
                      selectedAttributes[attribute.name] === value.id
                        ? 'default'
                        : 'outline'
                    }
                    size='sm'
                    onClick={() =>
                      handleAttributeChange(attribute.name, value.id)
                    }
                    className='min-w-[60px]'
                  >
                    {value.name}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quantity Selector */}
        <div className='border-t border-border pt-4'>
          <label className='text-sm font-medium text-foreground mb-2 block'>
            Quantity
          </label>
          <div className='flex items-center gap-3'>
            <Button
              variant='outline'
              size='icon'
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
            >
              <Minus className='h-4 w-4' />
            </Button>
            <span className='text-lg font-medium min-w-[40px] text-center'>
              {quantity}
            </span>
            <Button
              variant='outline'
              size='icon'
              onClick={() => handleQuantityChange(1)}
            >
              <Plus className='h-4 w-4' />
            </Button>
          </div>
        </div>

        {/* Add to Cart Button */}
        <Button size='lg' className='w-full gap-2' onClick={handleAddToCart}>
          <ShoppingCart className='h-5 w-5' />
          Add to Cart
        </Button>

        {/* Additional Product Information */}
        <div className='border-t border-border pt-4 space-y-2'>
          {product?.type && (
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Product Type:</span>
              <span className='font-medium text-foreground'>
                {product.type}
              </span>
            </div>
          )}
          {product?.id && (
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Product ID:</span>
              <span className='font-mono text-xs text-foreground'>
                {product.id}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export type { ProductDetailsProps };
