import { useMutation } from '@tanstack/react-query';
import { useFormContext } from 'react-hook-form';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useFlushCheckoutSync } from '@/components/checkout/payment/utils/use-flush-checkout-sync';
import { useGoDaddyContext } from '@/godaddy-provider';
import { authorizeCheckoutSession } from '@/lib/godaddy/godaddy';
import type { AuthorizeCheckoutSessionInput } from '@/types';

export function useAuthorizeCheckout() {
  const { session, jwt } = useCheckoutContext();
  const { apiHost } = useGoDaddyContext();
  const form = useFormContext();
  const flushCheckoutSync = useFlushCheckoutSync();

  return useMutation({
    mutationFn: async (input: AuthorizeCheckoutSessionInput['input']) => {
      await flushCheckoutSync();

      // Authorize for the same amount confirmCheckout later captures. Prefer an
      // explicit tip from the caller so a provider that has already committed to
      // an amount (MercadoPago builds its brick up front) authorizes that exact
      // amount; otherwise read the tip after the sync flush, once pending form
      // state has settled.
      const payload = {
        ...input,
        tipAmount: session?.enableTips
          ? (input.tipAmount ?? form?.getValues('tipAmount') ?? 0)
          : undefined,
      };

      const result = jwt
        ? await authorizeCheckoutSession(payload, { accessToken: jwt }, apiHost)
        : await authorizeCheckoutSession(payload, session, apiHost);

      return result.authorizeCheckoutSession;
    },
  });
}
