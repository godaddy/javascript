import { useMutation } from '@tanstack/react-query';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { applyDeliveryMethod } from '@/lib/godaddy/godaddy';
import type { ApplyCheckoutSessionDeliveryMethodInput } from '@/types';

export function useApplyDeliveryMethod() {
  const { session } = useCheckoutContext();

  return useMutation({
    mutationKey: ['apply-delivery-method', { sessionId: session?.id }],
    mutationFn: async (
      mode: ApplyCheckoutSessionDeliveryMethodInput['input']['mode']
    ) => {
      if (!session) return;
      return await applyDeliveryMethod({ mode }, session);
    },
  });
}
