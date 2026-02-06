import { useCheckoutContext } from '@/components/checkout/checkout';
import { useMercadoPago } from '@/components/checkout/payment/utils/mercadopago-provider';

export function MercadoPagoCreditCardCheckoutButton() {
  const { isLoading } = useMercadoPago();
  const { isConfirmingCheckout } = useCheckoutContext();

  // MercadoPago Brick renders its own submit button
  // We return null as the brick handles the submission internally
  return null;
}
