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
}: {
  order?: DraftOrder | null;
  defaultValues?: Pick<CheckoutFormData, 'contactEmail'>;
  defaultCountryCode?: string | null;
}): CheckoutFormData {
  const orderShippingAddress = order?.shipping?.address;
  const orderBillingAddress = order?.billing?.address;
  const paymentShouldUseShippingAddress = Boolean(
    orderShippingAddress?.addressLine1 === orderBillingAddress?.addressLine1
  );
  const isPickup = order?.lineItems?.some(
    lineItem => lineItem.fulfillmentMode === DeliveryMethods.PICKUP
  );

  const isShipping = order?.lineItems?.some(
    lineItem => lineItem.fulfillmentMode === DeliveryMethods.SHIP
  );

  const isMixedFulfillment = isPickup && isShipping;

  let deliveryMethod = DeliveryMethods.PURCHASE;
  if (!isMixedFulfillment && isPickup) {
    deliveryMethod = DeliveryMethods.PICKUP;
  } else if (!isMixedFulfillment && isShipping) {
    deliveryMethod = DeliveryMethods.SHIP;
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
    notes: order?.notes?.[0]?.content || '',
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
 * Maps order line items and SKUs to displayable items
 */
export function mapSkusToItemsDisplay(
  orderItems?: DraftOrder['lineItems'],
  skusMap: Record<string, SKUProduct> = {}
): Product[] {
  return (
    orderItems?.map(orderItem => {
      const sku = orderItem?.details?.sku;
      const skuDetails = sku ? skusMap[sku] : undefined;

      return {
        id: orderItem.id || '',
        name: skuDetails?.label || orderItem.name || '',
        image: orderItem.details?.productAssetUrl || skuDetails?.mediaUrls?.[0],
        quantity: orderItem.quantity || 0,
        originalPrice:
          (orderItem.totals?.subTotal?.value ?? 0) /
          (orderItem.quantity || 0) /
          100,
        price:
          ((orderItem.totals?.subTotal?.value ?? 0) +
            (orderItem.totals?.feeTotal?.value ?? 0) -
            // (orderItem.totals?.taxTotal?.value ?? 0) - // do we need taxTotal here?
            (orderItem.totals?.discountTotal?.value ?? 0)) /
          100,
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
