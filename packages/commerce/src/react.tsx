import type { ReactNode } from 'react';
import { createElement, useEffect, useSyncExternalStore } from 'react';
import { type CommerceClient, getCommerce } from './index';
import './elements';

/** Configure in the browser entry point, or pass an isolated client for SSR. */
export function useCart(client: CommerceClient = getCommerce()) {
  const snapshot = useSyncExternalStore(
    client.subscribe,
    client.getSnapshot,
    client.getServerSnapshot
  );
  useEffect(() => {
    void client.ready().catch(() => {
      /* Exposed through snapshot.error. */
    });
  }, [client]);
  return {
    ...snapshot,
    addItem: client.addItem.bind(client),
    setQuantity: client.setQuantity.bind(client),
    removeItem: client.removeItem.bind(client),
    checkout: client.checkout.bind(client),
  };
}

type ButtonProps = {
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
};
type SkuButtonProps = ButtonProps & { skuId: string; quantity?: number };
export function AddToCartButton({ skuId, quantity, ...props }: SkuButtonProps) {
  return createElement('gddy-add-to-cart', {
    'sku-id': skuId,
    quantity,
    ...props,
  });
}
export function CartButton(props: ButtonProps) {
  return createElement('gddy-cart-button', props);
}
export function BuyNowButton({ skuId, quantity, ...props }: SkuButtonProps) {
  return createElement('gddy-buy-now', { 'sku-id': skuId, quantity, ...props });
}
export function PaymentButton(props: ButtonProps & { reference: string }) {
  return createElement('gddy-payment-button', props);
}
