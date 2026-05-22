import {
  type Country,
  getCountryCallingCode,
  parsePhoneNumber,
} from 'react-phone-number-input';
import type { CheckoutFormData } from '@/components/checkout/checkout';
import { DeliveryMethods } from '@/components/checkout/delivery/delivery-method';
import type { Product } from '@/components/checkout/line-items';
import type { DraftOrder, SKUProduct } from '@/types';

/**
 * Process a phone number with country code
 */
function processPhoneNumber(
  phoneValue: string | undefined,
  countryCode: string
): string {
  if (!phoneValue) return '';

  const cleanPhone = phoneValue.replace('-', '');
  const callingCode = getCountryCallingCode((countryCode || 'US') as Country);

  // Attempt to parse the phone number
  try {
    const parsedNumber = parsePhoneNumber(cleanPhone);
    if (parsedNumber === undefined) {
      throw new Error('invalid phone number');
    }
    return parsedNumber.number;
  } catch {
    try {
      return parsePhoneNumber(`+${callingCode}${cleanPhone}`)?.number || '';
    } catch {
      return '';
    }
  }
}

/**
 * Maps order data to form default values
 */
export function mapOrderToFormValues({
  order,
  defaultValues,
  defaultCountryCode,
  enableShipping,
  enableLocalPickup,
}: {
  order?: DraftOrder | null;
  defaultValues?: Pick<CheckoutFormData, 'contactEmail'>;
  defaultCountryCode?: string | null;
  /**
   * Session-level capability flags. When provided, the derived
   * `deliveryMethod` will fall back to `PURCHASE` for any item-level
   * fulfillment mode that the session has disabled. This avoids the
   * contradictory state where line items declare SHIP/PICKUP but the
   * session disables those flows (so `DeliveryMethodForm` is not even
   * rendered to correct the value). Pass `undefined` to skip the gate.
   */
  enableShipping?: boolean | null;
  enableLocalPickup?: boolean | null;
}): CheckoutFormData {
  const orderShippingAddress = order?.shipping?.address;
  const orderBillingAddress = order?.billing?.address;
  const paymentShouldUseShippingAddress = Boolean(
    orderShippingAddress?.addressLine1 === orderBillingAddress?.addressLine1
  );
  // Purchase mode = the session has neither shipping nor pickup enabled, so
  // this checkout is payment-only regardless of what fulfillment modes the
  // line items declare. Costs are assumed to be hardcoded on the order.
  const isPurchaseMode =
    enableShipping === false && enableLocalPickup === false;

  let deliveryMethod = DeliveryMethods.PURCHASE;

  if (!isPurchaseMode) {
    const hasPickupItem = order?.lineItems?.some(
      lineItem => lineItem.fulfillmentMode === DeliveryMethods.PICKUP
    );
    const hasShipItem = order?.lineItems?.some(
      lineItem => lineItem.fulfillmentMode === DeliveryMethods.SHIP
    );

    // Only treat item-level fulfillment as actionable if the session allows
    // that flow. When a flag is undefined we treat it as enabled so existing
    // callers retain their previous behavior.
    const isPickup = hasPickupItem && enableLocalPickup !== false;
    const isShipping = hasShipItem && enableShipping !== false;
    const isMixedFulfillment = isPickup && isShipping;

    if (!isMixedFulfillment && isPickup) {
      deliveryMethod = DeliveryMethods.PICKUP;
    } else if (!isMixedFulfillment && isShipping) {
      deliveryMethod = DeliveryMethods.SHIP;
    }
  }

  return {
    // Shipping address
    shippingFirstName: order?.shipping?.firstName ?? '',
    shippingLastName: order?.shipping?.lastName ?? '',
    shippingPhone: processPhoneNumber(
      order?.shipping?.phone ?? '',
      orderShippingAddress?.countryCode || defaultCountryCode || 'US'
    ),
    shippingAddressLine1: orderShippingAddress?.addressLine1 ?? '',
    shippingAddressLine2: orderShippingAddress?.addressLine2 ?? '',
    shippingAddressLine3: orderShippingAddress?.addressLine3 ?? '',
    shippingAdminArea4: orderShippingAddress?.adminArea4 ?? '',
    shippingAdminArea3: orderShippingAddress?.adminArea3 ?? '',
    shippingAdminArea2: orderShippingAddress?.adminArea2 ?? '',
    shippingAdminArea1: orderShippingAddress?.adminArea1 ?? '',
    shippingPostalCode: orderShippingAddress?.postalCode ?? '',
    shippingCountryCode:
      orderShippingAddress?.countryCode || defaultCountryCode || 'US',
    shippingValid: true,

    // Billing address
    billingFirstName: order?.billing?.firstName ?? '',
    billingLastName: order?.billing?.lastName ?? '',
    billingPhone: processPhoneNumber(
      order?.billing?.phone ?? '',
      orderBillingAddress?.countryCode || defaultCountryCode || 'US'
    ),
    billingAddressLine1: orderBillingAddress?.addressLine1 ?? '',
    billingAddressLine2: orderBillingAddress?.addressLine2 ?? '',
    billingAddressLine3: orderBillingAddress?.addressLine3 ?? '',
    billingAdminArea4: orderBillingAddress?.adminArea4 ?? '',
    billingAdminArea3: orderBillingAddress?.adminArea3 ?? '',
    billingAdminArea2: orderBillingAddress?.adminArea2 ?? '',
    billingAdminArea1: orderBillingAddress?.adminArea1 ?? '',
    billingPostalCode: orderBillingAddress?.postalCode ?? '',
    billingCountryCode:
      orderBillingAddress?.countryCode || defaultCountryCode || 'US',
    billingValid: true,

    // Contact information
    contactEmail: order?.shipping?.email || defaultValues?.contactEmail || '',

    // Delivery Methods
    deliveryMethod: deliveryMethod,

    // Payment information
    paymentUseShippingAddress: orderShippingAddress?.addressLine1
      ? paymentShouldUseShippingAddress
      : true,
    paymentExpiryDate: '',
    paymentNameOnCard: '',
    paymentCardNumber: '',
    paymentCardNumberDisplay: '',
    paymentSecurityCode: '',
    paymentMonth: '',
    paymentYear: '',

    // Notes
    notes:
      order?.notes?.find(
        note => note.authorType === 'CUSTOMER' && note.content?.trim() !== ''
      )?.content || '',
    pickupDate: '',
    pickupTime: '',

    tipAmount: 0,
    tipPercentage: 0,

    paymentMethod: '',

    // shippingMethod
    shippingMethod: order?.shippingLines?.[0]?.name ?? '',
  };
}

/**
 * Reads the `lineItemOrder` metafield from a line item and returns it as a
 * number. Returns Infinity when the metafield is missing or unparseable so
 * those items sort to the end while preserving their relative order via a
 * stable sort.
 */
function getLineItemOrder(
  lineItem: NonNullable<DraftOrder['lineItems']>[number]
): number {
  const metafield = lineItem?.metafields?.find(m => m?.key === 'lineItemOrder');
  if (!metafield?.value) return Number.POSITIVE_INFINITY;

  // Value is stored as a string; for JSON-typed numeric values we still want
  // to parse the underlying number.
  const parsed = Number(metafield.value);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

/**
 * Maps order line items and SKUs to displayable items
 */
export function mapSkusToItemsDisplay(
  orderItems?: DraftOrder['lineItems'],
  skusMap: Record<string, SKUProduct> = {}
): Product[] {
  const sortedOrderItems = orderItems
    ? [...orderItems].sort((a, b) => getLineItemOrder(a) - getLineItemOrder(b))
    : orderItems;

  return (
    sortedOrderItems?.map(orderItem => {
      const sku = orderItem?.details?.sku;
      const skuDetails = sku ? skusMap[sku] : undefined;

      return {
        id: orderItem.id || '',
        name: skuDetails?.label || orderItem.name || '',
        image: orderItem.details?.productAssetUrl,
        quantity: orderItem.quantity || 0,
        originalPrice:
          (orderItem.totals?.subTotal?.value ?? 0) / (orderItem.quantity || 0),
        price:
          (orderItem.totals?.subTotal?.value ?? 0) +
          (orderItem.totals?.feeTotal?.value ?? 0) -
          // (orderItem.totals?.taxTotal?.value ?? 0) - // do we need taxTotal here?
          (orderItem.totals?.discountTotal?.value ?? 0),
        notes: orderItem.notes
          ?.filter(
            note =>
              note.authorType !== 'CUSTOMER' && note.content?.trim() !== ''
          )
          .map(note => ({
            id: note.id,
            content: note.content,
          })),
        addons: orderItem.details?.selectedAddons?.map(addon => ({
          attribute: addon.attribute || '',
          sku: addon.sku || '',
          values: addon.values?.map(value => ({
            costAdjustment: value.costAdjustment
              ? {
                  currencyCode: value.costAdjustment.currencyCode ?? undefined,
                  value: value.costAdjustment.value ?? undefined,
                }
              : undefined,
            name: value.name ?? undefined,
          })),
        })),
        selectedOptions: orderItem.details?.selectedOptions
          ? orderItem.details.selectedOptions.map(option => ({
              attribute: option.attribute || '',
              values: option.values || [],
            }))
          : skuDetails?.attributes?.map(attr => {
              // Find the corresponding attribute value from SKU
              const matchingValue = skuDetails.attributeValues?.find(value =>
                attr.values?.some(v => v.id === value.id)
              );

              return {
                attribute: attr.label || attr.name || '',
                values: matchingValue
                  ? [matchingValue.label || matchingValue.name || '']
                  : [],
              };
            }),
        discounts: orderItem.discounts,
      } as Product;
    }) || []
  );
}
