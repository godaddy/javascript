'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, ShoppingCart } from 'lucide-react';
import type { Product } from '@/components/checkout/line-items/line-items';
import { CartLineItems } from '@/components/storefront/cart-line-items';
import { CartTotals } from '@/components/storefront/cart-totals';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useGoDaddyContext } from '@/godaddy-provider';
import { getCartOrderId } from '@/lib/cart-storage';
import { deleteCartLineItem, getCartOrder } from '@/lib/godaddy/godaddy';

interface CartProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckout?: (orderId: string) => void;
  isCheckingOut?: boolean;
}

export function Cart({
  open,
  onOpenChange,
  onCheckout,
  isCheckingOut = false,
}: CartProps) {
  const context = useGoDaddyContext();
  const queryClient = useQueryClient();
  const cartOrderId = getCartOrderId();

  // Fetch cart order
  const {
    data: cartData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['cart-order', cartOrderId],
    queryFn: () =>
      getCartOrder(
        cartOrderId!,
        context.storeId!,
        context.clientId!,
        context?.apiHost
      ),
    enabled: !!cartOrderId && !!context.storeId && !!context.clientId,
  });

  // Delete line item mutation
  const deleteMutation = useMutation({
    mutationFn: (lineItemId: string) =>
      deleteCartLineItem(
        { id: lineItemId, orderId: cartOrderId! },
        context.storeId!,
        context.clientId!,
        context?.apiHost
      ),
    onSuccess: () => {
      // Invalidate cart query to refetch
      queryClient.invalidateQueries({ queryKey: ['cart-order', cartOrderId] });
    },
  });

  const handleRemoveFromCart = (itemId: string) => {
    deleteMutation.mutate(itemId);
  };

  const order = cartData?.orderById;

  const { t } = useGoDaddyContext();

  // Transform cart line items to Product format for CartLineItems component
  const items: Product[] =
    order?.lineItems?.map(item => ({
      id: item.id,
      name: item.name || t.storefront.product,
      image: item.details?.productAssetUrl || '',
      quantity: item.quantity || 0,
      originalPrice: (item.totals?.subTotal?.value || 0) / (item.quantity || 1),
      price: (item.totals?.subTotal?.value || 0) / (item.quantity || 1),
      selectedOptions:
        item?.details?.selectedOptions?.map(option => ({
          attribute: option.attribute || '',
          values: option.values || [],
        })) || [],
      addons: item.details?.selectedAddons?.map(addon => ({
        attribute: addon.attribute || '',
        sku: addon.sku || '',
        values: addon.values?.map(value => ({
          costAdjustment: value.costAdjustment
            ? {
                currencyCode: value.costAdjustment.currencyCode ?? undefined,
                value: value.costAdjustment.value ?? undefined,
              }
            : undefined,
          name: value.name ?? undefined,
        })),
      })),
    })) || [];

  // Calculate totals
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const currencyCode = order?.totals?.total?.currencyCode || 'USD';
  const subtotal = order?.totals?.subTotal?.value || 0;
  const shipping = order?.totals?.shippingTotal?.value || 0;
  const taxes = order?.totals?.taxTotal?.value || 0;
  const discount = order?.totals?.discountTotal?.value || 0;
  const total = order?.totals?.total?.value || 0;

  const totals = {
    subtotal,
    discount,
    shipping,
    currencyCode,
    itemCount,
    total,
    tip: 0,
    taxes,
    enableDiscounts: false,
    enableTaxes: true,
    isTaxLoading: false,
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full sm:max-w-lg overflow-y-auto'>
        <SheetHeader>
          <SheetTitle>{t.storefront.shoppingCart}</SheetTitle>
        </SheetHeader>
        <div className='mt-8 space-y-6'>
          {isLoading && (
            <div className='flex items-center justify-center py-12'>
              <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
            </div>
          )}

          {!isLoading && error && (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <p className='text-destructive mb-2'>
                {t.storefront.failedToLoadCart} {(error as Error).message}
              </p>
              <Button
                variant='outline'
                onClick={() =>
                  queryClient.invalidateQueries({
                    queryKey: ['cart-order', cartOrderId],
                  })
                }
              >
                {t.storefront.retry}
              </Button>
            </div>
          )}

          {!isLoading && !error && (!cartOrderId || items.length === 0) && (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <ShoppingCart className='h-16 w-16 text-muted-foreground mb-4' />
              <p className='text-lg font-medium text-foreground mb-1'>
                {t.storefront.yourCartIsEmpty}
              </p>
              <p className='text-sm text-muted-foreground'>
                {t.storefront.addItemsToGetStarted}
              </p>
            </div>
          )}

          {!isLoading && !error && cartOrderId && items.length > 0 && (
            <>
              <CartLineItems
                items={items}
                currencyCode={currencyCode}
                inputInMinorUnits
                onRemoveFromCart={handleRemoveFromCart}
                isRemovingFromCart={deleteMutation.isPending}
                removingItemId={deleteMutation.variables}
              />
              <CartTotals
                {...totals}
                inputInMinorUnits
                enableTaxes={false}
                enableShipping={false}
              />
              {onCheckout ? (
                <SheetFooter>
                  <Button
                    className='w-full'
                    size='lg'
                    onClick={() => onCheckout(cartOrderId)}
                    disabled={isCheckingOut}
                  >
                    {isCheckingOut ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      t.storefront.checkout
                    )}
                  </Button>
                </SheetFooter>
              ) : null}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
