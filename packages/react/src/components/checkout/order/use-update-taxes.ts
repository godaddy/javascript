import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCheckoutContext } from '@/components/checkout/checkout';
import type { ResultOf } from '@/gql.tada';
import { useCheckoutApi } from '@/hooks/use-checkout-api';
import type { DraftOrderQuery } from '@/lib/godaddy/queries';

export function useUpdateTaxes() {
  const { session } = useCheckoutContext();
  const api = useCheckoutApi(session);
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['update-draft-order-taxes', { id: session?.id }],
    mutationFn: async (destination?: {
      addressLine1?: string | null;
      addressLine2?: string | null;
      addressLine3?: string | null;
      adminArea1?: string | null;
      adminArea2?: string | null;
      adminArea3?: string | null;
      countryCode?: string | null;
      postalCode?: string | null;
    }) => {
      return await api.getDraftOrderTaxes(destination);
    },
    onSuccess: data => {
      if (!session) return;

      // Extract taxesTotal from mutation response
      const taxesTotal =
        data?.checkoutSession?.draftOrder?.calculatedTaxes?.totalTaxAmount;

      // Update the cached draft-order query (includes totals)
      if (taxesTotal) {
        queryClient.setQueryData(
          ['draft-order', { id: session.id }],
          (old: ResultOf<typeof DraftOrderQuery> | undefined) => {
            if (!old) return old;
            return {
              ...old,
              checkoutSession: {
                ...old.checkoutSession,
                draftOrder: {
                  ...old?.checkoutSession?.draftOrder,
                  totals: {
                    ...old?.checkoutSession?.draftOrder?.totals,
                    taxesTotal: {
                      ...taxesTotal,
                    },
                  },
                },
              },
            };
          }
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['draft-order', { id: session?.id }],
      });
    },
  });
}
