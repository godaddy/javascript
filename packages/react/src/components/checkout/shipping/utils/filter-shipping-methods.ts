import type { CheckoutSession, ShippingMethod } from '@/types';

interface FilterShippingMethodsParams {
  shippingMethods: ShippingMethod[];
  orderSubTotal: number;
  experimentalRules?: CheckoutSession['experimental_rules'];
}

export function filterAndSortShippingMethods({
  shippingMethods,
  orderSubTotal,
  experimentalRules,
}: FilterShippingMethodsParams): ShippingMethod[] {
  const enableFreeShippingRule = experimentalRules?.freeShipping?.enabled;
  const freeShippingMinimumOrderTotal =
    experimentalRules?.freeShipping?.minimumOrderTotal || 0;

  return shippingMethods
    .filter(
      method =>
        !(
          enableFreeShippingRule &&
          method?.cost?.value === 0 &&
          orderSubTotal < freeShippingMinimumOrderTotal
        )
    )
    .sort((a, b) => {
      const costA = a?.cost?.value || 0;
      const costB = b?.cost?.value || 0;

      // First sort by cost
      if (costA !== costB) {
        return costA - costB;
      }

      // If costs are equal, sort by name
      const nameA = a?.displayName || '';
      const nameB = b?.displayName || '';
      return nameA.localeCompare(nameB);
    });
}
