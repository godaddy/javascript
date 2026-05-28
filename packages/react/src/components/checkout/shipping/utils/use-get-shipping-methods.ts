import { useMutation } from '@tanstack/react-query';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { checkoutMutationKeys } from '@/components/checkout/utils/query-keys';
import { useGoDaddyContext } from '@/godaddy-provider';
import { getDraftOrderShippingMethods } from '@/lib/godaddy/godaddy';
import type { GetCheckoutSessionShippingRatesInput } from '@/types';

export function useGetShippingMethodByAddress() {
  const { session, jwt } = useCheckoutContext();
  const { apiHost } = useGoDaddyContext();

  return useMutation({
    mutationKey: checkoutMutationKeys.getShippingMethodByAddress(session?.id),
    mutationFn: async (
      destination: GetCheckoutSessionShippingRatesInput['destination']
    ) => {
      if (!session) return;

      const data = jwt
        ? await getDraftOrderShippingMethods(
            { accessToken: jwt },
            destination,
            apiHost
          )
        : await getDraftOrderShippingMethods(session, destination, apiHost);

      return (
        data.checkoutSession?.draftOrder?.calculatedShippingRates?.rates || []
      );
    },
  });
}
