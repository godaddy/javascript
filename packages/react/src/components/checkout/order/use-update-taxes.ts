import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCheckoutContext } from '@/components/checkout/checkout';
import {
  checkoutMutationKeys,
  checkoutQueryKeys,
} from '@/components/checkout/utils/query-keys';
import { useGoDaddyContext } from '@/godaddy-provider';
import { updateDraftOrderTaxes } from '@/lib/godaddy/godaddy';

export function useUpdateTaxes() {
  const { session, jwt } = useCheckoutContext();
  const { apiHost } = useGoDaddyContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: checkoutMutationKeys.updateDraftOrderTaxes(session?.id),
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
      const data = jwt
        ? await updateDraftOrderTaxes(
            { accessToken: jwt },
            destination,
            apiHost
          )
        : await updateDraftOrderTaxes(session, destination, apiHost);
      return data;
    },
    onSettled: () => {
      if (!session) return;
      // Keep the mutation pending until totals and tax constituents refresh together.
      return queryClient.invalidateQueries({
        queryKey: checkoutQueryKeys.draftOrder(session.id),
      });
    },
  });
}
