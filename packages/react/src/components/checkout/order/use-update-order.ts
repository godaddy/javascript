import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormContext } from 'react-hook-form';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { DeliveryMethods } from '@/components/checkout/delivery/delivery-methods';
import { useUpdateTaxes } from '@/components/checkout/order/use-update-taxes';
import {
  checkoutMutationKeys,
  checkoutQueryKeys,
} from '@/components/checkout/utils/query-keys';
import { useGoDaddyContext } from '@/godaddy-provider';
import { updateDraftOrder } from '@/lib/godaddy/godaddy';
import type { UpdateDraftOrderInput } from '@/types';

export function useUpdateOrder() {
  const { session, jwt } = useCheckoutContext();
  const { apiHost } = useGoDaddyContext();
  const updateTaxes = useUpdateTaxes();
  const queryClient = useQueryClient();
  const form = useFormContext();

  return useMutation({
    mutationKey: checkoutMutationKeys.updateDraftOrder(session?.id),
    scope: session?.id ? { id: `update-draft-order:${session.id}` } : undefined,
    mutationFn: async ({
      input,
    }: {
      input: UpdateDraftOrderInput['input'];
    }) => {
      const data = jwt
        ? await updateDraftOrder(input, { accessToken: jwt }, apiHost)
        : await updateDraftOrder(input, session, apiHost);
      return data;
    },
    onSuccess: async (_data, { input }) => {
      if (!session) return;

      /* Refetch taxes and shipping methods on address changes */
      if (
        input.shipping?.address ||
        (!input.shipping?.address && input.billing?.address)
      ) {
        if (session?.enableTaxCollection) {
          // For pickup orders, always use the pickup location address for tax calculation
          const deliveryMethod = form?.getValues?.('deliveryMethod');
          const isPickup = deliveryMethod === DeliveryMethods.PICKUP;

          if (isPickup) {
            const pickupLocationId = form?.getValues?.('pickupLocationId');
            const pickupLocationAddress = session?.locations?.find(
              loc => loc.id === pickupLocationId
            )?.address;

            // Always send pickup location address for pickup orders
            await updateTaxes.mutateAsync(pickupLocationAddress);
          } else if (
            deliveryMethod === DeliveryMethods.PURCHASE &&
            input.billing?.address
          ) {
            await updateTaxes.mutateAsync(input.billing.address);
          } else {
            // For shipping, let backend use the saved shipping address
            await updateTaxes.mutateAsync(undefined);
          }
        } else {
          queryClient.invalidateQueries({
            queryKey: checkoutQueryKeys.draftOrder(session.id),
          });
        }
      } else {
        queryClient.invalidateQueries({
          queryKey: checkoutQueryKeys.draftOrder(session.id),
        });
      }
    },
  });
}
