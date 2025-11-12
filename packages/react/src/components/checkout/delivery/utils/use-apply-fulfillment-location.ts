import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useUpdateTaxes } from '@/components/checkout/order/use-update-taxes';
import { useGoDaddyContext } from '@/godaddy-provider';
import { applyFulfillmentLocation } from '@/lib/godaddy/godaddy';
import type { ApplyCheckoutSessionFulfillmentLocationInput } from '@/types';

export function useApplyFulfillmentLocation() {
  const { session, jwt } = useCheckoutContext();
  const { apiHost } = useGoDaddyContext();
  const updateTaxes = useUpdateTaxes();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: session?.id
      ? ['apply-fulfillment-location', session.id]
      : ['apply-fulfillment-location'],
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
      // Don't process empty string or undefined location IDs
      if (!session || !fulfillmentLocationId) return;

      const data = jwt
        ? await applyFulfillmentLocation(
            { fulfillmentLocationId },
            { accessToken: jwt },
            apiHost
          )
        : await applyFulfillmentLocation(
            { fulfillmentLocationId },
            session,
            apiHost
          );
      return data;
    },
    onSuccess: (_data, { locationAddress }) => {
      if (!session) return;

      if (session?.enableTaxCollection && locationAddress) {
        updateTaxes.mutate(locationAddress);
      } else {
        queryClient.invalidateQueries({
          queryKey: ['draft-order', session.id],
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
