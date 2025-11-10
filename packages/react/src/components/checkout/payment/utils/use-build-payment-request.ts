import type { CreateTokenCardData } from '@stripe/stripe-js';
import type { ConfirmationTokenCreateParams } from '@stripe/stripe-js/dist/api/confirmation-tokens';
import { useMemo } from 'react';
import { useCheckoutContext } from '@/components/checkout/checkout';
import {
  useDraftOrder,
  useDraftOrderTotals,
} from '@/components/checkout/order/use-draft-order';
import { useDraftOrderProductsMap } from '@/components/checkout/order/use-draft-order-products';
import { mapSkusToItemsDisplay } from '@/components/checkout/utils/checkout-transformers';
import { formatCurrency } from '@/components/checkout/utils/format-currency';

// Apple Pay request interface
export interface ApplePayRequest {
  countryCode: string;
  currencyCode: string;
  supportedNetworks: string[];
  merchantCapabilities: string[];
  total: {
    label: string;
    amount: string;
    type: string;
  };
  lineItems: Array<{
    label: string;
    amount: string;
    type: string;
    status?: string;
  }>;
}

// Google Pay request interface
export interface GooglePayRequest {
  apiVersion: number;
  apiVersionMinor: number;
  allowedPaymentMethods: any;
  merchantInfo: {
    merchantId: string;
    merchantName: string;
    merchantOrigin: string;
  };
  transactionInfo: {
    totalPriceStatus: any;
    totalPrice: string;
    totalPriceLabel: string;
    currencyCode: string;
    displayItems: any;
  };
}

// PayPal request interface
export interface PayPalRequest {
  purchase_units: Array<{
    amount: {
      currency_code: string;
      value: string;
      breakdown: {
        item_total: { currency_code: string; value: string };
        tax_total: { currency_code: string; value: string };
        shipping: { currency_code: string; value: string };
        discount: { currency_code: string; value: string };
      };
    };
    items: Array<{
      name: string;
      unit_amount: { currency_code: string; value: string };
      quantity: string;
    }>;
    shipping?: {
      name: { full_name: string };
      address: {
        address_line_1?: string;
        address_line_2?: string;
        admin_area_2?: string;
        admin_area_1?: string;
        postal_code?: string;
        country_code?: string;
      };
    };
    billing?: {
      name: { full_name: string };
      address: {
        address_line_1?: string;
        address_line_2?: string;
        admin_area_2?: string;
        admin_area_1?: string;
        postal_code?: string;
        country_code?: string;
      };
    };
  }>;
}

export interface PoyntCardRequest {
  emailAddress?: string;
  firstName?: string;
  lastName?: string;
  zipCode?: string;
  line1?: string;
  line2?: string;
  city?: string;
  territory?: string;
  countryCode?: string;
}

export interface SquarePaymentRequest {
  amount: string;
  billingContact: {
    givenName: string;
    familyName: string;
    email: string;
    phone?: string;
    addressLines: string[];
    city: string;
    state: string;
    countryCode: string;
    postalCode?: string;
  };
  currencyCode: string;
  intent: 'CHARGE' | 'STORE' | 'CHARGE_AND_STORE';
  customerInitiated: boolean;
  sellerKeyedIn: boolean;
}

export interface PoyntExpressRequest {
  total: {
    label: string;
    amount: string;
    isPending?: boolean;
  };
  lineItems: Array<{
    label: string;
    amount: string;
    isPending?: boolean;
  }>;
  shippingMethods?: Array<{
    id: string;
    label: string;
    detail: string;
    amount: string;
  }>;
  couponCode?:
    | {
        code: string;
        label: string;
        amount: string;
      }
    | undefined;
  error?: {
    code?:
      | 'invalid_shipping_address'
      | 'invalid_billing_address'
      | 'invalid_coupon_code'
      | 'expired_coupon_code'
      | 'unserviceable_address'
      | 'unknown';
    message?: string;
    contactField?:
      | 'administrativeArea'
      | 'countryCode'
      | 'postalCode'
      | 'locality';
  };
}

export interface PoyntStandardRequest extends PoyntExpressRequest {}

export function useBuildPaymentRequest(): {
  applePayRequest: ApplePayRequest;
  googlePayRequest: GooglePayRequest;
  payPalRequest: PayPalRequest;
  stripePaymentCardRequest: CreateTokenCardData;
  stripePaymentExpressRequest: ConfirmationTokenCreateParams;
  poyntCardRequest: PoyntCardRequest;
  poyntExpressRequest: PoyntExpressRequest;
  poyntStandardRequest: PoyntStandardRequest;
  squarePaymentRequest: SquarePaymentRequest;
} {
  const { session } = useCheckoutContext();

  const draftOrderTotalsQuery = useDraftOrderTotals();
  const draftOrderQuery = useDraftOrder();
  const skusMap = useDraftOrderProductsMap();

  const { data: totals } = draftOrderTotalsQuery;
  const { data: order } = draftOrderQuery;

  // Extract totals information based on the data format
  const currencyCode = totals?.total?.currencyCode || 'USD';
  const lineItems = order?.lineItems || [];

  const items = useMemo(
    () => mapSkusToItemsDisplay(lineItems, skusMap),
    [lineItems, skusMap]
  );

  // Extract amounts in minor units for use across payment requests
  const subtotalMinorUnits = totals?.subTotal?.value || 0;
  const taxMinorUnits = totals?.taxTotal?.value || 0;
  const shippingMinorUnits =
    order?.shippingLines?.reduce(
      (sum, line) => sum + (line?.amount?.value || 0),
      0
    ) || 0;
  const discountMinorUnits = totals?.discountTotal?.value || 0;
  const totalMinorUnits = totals?.total?.value || 0;

  const countryCode = useMemo(
    () => session?.shipping?.originAddress?.countryCode || 'US',
    [session?.shipping?.originAddress?.countryCode]
  );

  // Memoize address information with null handling
  const shippingAddress = useMemo(
    () => ({
      name: {
        full_name:
          `${order?.shipping?.firstName || ''} ${order?.shipping?.lastName || ''}`.trim(),
      },
      address: {
        address_line_1: order?.shipping?.address?.addressLine1 || undefined,
        address_line_2: order?.shipping?.address?.addressLine2 || undefined,
        admin_area_2: order?.shipping?.address?.adminArea2 || undefined,
        admin_area_1: order?.shipping?.address?.adminArea1 || undefined,
        postal_code: order?.shipping?.address?.postalCode || undefined,
        country_code: order?.shipping?.address?.countryCode || countryCode,
      },
    }),
    [order?.shipping, countryCode]
  );

  const billingAddress = useMemo(
    () => ({
      name: {
        full_name:
          `${order?.billing?.firstName || ''} ${order?.billing?.lastName || ''}`.trim(),
      },
      address: {
        address_line_1: order?.billing?.address?.addressLine1 || undefined,
        address_line_2: order?.billing?.address?.addressLine2 || undefined,
        admin_area_2: order?.billing?.address?.adminArea2 || undefined,
        admin_area_1: order?.billing?.address?.adminArea1 || undefined,
        postal_code: order?.billing?.address?.postalCode || undefined,
        country_code: order?.billing?.address?.countryCode || countryCode,
      },
    }),
    [order?.billing, countryCode]
  );

  // Create Apple Pay request
  const applePayRequest: ApplePayRequest = {
    countryCode,
    currencyCode,
    supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
    merchantCapabilities: ['supports3DS'],
    total: {
      label: 'Order Total',
      amount: formatCurrency({
        amount: totals?.total?.value || 0,
        currencyCode,
        isInCents: true,
      }),
      type: 'final',
    },
    lineItems: [
      ...(items || []).map(lineItem => ({
        label: lineItem?.name || '',
        amount: formatCurrency({
          amount: (lineItem?.originalPrice || 0) * (lineItem?.quantity || 0),
          currencyCode,
          isInCents: true,
        }),
        type: 'LINE_ITEM',
        status: 'FINAL',
      })),
      {
        label: 'Subtotal',
        amount: formatCurrency({
          amount: totals?.subTotal?.value || 0,
          currencyCode,
          isInCents: true,
        }),
        type: 'final',
      },
      {
        label: 'Tax',
        amount: formatCurrency({
          amount: totals?.taxTotal?.value || 0,
          currencyCode,
          isInCents: true,
        }),
        type: 'final',
      },
      {
        label: 'Shipping',
        amount: formatCurrency({
          amount:
            order?.shippingLines?.reduce(
              (sum, line) => sum + (line?.amount?.value || 0),
              0
            ) || 0,
          currencyCode,
          isInCents: true,
        }),
        type: 'final',
      },
      {
        label: 'Discount',
        amount: formatCurrency({
          amount: -1 * (totals?.discountTotal?.value || 0),
          currencyCode,
          isInCents: true,
        }),
        type: 'final',
      },
    ].filter(item => Number.parseFloat(item.amount) !== 0),
  };

  // Create Google Pay request
  const googlePayRequest: GooglePayRequest = {
    apiVersion: 2,
    apiVersionMinor: 0,
    allowedPaymentMethods: [
      {
        type: 'CARD',
        parameters: {
          allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
          allowedCardNetworks: [
            'AMEX',
            'DISCOVER',
            'JCB',
            'MASTERCARD',
            'VISA',
          ],
        },
        tokenizationSpecification: {
          type: 'PAYMENT_GATEWAY',
          parameters: {
            gateway: 'godaddypayments',
            gatewayMerchantId: 'merchantId',
          },
        },
      },
    ],
    merchantInfo: {
      merchantId: session?.storeId || '',
      merchantName: session?.storeName || '',
      merchantOrigin: document.location.hostname,
    },
    transactionInfo: {
      totalPriceStatus: 'FINAL',
      totalPrice: formatCurrency({
        amount: totals?.total?.value || 0,
        currencyCode,
        isInCents: true,
      }),
      totalPriceLabel: 'Total',
      currencyCode,
      displayItems: [
        ...(items || []).map(lineItem => ({
          label: lineItem?.name || '',
          price: (lineItem?.originalPrice || 0) * (lineItem?.quantity || 0),
          type: 'LINE_ITEM',
          status: 'FINAL',
        })),
        {
          label: 'Subtotal',
          price: Number.parseFloat(
            formatCurrency({
              amount: subtotalMinorUnits,
              currencyCode,
              isInCents: true,
              returnRaw: true,
            })
          ),
          type: 'LINE_ITEM',
          status: 'FINAL',
        },
        {
          label: 'Tax',
          price: Number.parseFloat(
            formatCurrency({
              amount: taxMinorUnits,
              currencyCode,
              isInCents: true,
              returnRaw: true,
            })
          ),
          type: 'LINE_ITEM',
          status: 'FINAL',
        },
        {
          label: 'Shipping',
          price: Number.parseFloat(
            formatCurrency({
              amount: shippingMinorUnits,
              currencyCode,
              isInCents: true,
              returnRaw: true,
            })
          ),
          type: 'LINE_ITEM',
          status: 'FINAL',
        },
        {
          label: 'Discount',
          price: Number.parseFloat(
            formatCurrency({
              amount: -1 * discountMinorUnits,
              currencyCode,
              isInCents: true,
              returnRaw: true,
            })
          ),
          type: 'LINE_ITEM',
          status: 'FINAL',
        },
      ].filter(item => item?.price !== 0),
    },
  };

  // Create PayPal request with proper breakdown validation
  const calculatedTotalMinorUnits =
    subtotalMinorUnits +
    taxMinorUnits +
    shippingMinorUnits -
    discountMinorUnits;

  const payPalRequest: PayPalRequest = {
    purchase_units: [
      {
        amount: {
          currency_code: currencyCode,
          value: formatCurrency({
            amount: calculatedTotalMinorUnits,
            currencyCode,
            isInCents: true,
            returnRaw: true,
          }),
          breakdown: {
            item_total: {
              currency_code: currencyCode,
              value: formatCurrency({
                amount: subtotalMinorUnits,
                currencyCode,
                isInCents: true,
                returnRaw: true,
              }),
            },
            tax_total: {
              currency_code: currencyCode,
              value: formatCurrency({
                amount: taxMinorUnits,
                currencyCode,
                isInCents: true,
                returnRaw: true,
              }),
            },
            shipping: {
              currency_code: currencyCode,
              value: formatCurrency({
                amount: shippingMinorUnits,
                currencyCode,
                isInCents: true,
                returnRaw: true,
              }),
            },
            discount: {
              currency_code: currencyCode,
              value: formatCurrency({
                amount: discountMinorUnits,
                currencyCode,
                isInCents: true,
                returnRaw: true,
              }),
            },
          },
        },
        items: items.map(lineItem => ({
          name: lineItem?.name || '',
          unit_amount: {
            currency_code: currencyCode,
            value: formatCurrency({
              amount: lineItem?.originalPrice || 0,
              currencyCode,
              isInCents: true,
              returnRaw: true,
            }),
          },
          quantity: (lineItem?.quantity || 1).toString(),
        })),
        shipping: shippingAddress,
        billing: billingAddress,
      },
    ],
  };

  const stripePaymentCardRequest: CreateTokenCardData = {
    name:
      `${order?.billing?.firstName || ''} ${order?.billing?.lastName || ''}`.trim() ||
      undefined,
    address_line1: order?.billing?.address?.addressLine1 || undefined,
    address_line2: order?.billing?.address?.addressLine2 || undefined,
    address_city: order?.billing?.address?.adminArea2 || undefined,
    address_state: order?.billing?.address?.adminArea1 || undefined,
    address_zip: order?.billing?.address?.postalCode || undefined,
    address_country: order?.billing?.address?.countryCode || undefined,
  };

  const stripePaymentExpressRequest: ConfirmationTokenCreateParams = {
    payment_method_data: {
      billing_details: {
        name:
          `${order?.billing?.firstName || ''} ${order?.billing?.lastName || ''}`.trim() ||
          undefined,
        email: order?.billing?.email || undefined,
        address: {
          line1: order?.billing?.address?.addressLine1 || undefined,
          line2: order?.billing?.address?.addressLine2 || undefined,
          city: order?.billing?.address?.adminArea2 || undefined,
          state: order?.billing?.address?.adminArea1 || undefined,
          postal_code: order?.billing?.address?.postalCode || undefined,
          country: order?.billing?.address?.countryCode || undefined,
        },
      },
    },
    shipping: {
      name: `${order?.shipping?.firstName || ''} ${order?.shipping?.lastName || ''}`.trim(),
      address: {
        line1: order?.shipping?.address?.addressLine1 || null,
        line2: order?.shipping?.address?.addressLine2 || null,
        city: order?.shipping?.address?.adminArea2 || null,
        state: order?.shipping?.address?.adminArea1 || null,
        postal_code: order?.shipping?.address?.postalCode || null,
        country: order?.shipping?.address?.countryCode || null,
      },
    },
  };

  const poyntCardRequest: PoyntCardRequest = {
    emailAddress: order?.billing?.email || undefined,
    firstName: order?.billing?.firstName || undefined,
    lastName: order?.billing?.lastName || undefined,
    zipCode: order?.billing?.address?.postalCode || undefined,
    line1: order?.billing?.address?.addressLine1 || undefined,
    line2: order?.billing?.address?.addressLine2 || undefined,
    city: order?.billing?.address?.adminArea2 || undefined,
    territory: order?.billing?.address?.adminArea1 || undefined,
    countryCode: order?.billing?.address?.countryCode || undefined,
  };

  const squarePaymentRequest: SquarePaymentRequest = {
    amount: (totals?.total?.value || 0).toString(),
    billingContact: {
      givenName: order?.billing?.firstName || '',
      familyName: order?.billing?.lastName || '',
      email: order?.billing?.email || '',
      phone: order?.billing?.phone || undefined,
      addressLines: [
        order?.billing?.address?.addressLine1 || '',
        order?.billing?.address?.addressLine2 || '',
      ].filter(Boolean),
      city: order?.billing?.address?.adminArea2 || '',
      state: order?.billing?.address?.adminArea1 || '',
      countryCode: order?.billing?.address?.countryCode || countryCode,
      postalCode: order?.billing?.address?.postalCode || '',
    },
    currencyCode,
    intent: 'CHARGE',
    customerInitiated: true,
    sellerKeyedIn: false,
  };

  const poyntExpressRequest: PoyntExpressRequest = {
    total: {
      label: 'Order Total',
      amount: formatCurrency({
        amount: subtotalMinorUnits,
        currencyCode,
        isInCents: true,
        returnRaw: true,
      }),
    },
    lineItems: [
      ...(items || []).map(lineItem => {
        return {
          label: lineItem?.name || '',
          amount: (
            (lineItem?.originalPrice || 0) * (lineItem?.quantity || 1)
          ).toString(),
        };
      }),
    ],
  };

  const poyntStandardRequest: PoyntStandardRequest = {
    total: {
      label: 'Order Total',
      amount: formatCurrency({
        amount: totalMinorUnits,
        currencyCode,
        isInCents: true,
        returnRaw: true,
      }),
    },
    lineItems: [
      ...(items || []).map(lineItem => {
        return {
          label: lineItem?.name || '',
          amount: (
            (lineItem?.originalPrice || 0) * (lineItem?.quantity || 1)
          ).toString(),
        };
      }),
      {
        label: 'Tax',
        amount: formatCurrency({
          amount: taxMinorUnits,
          currencyCode,
          isInCents: true,
          returnRaw: true,
        }),
      },
      {
        label: 'Shipping',
        amount: formatCurrency({
          amount: shippingMinorUnits,
          currencyCode,
          isInCents: true,
          returnRaw: true,
        }),
      },
      {
        label: 'Discount',
        amount: formatCurrency({
          amount: -1 * discountMinorUnits,
          currencyCode,
          isInCents: true,
          returnRaw: true,
        }),
      },
    ],
  };

  return {
    applePayRequest,
    googlePayRequest,
    payPalRequest,
    stripePaymentCardRequest,
    stripePaymentExpressRequest,
    poyntCardRequest,
    poyntExpressRequest,
    poyntStandardRequest,
    squarePaymentRequest,
  };
}
