import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useUpdateTaxes } from '@/components/checkout/order/use-update-taxes';
import { useCheckoutApi } from '@/hooks/use-checkout-api';
import type { ApplyCheckoutSessionFulfillmentLocationInput } from '@/types';

export function useApplyFulfillmentLocation() {
  const { session } = useCheckoutContext();
  const api = useCheckoutApi(session);
  const updateTaxes = useUpdateTaxes();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['apply-fulfillment-location', { sessionId: session?.id }],
    mutationFn: async ({
      fulfillmentLocationId,
    }: {
      fulfillmentLocationId: ApplyCheckoutSessionFulfillmentLocationInput['input']['fulfillmentLocationId'];
      locationAddress?: {
        addressLine1?: string | null;
        addressLine2?: string | null;
        addressLine3?: string | null;
        adminArea1?: string | null;
        adminArea2?: string | null;
        adminArea3?: string | null;
        countryCode?: string | null;
        postalCode?: string | null;
      };
    }) => {
      if (!fulfillmentLocationId) return;

      return await api.applyFulfillmentLocation({ fulfillmentLocationId });
    },
    onSuccess: (_data, { locationAddress }) => {
      if (!session) return;

      if (session?.enableTaxCollection && locationAddress) {
        updateTaxes.mutate(locationAddress);
      } else {
        queryClient.invalidateQueries({
          queryKey: ['draft-order', { id: session?.id }],
        });
      }
    },
    onError: (_error, { locationAddress }) => {
      // Graceful degradation: still calculate taxes with pickup location address
      // even if fulfillment location API fails
      if (session?.enableTaxCollection && locationAddress) {
        updateTaxes.mutate(locationAddress);
      }
    },
  });
}
