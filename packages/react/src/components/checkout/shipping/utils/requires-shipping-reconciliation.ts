import type { ShippingLines, ShippingMethod } from '@/types';
import { sortShippingMethods } from './sort-shipping-methods';

interface SelectShippingMethodParams {
  shippingMethods: ShippingMethod[];
  currentServiceCode?: string | null;
  previousMethodsKey?: string | null;
}

interface RequiresShippingReconciliationParams {
  shippingMethods: ShippingMethod[];
  previousShippingMethods?: ShippingMethod[];
  currentShippingLine?: ShippingLines | null;
  selectedServiceCode?: string | null;
}

export function getShippingMethodsKey(shippingMethods: ShippingMethod[]) {
  return JSON.stringify(
    sortShippingMethods(shippingMethods).map(method => ({
      serviceCode: method.serviceCode,
      carrierCode: method.carrierCode,
      cost: method.cost,
    }))
  );
}

export function selectShippingMethod({
  shippingMethods,
  currentServiceCode,
  previousMethodsKey,
}: SelectShippingMethodParams) {
  const availableMethods = sortShippingMethods(shippingMethods);
  const methodsKey = getShippingMethodsKey(availableMethods);
  const methodsChanged = methodsKey !== previousMethodsKey;
  const selectedMethod = methodsChanged
    ? availableMethods[0]
    : availableMethods.find(
        method => method.serviceCode === currentServiceCode
      ) || availableMethods[0];

  return { selectedMethod, methodsKey };
}

export function requiresShippingReconciliation({
  shippingMethods,
  previousShippingMethods = [],
  currentShippingLine,
  selectedServiceCode,
}: RequiresShippingReconciliationParams) {
  const currentServiceCode =
    selectedServiceCode || currentShippingLine?.requestedService;
  const { selectedMethod } = selectShippingMethod({
    shippingMethods,
    currentServiceCode,
    previousMethodsKey: getShippingMethodsKey(previousShippingMethods),
  });

  return selectedMethod
    ? selectedMethod.serviceCode !== currentShippingLine?.requestedService ||
        (selectedMethod.cost?.value ?? null) !==
          (currentShippingLine?.amount?.value ?? null)
    : Boolean(currentShippingLine?.requestedService);
}
