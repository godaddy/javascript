import { useQueryClient } from '@tanstack/react-query';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { checkoutQueryKeys } from '@/components/checkout/utils/query-keys';
import { useGoDaddyContext } from '@/godaddy-provider';
import { getCheckoutOrderStatus } from '@/lib/godaddy/godaddy';
import { getPaymentActionRequiredResult } from '@/lib/graphql-with-errors';

// A failed confirmation response does not prove that payment failed. Refresh
// the authoritative order status before callers unlock checkout and offer another
// try; a completed order then redirects through usePaidOrderRedirect.
export function useConfirmCheckoutRecovery() {
  const queryClient = useQueryClient();
  const { session, jwt } = useCheckoutContext();
  const { apiHost } = useGoDaddyContext();

  return async function confirmWithRecovery<T>(
    confirm: () => Promise<T>
  ): Promise<T> {
    try {
      return await confirm();
    } catch (error) {
      if (session?.id && !getPaymentActionRequiredResult(error)) {
        try {
          const queryKey = checkoutQueryKeys.orderStatus(session.id);
          // Discard reads started before confirmation; they may still say unpaid.
          await queryClient.cancelQueries({ queryKey, exact: true });
          await queryClient.fetchQuery({
            queryKey,
            queryFn: () =>
              jwt
                ? getCheckoutOrderStatus({ accessToken: jwt }, apiHost)
                : getCheckoutOrderStatus(session, apiHost),
            staleTime: 0,
            retry: false,
          });
        } catch {
          // Keep the original payment error if the status lookup also fails.
        }
      }
      throw error;
    }
  };
}
