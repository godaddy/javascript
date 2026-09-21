import { useApplyDiscountCore } from './use-apply-discount-core';
import { useReconcileAfterDiscount } from './use-reconcile-after-discount';

export function useDiscountApply() {
  const reconcileAfterDiscount = useReconcileAfterDiscount();

  return useApplyDiscountCore({
    onSuccess: async (_data, variables) => {
      await reconcileAfterDiscount(variables);
    },
  });
}
