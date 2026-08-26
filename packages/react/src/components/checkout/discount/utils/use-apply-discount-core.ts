import type { QueryClient } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ResultOf } from 'gql.tada';
import { useCheckoutContext } from '@/components/checkout/checkout';
import {
  checkoutMutationKeys,
  checkoutQueryKeys,
} from '@/components/checkout/utils/query-keys';
import { useGoDaddyContext } from '@/godaddy-provider';
import { ApplyCheckoutSessionDiscountMutation } from '@/lib/godaddy/checkout-mutations.ts';
import { DraftOrderQuery } from '@/lib/godaddy/checkout-queries.ts';
import { applyDiscount } from '@/lib/godaddy/godaddy';
import type { ApplyCheckoutSessionDiscountInput } from '@/types';

type DiscountMutationResult = ResultOf<
  typeof ApplyCheckoutSessionDiscountMutation
>;
type DiscountOrder = NonNullable<
  DiscountMutationResult['applyCheckoutSessionDiscount']
>;

export interface ApplyDiscountVariables {
  discountCodes: ApplyCheckoutSessionDiscountInput['input']['discountCodes'];
}

interface UseApplyDiscountCoreOptions {
  onSuccess?: (
    data: DiscountMutationResult,
    variables: ApplyDiscountVariables
  ) => Promise<void> | void;
}

export function updateDiscountCache(
  queryClient: QueryClient,
  sessionId: string,
  updatedOrder: DiscountOrder,
  discountCodes: ApplyDiscountVariables['discountCodes']
) {
  queryClient.setQueryData(
    checkoutQueryKeys.draftOrder(sessionId),
    (cached: ResultOf<typeof DraftOrderQuery> | undefined) => {
      const currentOrder = cached?.checkoutSession?.draftOrder;
      if (!cached || !currentOrder) return cached;

      return {
        ...cached,
        checkoutSession: {
          ...cached.checkoutSession,
          draftOrder: {
            ...currentOrder,
            totals: {
              ...currentOrder.totals,
              discountTotal:
                updatedOrder.totals?.discountTotal ??
                currentOrder.totals?.discountTotal,
              total: updatedOrder.totals?.total ?? currentOrder.totals?.total,
            },
            discounts:
              updatedOrder.discounts ??
              (discountCodes?.length ? currentOrder.discounts : []),
            lineItems: currentOrder.lineItems?.map(currentLineItem => {
              const updatedLineItem = updatedOrder.lineItems?.find(
                lineItem => lineItem.id === currentLineItem.id
              );

              if (!updatedLineItem) {
                return discountCodes?.length
                  ? currentLineItem
                  : { ...currentLineItem, discounts: [] };
              }

              return {
                ...currentLineItem,
                discounts: updatedLineItem.discounts ?? [],
                totals: {
                  ...currentLineItem.totals,
                  discountTotal:
                    updatedLineItem.totals?.discountTotal ??
                    currentLineItem.totals?.discountTotal,
                },
              };
            }),
            shippingLines:
              currentOrder.shippingLines?.map((currentShippingLine, index) => {
                const updatedShippingLine = updatedOrder.shippingLines?.[index];

                if (!updatedShippingLine) {
                  return discountCodes?.length
                    ? currentShippingLine
                    : { ...currentShippingLine, discounts: [] };
                }

                return {
                  ...currentShippingLine,
                  discounts: updatedShippingLine.discounts ?? [],
                };
              }) ?? null,
          },
        },
      };
    }
  );
}

export function useApplyDiscountCore(
  options: UseApplyDiscountCoreOptions = {}
) {
  const { session, jwt } = useCheckoutContext();
  const { apiHost } = useGoDaddyContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: checkoutMutationKeys.applyDiscount(session?.id),
    mutationFn: async ({ discountCodes }: ApplyDiscountVariables) =>
      jwt
        ? applyDiscount(discountCodes, { accessToken: jwt }, apiHost)
        : applyDiscount(discountCodes, session, apiHost),
    onSuccess: async (data, variables) => {
      if (!session) return;

      const updatedOrder = data.applyCheckoutSessionDiscount;
      if (updatedOrder) {
        updateDiscountCache(
          queryClient,
          session.id,
          updatedOrder,
          variables.discountCodes
        );
      }

      await options.onSuccess?.(data, variables);
    },
  });
}
