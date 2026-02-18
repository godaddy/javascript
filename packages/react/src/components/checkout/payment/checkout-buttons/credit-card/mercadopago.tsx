import { useFormContext } from 'react-hook-form';
import { useMercadoPago } from '@/components/checkout/payment/utils/mercadopago-provider';
import { Button } from '@/components/ui/button';
import { useGoDaddyContext } from '@/godaddy-provider';

export function MercadoPagoCreditCardCheckoutButton() {
  const { t } = useGoDaddyContext();
  const { handleBrickSubmit, isLoading } = useMercadoPago();
  const form = useFormContext();

  const handleSubmit = async () => {
    // Validate form first
    const valid = await form.trigger();
    if (!valid) {
      const firstError = Object.keys(form.formState.errors)[0];
      if (firstError) {
        form.setFocus(firstError);
      }
      return;
    }

    // Trigger MercadoPago brick submission
    if (handleBrickSubmit) {
      try {
        await handleBrickSubmit();
      } catch (error) {
        console.error('MercadoPago submission error:', error);
      }
    }
  };

  return (
    <Button
      className='w-full'
      size='lg'
      type='button'
      onClick={handleSubmit}
      disabled={!handleBrickSubmit || isLoading}
    >
      {t.payment.payNow}
    </Button>
  );
}
