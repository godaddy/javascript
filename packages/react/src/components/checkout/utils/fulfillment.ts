import { DeliveryMethods } from '@/components/checkout/delivery/delivery-methods';
import type { DraftOrder } from '@/types';

type LineItem = NonNullable<DraftOrder['lineItems']>[number];

export interface FulfillmentSummary {
  hasDigitalLineItems: boolean;
  hasNonDigitalLineItems: boolean;
  hasPickupLineItems: boolean;
  hasPurchaseLineItems: boolean;
  isDigitalOnly: boolean;
}

export function isDigitalLineItem(lineItem?: LineItem | null): boolean {
  return (
    lineItem?.type === DeliveryMethods.DIGITAL ||
    lineItem?.fulfillmentMode === DeliveryMethods.DIGITAL
  );
}

export function hasDigitalLineItems(
  lineItems?: DraftOrder['lineItems'] | null
) {
  return lineItems?.some(isDigitalLineItem) ?? false;
}

export function hasNonDigitalLineItems(
  lineItems?: DraftOrder['lineItems'] | null
) {
  return lineItems?.some(lineItem => !isDigitalLineItem(lineItem)) ?? false;
}

export function isDigitalOnlyOrder(lineItems?: DraftOrder['lineItems'] | null) {
  return (
    Boolean(lineItems?.length) && Boolean(lineItems?.every(isDigitalLineItem))
  );
}

export function getFulfillmentSummary(
  lineItems?: DraftOrder['lineItems'] | null
): FulfillmentSummary {
  const hasDigital = hasDigitalLineItems(lineItems);
  const nonDigitalLineItems = lineItems?.filter(
    lineItem => !isDigitalLineItem(lineItem)
  );
  const hasNonDigital = Boolean(nonDigitalLineItems?.length);

  return {
    hasDigitalLineItems: hasDigital,
    hasNonDigitalLineItems: hasNonDigital,
    hasPickupLineItems:
      nonDigitalLineItems?.some(
        lineItem => lineItem.fulfillmentMode === DeliveryMethods.PICKUP
      ) ?? false,
    hasPurchaseLineItems:
      nonDigitalLineItems?.some(
        lineItem => lineItem.fulfillmentMode === DeliveryMethods.PURCHASE
      ) ?? false,
    isDigitalOnly: hasDigital && !hasNonDigital,
  };
}
