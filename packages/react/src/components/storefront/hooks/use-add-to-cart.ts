import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useGoDaddyContext } from '@/godaddy-provider';
import { getCartOrderId, setCartOrderId } from '@/lib/cart-storage';
import { addCartLineItem, createCartOrder } from '@/lib/godaddy/godaddy';

export interface AddToCartInput {
  skuId: string;
  name: string;
  quantity: number;
  productAssetUrl?: string;
}

export interface UseAddToCartOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useAddToCart(options?: UseAddToCartOptions) {
  const context = useGoDaddyContext();
  const queryClient = useQueryClient();

  // Create cart order mutation
  const createCartMutation = useMutation({
    mutationFn: () =>
      createCartOrder(
        {
          context: {
            storeId: context?.storeId || '',
            channelId: context?.channelId || '',
          },
          totals: {
            subTotal: { value: 0, currencyCode: 'USD' },
            shippingTotal: { value: 0, currencyCode: 'USD' },
            discountTotal: { value: 0, currencyCode: 'USD' },
            feeTotal: { value: 0, currencyCode: 'USD' },
            taxTotal: { value: 0, currencyCode: 'USD' },
            total: { value: 0, currencyCode: 'USD' },
          },
        },
        context.storeId!,
        context.clientId!,
        context?.apiHost
      ),
    onSuccess: data => {
      if (data.addDraftOrder?.id) {
        setCartOrderId(data.addDraftOrder.id);
      }
    },
  });

  // Add line item mutation
  const addLineItemMutation = useMutation({
    mutationFn: ({
      orderId,
      input,
    }: {
      orderId: string;
      input: AddToCartInput;
    }) =>
      addCartLineItem(
        {
          orderId,
          skuId: input.skuId,
          name: input.name,
          quantity: input.quantity,
          fulfillmentMode: 'SHIP',
          status: 'DRAFT',
          details: {
            productAssetUrl: input.productAssetUrl || undefined,
          },
        },
        context.storeId!,
        context.clientId!,
        context?.apiHost
      ),
    onSuccess: () => {
      // Invalidate cart query to refresh
      const cartOrderId = getCartOrderId();
      queryClient.invalidateQueries({ queryKey: ['cart-order', cartOrderId] });

      // Call success callback
      options?.onSuccess?.();
    },
    onError: error => {
      // Call error callback
      options?.onError?.(error as Error);
    },
  });

  const addToCart = async (input: AddToCartInput) => {
    if (!context.storeId || !context.clientId) {
      const error = new Error('Store ID and Client ID are required');
      options?.onError?.(error);
      throw error;
    }
    let cartOrderId = getCartOrderId();

    // Create cart if it doesn't exist
    if (!cartOrderId) {
      const result = await createCartMutation.mutateAsync();
      cartOrderId = result.addDraftOrder?.id || null;

      if (!cartOrderId) {
        const error = new Error('Failed to create cart');
        options?.onError?.(error);
        throw error;
      }
    }

    // Add line item to cart
    await addLineItemMutation.mutateAsync({ orderId: cartOrderId, input });
  };

  return {
    addToCart,
    isLoading: createCartMutation.isPending || addLineItemMutation.isPending,
    isCreatingCart: createCartMutation.isPending,
    isAddingItem: addLineItemMutation.isPending,
  };
}
