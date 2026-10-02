import type { ShippingLines, ShippingMethod } from '@/types';
import { sortShippingMethods } from './sort-shipping-methods';

interface SelectShippingMethodParams {
  shippingMethods: ShippingMethod[];
  currentServiceCode?: string | null;
  // null means there is no earlier rate set to compare against (first load).
  previousShippingMethods?: ShippingMethod[] | null;
  isAutoSelected?: boolean;
}

interface RequiresShippingReconciliationParams {
  shippingMethods: ShippingMethod[];
  previousShippingMethods?: ShippingMethod[];
  currentShippingLine?: ShippingLines | null;
  selectedServiceCode?: string | null;
  isAutoSelected?: boolean;
}

function isFreeShippingMethod(method: ShippingMethod) {
  return method.cost?.value === 0;
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
  previousShippingMethods = null,
  isAutoSelected = false,
}: SelectShippingMethodParams) {
  const availableMethods = sortShippingMethods(shippingMethods);
  const methodsKey = getShippingMethodsKey(availableMethods);
  const cheapestMethod = availableMethods[0];
  const currentMethod = currentServiceCode
    ? availableMethods.find(method => method.serviceCode === currentServiceCode)
    : undefined;

  if (!currentMethod) {
    return { selectedMethod: cheapestMethod, methodsKey, autoSelected: true };
  }

  if (previousShippingMethods) {
    const freeShippingNewlyAvailable =
      !previousShippingMethods.some(isFreeShippingMethod) &&
      availableMethods.some(isFreeShippingMethod);
    const methodsChanged =
      methodsKey !== getShippingMethodsKey(previousShippingMethods);

    if (
      (freeShippingNewlyAvailable && !isFreeShippingMethod(currentMethod)) ||
      (isAutoSelected && methodsChanged)
    ) {
      return { selectedMethod: cheapestMethod, methodsKey, autoSelected: true };
    }
  }

  return {
    selectedMethod: currentMethod,
    methodsKey,
    autoSelected: isAutoSelected,
  };
}

export function requiresShippingReconciliation({
  shippingMethods,
  previousShippingMethods = [],
  currentShippingLine,
  selectedServiceCode,
  isAutoSelected,
}: RequiresShippingReconciliationParams) {
  const currentServiceCode =
    selectedServiceCode || currentShippingLine?.requestedService;
  const { selectedMethod } = selectShippingMethod({
    shippingMethods,
    currentServiceCode,
    previousShippingMethods,
    isAutoSelected,
  });

  return selectedMethod
    ? selectedMethod.serviceCode !== currentShippingLine?.requestedService ||
        (selectedMethod.cost?.value ?? null) !==
          (currentShippingLine?.amount?.value ?? null)
    : Boolean(currentShippingLine?.requestedService);
}
