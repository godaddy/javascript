import type { ShippingMethod } from '@/types';

export function buildShippingPayload(method: ShippingMethod) {
  const currencyCode = method.cost?.currencyCode || 'USD';

  return [
    {
      taxTotal: { value: 0, currencyCode },
      subTotal: {
        value: method.cost?.value || 0,
        currencyCode,
      },
      requestedService: method.serviceCode,
      requestedProvider: method.carrierCode,
      name: method.displayName || '',
    },
  ];
}
