import type { QueryClient } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ResultOf } from 'gql.tada';
import { useCheckoutContext } from '@/components/checkout/checkout';
import {
  checkoutMutationKeys,
  checkoutQueryKeys,
} from '@/components/checkout/utils/query-keys';
import { useGoDaddyContext } from '@/godaddy-provider';
import { ApplyCheckoutSessionShippingMethodMutation } from '@/lib/godaddy/checkout-mutations.ts';
import { DraftOrderQuery } from '@/lib/godaddy/checkout-queries.ts';
import { applyShippingMethod } from '@/lib/godaddy/godaddy';
import type { ApplyCheckoutSessionShippingMethodInput } from '@/types';

type ShippingMutationResult = ResultOf<
  typeof ApplyCheckoutSessionShippingMethodMutation
>;
type ShippingMethods = ApplyCheckoutSessionShippingMethodInput['input'];

interface UseApplyShippingMethodCoreOptions {
  onSuccess?: (
    data: ShippingMutationResult,
    shippingMethods: ShippingMethods
  ) => Promise<void> | void;
  onError?: (error: Error) => void;
}

export function updateShippingMethodCache(
  queryClient: QueryClient,
  sessionId: string,
  data: ShippingMutationResult
) {
  const shippingTotal =
    data.applyCheckoutSessionShippingMethod?.draftOrder?.totals?.shippingTotal;
  if (!shippingTotal) return;

  queryClient.setQueryData(
    checkoutQueryKeys.draftOrder(sessionId),
    (cached: ResultOf<typeof DraftOrderQuery> | undefined) => {
      if (!cached) return cached;

      return {
        ...cached,
        checkoutSession: {
          ...cached.checkoutSession,
          draftOrder: {
            ...cached.checkoutSession?.draftOrder,
            shippingLines: [
              {
                ...cached.checkoutSession?.draftOrder?.shippingLines?.[0],
                amount: { ...shippingTotal },
              },
            ],
            totals: {
              ...cached.checkoutSession?.draftOrder?.totals,
              shippingTotal: { ...shippingTotal },
            },
          },
        },
      };
    }
  );
}

export function useApplyShippingMethodCore(
  options: UseApplyShippingMethodCoreOptions = {}
) {
  const { session, jwt } = useCheckoutContext();
  const { apiHost } = useGoDaddyContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: checkoutMutationKeys.applyShippingMethod(session?.id),
    mutationFn: async (shippingMethods: ShippingMethods) => {
      if (!session) return;

      return jwt
        ? applyShippingMethod(shippingMethods, { accessToken: jwt }, apiHost)
        : applyShippingMethod(shippingMethods, session, apiHost);
    },
    onSuccess: async (data, shippingMethods) => {
      if (!session || !data) return;

      updateShippingMethodCache(queryClient, session.id, data);
      await options.onSuccess?.(data, shippingMethods);
    },
    onError: options.onError,
  });
}
