import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useGoDaddyContext } from '@/godaddy-provider';
import { getCartOrderId, setCartOrderId } from '@/lib/cart-storage';
import {
  addCartLineItem,
  createCartOrder,
  getCartOrder,
  updateCartLineItem,
} from '@/lib/godaddy/godaddy';

/** Selling plan to attach to the line item (sent to backend via details.metafields). */
export type AddToCartSellingPlan = {
  planId: string;
  name?: string;
  category?: string;
  [key: string]: unknown;
};

export interface AddToCartInput {
  skuId: string;
  name: string;
  quantity: number;
  productAssetUrl?: string;
  /** Selling plan id (for display). */
  sellingPlanId?: string | null;
  /** Full selling plan; sent to backend in details.metafields and returned on line item. */
  sellingPlan?: AddToCartSellingPlan | null;
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

  // Update line item quantity (merge when same sku + same selling plan)
  const updateLineItemMutation = useMutation({
    mutationFn: ({
      orderId,
      lineItemId,
      newQuantity,
    }: {
      orderId: string;
      lineItemId: string;
      newQuantity: number;
    }) =>
      updateCartLineItem(
        { id: lineItemId, orderId, quantity: newQuantity },
        context.storeId!,
        context.clientId!,
        context?.apiHost
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-order'] });
      options?.onSuccess?.();
    },
    onError: error => {
      options?.onError?.(error as Error);
    },
  });

  // Add line item mutation. Sends selling plan in details.metafields when present.
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
          fulfillmentMode: 'NONE',
          status: 'DRAFT',
          details: {
            productAssetUrl: input.productAssetUrl || undefined,
          },
          ...(input.sellingPlan
            ? {
                metafields: [
                  {
                    key: 'SELLING_PLAN',
                    type: 'JSON',
                    value: JSON.stringify(input.sellingPlan),
                  },
                ],
              }
            : {}),
        },
        context.storeId!,
        context.clientId!,
        context?.apiHost
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-order'] });
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
      return;
    }
    let cartOrderId = getCartOrderId();

    // Create cart if it doesn't exist
    if (!cartOrderId) {
      const result = await createCartMutation.mutateAsync();
      cartOrderId = result.addDraftOrder?.id || null;

      if (!cartOrderId) {
        const error = new Error('Failed to create cart');
        options?.onError?.(error);
        return;
      }
    }

    // Fetch current cart to check for matching line (same sku + same selling plan = merge quantity)
    const order = await getCartOrder(
      cartOrderId,
      context.storeId!,
      context.clientId!,
      context?.apiHost
    ).then(data => data?.orderById);

    const inputPlanId = input.sellingPlan?.planId ?? null;
    const matchingItem = order?.lineItems?.find(item => {
      if (item.skuId !== input.skuId) return false;
      const meta = item.details?.metafields?.find(m => m?.key === 'SELLING_PLAN');
      let existingPlanId: string | null = null;
      if (meta?.value) {
        try {
          const parsed = JSON.parse(meta.value) as { planId?: string };
          existingPlanId = parsed?.planId ?? null;
        } catch {
          existingPlanId = null;
        }
      }
      return existingPlanId === inputPlanId;
    });

    if (matchingItem?.id && matchingItem.quantity != null) {
      await updateLineItemMutation.mutateAsync({
        orderId: cartOrderId,
        lineItemId: matchingItem.id,
        newQuantity: matchingItem.quantity + input.quantity,
      });
    } else {
      await addLineItemMutation.mutateAsync({
        orderId: cartOrderId,
        input,
      });
    }
  };

  return {
    addToCart,
    isLoading:
      createCartMutation.isPending ||
      addLineItemMutation.isPending ||
      updateLineItemMutation.isPending,
    isCreatingCart: createCartMutation.isPending,
    isAddingItem: addLineItemMutation.isPending || updateLineItemMutation.isPending,
  };
}
