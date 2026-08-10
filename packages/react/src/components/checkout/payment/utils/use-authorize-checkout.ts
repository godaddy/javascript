import { useMutation } from '@tanstack/react-query';
import { useFormContext } from 'react-hook-form';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useFlushCheckoutSync } from '@/components/checkout/payment/utils/use-flush-checkout-sync';
import { applyTipFieldError } from '@/components/checkout/tips/utils/tip-field-errors';
import { useGoDaddyContext } from '@/godaddy-provider';
import { authorizeCheckoutSession } from '@/lib/godaddy/godaddy';
import type { AuthorizeCheckoutSessionInput } from '@/types';

export function useAuthorizeCheckout() {
  const { session, jwt } = useCheckoutContext();
  const { apiHost, t } = useGoDaddyContext();
  const form = useFormContext();
  const flushCheckoutSync = useFlushCheckoutSync();

  return useMutation({
    mutationFn: async (input: AuthorizeCheckoutSessionInput['input']) => {
      await flushCheckoutSync();

      // The form is the single source of truth for the tip, deliberately
      // overriding any `tipAmount` the caller passed: the authorized amount must
      // match what confirmCheckout later captures, so it cannot drift to a value
      // a provider captured earlier. Read after the sync flush, once pending
      // form state has settled.
      const payload = {
        ...input,
        tipAmount: session?.enableTips
          ? (form?.getValues('tipAmount') ?? 0)
          : undefined,
      };

      const result = jwt
        ? await authorizeCheckoutSession(payload, { accessToken: jwt }, apiHost)
        : await authorizeCheckoutSession(payload, session, apiHost);

      return result.authorizeCheckoutSession;
    },
    onError: (error: unknown) => {
      applyTipFieldError(
        form,
        error,
        code => t.apiErrors?.[code as keyof typeof t.apiErrors]
      );
    },
  });
}
