import { useMutation } from '@tanstack/react-query';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useCheckoutApi } from '@/hooks/use-checkout-api';
import type { ApplyCheckoutSessionDeliveryMethodInput } from '@/types';

export function useApplyDeliveryMethod() {
  const { session } = useCheckoutContext();
  const api = useCheckoutApi(session);

  return useMutation({
    mutationKey: ['apply-delivery-method', { sessionId: session?.id }],
    mutationFn: async (
      mode: ApplyCheckoutSessionDeliveryMethodInput['input']['mode']
    ) => {
      return await api.applyDeliveryMethod({ mode });
    },
  });
}
