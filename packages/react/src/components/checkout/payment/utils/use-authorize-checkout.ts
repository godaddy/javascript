import { useMutation } from '@tanstack/react-query';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useFlushCheckoutSync } from '@/components/checkout/payment/utils/use-flush-checkout-sync';
import { useGoDaddyContext } from '@/godaddy-provider';
import { authorizeCheckoutSession } from '@/lib/godaddy/godaddy';
import type { AuthorizeCheckoutSessionInput } from '@/types';

export function useAuthorizeCheckout() {
  const { session, jwt } = useCheckoutContext();
  const { apiHost } = useGoDaddyContext();
  const flushCheckoutSync = useFlushCheckoutSync();

  return useMutation({
    mutationFn: async (input: AuthorizeCheckoutSessionInput['input']) => {
      await flushCheckoutSync();

      const result = jwt
        ? await authorizeCheckoutSession(input, { accessToken: jwt }, apiHost)
        : await authorizeCheckoutSession(input, session, apiHost);

      return result.authorizeCheckoutSession;
    },
  });
}
