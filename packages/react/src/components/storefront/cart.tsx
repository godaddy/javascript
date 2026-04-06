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
  // Read cart order ID fresh on every render
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

  // Transform cart line items to Product format for CartLineItems component.
  // Selling plan JSON lives on line metafields (SELLING_PLAN); use its checkout price for display
  // when present so the cart matches PDP, which may differ from draft line totals.subTotal.
  const items: Product[] =
    order?.lineItems?.map(item => {
      const rawPlan = item.metafields?.find(m => m?.key === 'SELLING_PLAN')?.value;
      let sellingPlan: { name?: string; category?: string } | null = null;
      let checkoutPriceMinor: number | undefined;
      if (rawPlan) {
        try {
          const parsed = JSON.parse(rawPlan) as {
            name?: string;
            category?: string;
            catalogPrices?: Array<{
              skuId?: string;
              checkoutPrices?: Array<{ value?: number }>;
            }>;
            checkoutPrice?: { value?: number };
          };
          sellingPlan = { name: parsed.name, category: parsed.category };
          const skuId = item.skuId;
          const forSku = skuId
            ? parsed.catalogPrices?.find(c => c.skuId === skuId)
            : undefined;
          const cpFromCatalog = forSku?.checkoutPrices?.[0]?.value;
          checkoutPriceMinor =
            cpFromCatalog != null
              ? Number(cpFromCatalog)
              : parsed.checkoutPrice?.value != null
                ? Number(parsed.checkoutPrice.value)
                : undefined;
        } catch {
          sellingPlan = null;
        }
      }
      const qty = item.quantity || 1;
      const apiUnit =
        qty > 0 ? (item.totals?.subTotal?.value || 0) / qty : 0;
      const unitPrice = checkoutPriceMinor != null ? checkoutPriceMinor : apiUnit;
      return {
        id: item.id,
        name: item.name || t.storefront.product,
        image: item.details?.productAssetUrl || '',
        quantity: item.quantity || 0,
        originalPrice: unitPrice,
        price: unitPrice,
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
        sellingPlan:
          sellingPlan?.name != null || sellingPlan?.category != null
            ? { name: sellingPlan.name, category: sellingPlan.category }
            : undefined,
      };
    }) || [];

  // Calculate totals: subtotal matches sum of displayed line amounts (selling-plan metafield prices when set).
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const currencyCode = order?.totals?.total?.currencyCode || 'USD';
  const apiSubtotal = order?.totals?.subTotal?.value || 0;
  const lineSubtotalSum = items.reduce(
    (sum, item) => sum + item.originalPrice * (item.quantity || 0),
    0
  );
  const subtotal = lineSubtotalSum;
  const shipping = order?.totals?.shippingTotal?.value || 0;
  const taxes = order?.totals?.taxTotal?.value || 0;
  const discount = order?.totals?.discountTotal?.value || 0;
  const apiTotal = order?.totals?.total?.value || 0;
  const total = apiTotal + (lineSubtotalSum - apiSubtotal);

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
                {t.storefront.failedToLoadCart}{' '}
                {error instanceof Error ? error.message : String(error)}
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
