import { useIsCheckoutBusy } from '@/components/checkout/utils/use-is-checkout-busy';

export function useIsPaymentDisabled(): boolean {
  return useIsCheckoutBusy();
}
