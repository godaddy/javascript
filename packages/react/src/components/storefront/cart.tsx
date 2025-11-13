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
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useGoDaddyContext } from '@/godaddy-provider';
import { getCartOrderId } from '@/lib/cart-storage';
import { deleteCartLineItem, getCartOrder } from '@/lib/godaddy/godaddy';

interface CartProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Cart({ open, onOpenChange }: CartProps) {
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
  const _deleteMutation = useMutation({
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

  const order = cartData?.orderById;

  // Transform cart line items to Product format for CartLineItems component
  const items: Product[] =
    order?.lineItems?.map(item => ({
      id: item.id,
      name: item.name || 'Product',
      image: item.details?.productAssetUrl || '',
      quantity: item.quantity || 0,
      originalPrice:
        (item.totals?.subTotal?.value || 0) / 100 / (item.quantity || 1),
      price: (item.totals?.subTotal?.value || 0) / 100 / (item.quantity || 1),
      notes: item.notes?.map(note => note.content || '') || [],
    })) || [];

  // Calculate totals
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const currencyCode = order?.totals?.total?.currencyCode || 'USD';
  const subtotal = (order?.totals?.subTotal?.value || 0) / 100;
  const shipping = (order?.totals?.shippingTotal?.value || 0) / 100;
  const taxes = (order?.totals?.taxTotal?.value || 0) / 100;
  const discount = (order?.totals?.discountTotal?.value || 0) / 100;
  const total = (order?.totals?.total?.value || 0) / 100;

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
          <SheetTitle>Shopping Cart</SheetTitle>
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
                Failed to load cart: {(error as Error).message}
              </p>
              <Button
                variant='outline'
                onClick={() =>
                  queryClient.invalidateQueries({
                    queryKey: ['cart-order', cartOrderId],
                  })
                }
              >
                Retry
              </Button>
            </div>
          )}

          {!isLoading && !error && (!cartOrderId || items.length === 0) && (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <ShoppingCart className='h-16 w-16 text-muted-foreground mb-4' />
              <p className='text-lg font-medium text-foreground mb-1'>
                Your cart is empty
              </p>
              <p className='text-sm text-muted-foreground'>
                Add items to get started
              </p>
            </div>
          )}

          {!isLoading && !error && cartOrderId && items.length > 0 && (
            <>
              <CartLineItems items={items} currencyCode={currencyCode} />
              <CartTotals {...totals} />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
