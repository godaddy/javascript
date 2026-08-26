import type { ShippingMethod } from '@/types';

export function sortShippingMethods(
  shippingMethods: ShippingMethod[]
): ShippingMethod[] {
  return [...shippingMethods].sort((a, b) => {
    const costA = a?.cost?.value || 0;
    const costB = b?.cost?.value || 0;

    if (costA !== costB) {
      return costA - costB;
    }

    const nameA = a?.displayName || '';
    const nameB = b?.displayName || '';
    return nameA.localeCompare(nameB);
  });
}
