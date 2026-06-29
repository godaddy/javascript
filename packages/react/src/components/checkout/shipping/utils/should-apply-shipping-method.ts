import { DeliveryMethods } from '@/components/checkout/delivery/delivery-methods';
import type { DraftOrder, ShippingLines, ShippingMethod } from '@/types';

type LastProcessedShippingState = {
  serviceCode: string | null;
  cost: number | null;
  blockedFulfillmentKey: string | null;
};

export function getShippingFulfillmentSyncKey(
  lineItems?: DraftOrder['lineItems']
): string | null {
  const hasLineItemsMissingShippingFulfillment = lineItems?.some(
    lineItem =>
      !lineItem.fulfillmentMode ||
      lineItem.fulfillmentMode === DeliveryMethods.NONE
  );

  if (!hasLineItemsMissingShippingFulfillment) return null;

  return (
    lineItems
      ?.map(lineItem => `${lineItem.id}:${lineItem.fulfillmentMode ?? ''}`)
      .join('|') || null
  );
}

export function shouldApplyShippingMethod({
  methodToApply,
  shippingLine,
  lastState,
  fulfillmentSyncKey,
}: {
  methodToApply: ShippingMethod;
  shippingLine?: ShippingLines | null;
  lastState: LastProcessedShippingState;
  fulfillmentSyncKey: string | null;
}) {
  const methodCost = methodToApply.cost?.value ?? null;
  const currentServiceCode = shippingLine?.requestedService || null;
  const currentCost = shippingLine?.amount?.value ?? null;
  const hasLineItemsMissingShippingFulfillment = Boolean(fulfillmentSyncKey);
  const isFulfillmentSyncBlocked =
    Boolean(fulfillmentSyncKey) &&
    fulfillmentSyncKey === lastState.blockedFulfillmentKey;

  const alreadyProcessed =
    methodToApply.serviceCode === lastState.serviceCode &&
    methodCost === lastState.cost &&
    (!hasLineItemsMissingShippingFulfillment || isFulfillmentSyncBlocked);

  if (alreadyProcessed) {
    return {
      alreadyProcessed,
      needsMutation: false,
      isFulfillmentSyncBlocked,
      methodCost,
    };
  }

  return {
    alreadyProcessed,
    needsMutation:
      methodToApply.serviceCode !== currentServiceCode ||
      methodCost !== currentCost ||
      (hasLineItemsMissingShippingFulfillment && !isFulfillmentSyncBlocked),
    isFulfillmentSyncBlocked,
    methodCost,
  };
}
