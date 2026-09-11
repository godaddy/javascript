import type { ReactNode } from 'react';
import { createElement, useEffect, useMemo, useSyncExternalStore } from 'react';
import { type CommerceClient, getCommerce } from './index';
import './elements';

/**
 * Configure in the browser entry point, or pass an isolated client for SSR.
 * Returns the current snapshot plus stable actions; `checkout` is the open
 * session, `startCheckout` creates one.
 */
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
  const actions = useMemo(
    () => ({
      addItem: (skuId: string, count?: number) => client.addItem(skuId, count),
      setQuantity: (lineId: string, count: number) =>
        client.setQuantity(lineId, count),
      removeItem: (lineId: string) => client.removeItem(lineId),
      applyDiscount: (code: string) => client.applyDiscount(code),
      startCheckout: () => client.checkout(),
      buyNow: (skuId: string, count?: number) => client.buyNow(skuId, count),
      pay: (reference: string) => client.pay(reference),
      refresh: () => client.refresh(),
      closeCheckout: () => client.closeCheckout(),
    }),
    [client]
  );
  return { ...snapshot, ...actions, client };
}

type ButtonProps = {
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
};
type SkuButtonProps = ButtonProps & { skuId: string; quantity?: number };

/**
 * Custom elements receive attributes, not properties. React 18 stringifies
 * booleans (`disabled="false"`) and does not map `className`, so translate here.
 */
function attributes({
  className,
  disabled,
  ...rest
}: ButtonProps & Record<string, unknown>) {
  return { ...rest, class: className, disabled: disabled ? '' : undefined };
}

export function AddToCartButton({ skuId, quantity, ...props }: SkuButtonProps) {
  return createElement(
    'gddy-add-to-cart',
    attributes({ 'sku-id': skuId, quantity, ...props })
  );
}
export function CartButton(props: ButtonProps) {
  return createElement('gddy-cart-button', attributes(props));
}
export function BuyNowButton({ skuId, quantity, ...props }: SkuButtonProps) {
  return createElement(
    'gddy-buy-now',
    attributes({ 'sku-id': skuId, quantity, ...props })
  );
}
export function PaymentButton(props: ButtonProps & { reference: string }) {
  return createElement('gddy-payment-button', attributes(props));
}
