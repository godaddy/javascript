'use client';

import { useQuery } from '@tanstack/react-query';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { useQueryStates } from 'nuqs';
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
import { getSku, getSkuGroups } from '@/lib/godaddy/godaddy';
import { formatCurrency } from '@/lib/utils';
import type { SKUGroupAttribute, SKUGroupAttributeValue } from '@/types';

interface ProductDetailsProps {
  sku: string;
  storeId?: string;
  clientId?: string;
}

// Flattened attribute structure for UI (transforms edges/node to flat array)
type Attribute = Pick<SKUGroupAttribute, 'id' | 'name' | 'label'> & {
  values: SKUGroupAttributeValue[];
};

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

  // Initial query to get product data and attributes
  const { data, isLoading, error } = useQuery({
    queryKey: ['sku-group', storeId, clientId, sku],
    queryFn: () =>
      getSkuGroups({ id: { eq: sku } }, storeId!, clientId!, context?.apiHost),
    enabled: !!storeId && !!clientId && !!sku,
  });

  // Get product attributes from the query response
  const attributesEdges =
    data?.skuGroups?.edges?.[0]?.node?.attributes?.edges || [];
  const attributes: Attribute[] = attributesEdges.map((edge: any) => {
    const attributeNode = edge?.node;
    const valuesEdges = attributeNode?.values?.edges || [];

    return {
      id: attributeNode?.id || '',
      name: attributeNode?.name || '',
      label: attributeNode?.label || attributeNode?.name || '',
      values: valuesEdges.map((valueEdge: any) => {
        const valueNode = valueEdge?.node;
        return {
          id: valueNode?.id || '',
          name: valueNode?.name || '',
          label: valueNode?.label || valueNode?.name || '',
        };
      }),
    };
  });

  // Create dynamic query state parsers based on product attributes
  const queryStateParsers = useMemo(() => {
    const parsers: Record<string, any> = {};
    attributes.forEach(attr => {
      parsers[attr.name] = {
        parse: (value: string) => value || '',
        defaultValue: '',
      };
    });
    return parsers;
  }, [attributes.map(a => a.name).join(',')]);

  // Track variant attributes in URL query params
  const [variantParams, setVariantParams] = useQueryStates(queryStateParsers, {
    history: 'push',
    shallow: true,
  });

  // Convert query params to selected attributes
  const selectedAttributes = useMemo(() => {
    const attrs: Record<string, string> = {};
    Object.entries(variantParams).forEach(([key, value]) => {
      if (value) attrs[key] = value;
    });
    return attrs;
  }, [variantParams]);

  // Convert selected attributes to array for query
  const selectedAttributeValues = useMemo(() => {
    return Object.values(selectedAttributes).filter(Boolean);
  }, [selectedAttributes]);

  // Query for filtered SKUs when attributes are selected
  const { data: skuData, isLoading: isFilteredSkuLoading } = useQuery({
    queryKey: [
      'sku-group-filtered',
      storeId,
      clientId,
      sku,
      selectedAttributeValues,
    ],
    queryFn: () =>
      getSkuGroups(
        {
          id: { eq: sku },
          attributeValues: selectedAttributeValues,
        },
        storeId!,
        clientId!,
        context?.apiHost
      ),
    enabled:
      !!storeId && !!clientId && !!sku && selectedAttributeValues.length > 0,
  });

  // Get the matched SKUs based on selected attributes
  const matchedSkus = skuData?.skuGroups?.edges?.[0]?.node?.skus?.edges || [];
  const matchedSkuId =
    matchedSkus.length === 1 ? matchedSkus[0]?.node?.id : null;

  // Query individual SKU details when exactly one SKU matches
  const { data: individualSkuData, isLoading: isSkuLoading } = useQuery({
    queryKey: ['individual-sku', storeId, clientId, matchedSkuId],
    queryFn: () =>
      getSku({ id: matchedSkuId! }, storeId!, clientId!, context?.apiHost),
    enabled: !!storeId && !!clientId && !!matchedSkuId,
  });

  // Use individual SKU data if available, otherwise use SKU Group data
  const selectedSku = individualSkuData?.sku;

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

  const product = data?.skuGroups?.edges?.[0]?.node;

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

  // Use SKU-specific pricing if available, otherwise fall back to SKU Group pricing
  const skuPrice = selectedSku?.prices?.edges?.[0]?.node;
  const priceMin = skuPrice?.value?.value ?? product?.priceRange?.min ?? 0;
  const priceMax = selectedSku
    ? priceMin
    : (product?.priceRange?.max ?? priceMin);
  const compareAtMin =
    skuPrice?.compareAtValue?.value ?? product?.compareAtPriceRange?.min;
  const compareAtMax = selectedSku
    ? compareAtMin
    : product?.compareAtPriceRange?.max;
  const isOnSale = compareAtMin && compareAtMin > priceMin;
  const isPriceRange = priceMin !== priceMax;
  const isCompareAtPriceRange =
    compareAtMin && compareAtMax && compareAtMin !== compareAtMax;

  // Get all media objects (images) - prefer SKU-specific images if available
  const skuMediaObjects = selectedSku?.mediaObjects?.edges || [];
  const productMediaObjects = product?.mediaObjects?.edges || [];
  const mediaObjects =
    skuMediaObjects.length > 0 ? skuMediaObjects : productMediaObjects;

  const images = mediaObjects
    .filter((edge: any) => edge?.node?.type === 'IMAGE')
    .map((edge: any) => edge?.node?.url)
    .filter(Boolean);

  // const images = [...imagesSrc, ...imagesSrc, ...imagesSrc];

  const handleAttributeChange = (attributeName: string, valueName: string) => {
    // Update the URL query params with the new attribute value (using name instead of ID)
    void setVariantParams({
      [attributeName]: valueName,
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

  // Check if product is available for purchase
  const isOutOfStock = selectedSku
    ? (() => {
        const availableCount =
          selectedSku.inventoryCounts?.edges?.find(
            edge => edge?.node?.type === 'AVAILABLE'
          )?.node?.quantity ?? 0;
        return availableCount === 0;
      })()
    : false;

  const canAddToCart = !isOutOfStock && (!attributes.length || selectedSku);

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
        </div>

        {/* Description */}
        {htmlDescription || description ? (
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
        ) : null}

        {/* Product Attributes (Size, Color, etc.) */}
        {attributes.length > 0 && (
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
                        selectedAttributes[attribute.name] === value.name
                          ? 'default'
                          : 'outline'
                      }
                      size='sm'
                      onClick={() =>
                        handleAttributeChange(attribute.name, value.name)
                      }
                      className='min-w-[60px]'
                    >
                      {value.label}
                    </Button>
                  ))}
                </div>
              </div>
            ))}

            {/* SKU Match Status */}
            {selectedAttributeValues.length > 0 && (
              <div className='text-sm'>
                {isSkuLoading && (
                  <div className='flex items-center gap-2 text-muted-foreground'>
                    <div className='h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent' />
                    Loading variant details...
                  </div>
                )}
                {!isSkuLoading &&
                  !isFilteredSkuLoading &&
                  matchedSkus.length === 0 && (
                    <div className='text-destructive'>
                      This combination is not available. Please select different
                      options.
                    </div>
                  )}
                {!isSkuLoading && matchedSkus.length > 1 && (
                  <div className='text-muted-foreground'>
                    {matchedSkus.length} variants match your selection. Select
                    more attributes to narrow down.
                  </div>
                )}
                {!isSkuLoading && matchedSkus.length === 1 && selectedSku && (
                  <div className='text-green-600 dark:text-green-400 font-medium'>
                    ✓ Variant selected
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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
        <Button
          size='lg'
          className='w-full gap-2'
          onClick={handleAddToCart}
          disabled={!canAddToCart}
        >
          <ShoppingCart className='h-5 w-5' />
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
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
          {selectedSku && (
            <>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Selected SKU:</span>
                <span className='font-mono text-xs text-foreground'>
                  {selectedSku.code}
                </span>
              </div>
              {selectedSku.inventoryCounts?.edges &&
                selectedSku.inventoryCounts.edges.length > 0 && (
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Stock Status:</span>
                    <span className='font-medium text-foreground'>
                      {(() => {
                        const availableCount =
                          selectedSku.inventoryCounts.edges.find(
                            edge => edge?.node?.type === 'AVAILABLE'
                          )?.node?.quantity ?? 0;
                        if (availableCount === 0) return 'Out of Stock';
                        if (availableCount < 10)
                          return `Low Stock (${availableCount})`;
                        return 'In Stock';
                      })()}
                    </span>
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export type { ProductDetailsProps };
