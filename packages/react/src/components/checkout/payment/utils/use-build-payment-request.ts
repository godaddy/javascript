import type { CreateTokenCardData } from '@stripe/stripe-js';
import type { ConfirmationTokenCreateParams } from '@stripe/stripe-js/dist/api/confirmation-tokens';
import { useMemo } from 'react';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useDraftOrder, useDraftOrderTotals } from '@/components/checkout/order/use-draft-order';
import { useDraftOrderProductsMap } from '@/components/checkout/order/use-draft-order-products';
import { mapSkusToItemsDisplay } from '@/components/checkout/utils/checkout-transformers';

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
    contactField?: 'administrativeArea' | 'countryCode' | 'postalCode' | 'locality';
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

  const items = useMemo(() => mapSkusToItemsDisplay(lineItems, skusMap), [lineItems, skusMap]);

  // Convert amounts from cents to dollars for display
  const subtotal = (totals?.subTotal?.value || 0) / 100;
  const tax = (totals?.taxTotal?.value || 0) / 100;
  const shipping = (order?.shippingLines?.reduce((sum, line) => sum + (line?.amount?.value || 0), 0) || 0) / 100;
  const discount = (totals?.discountTotal?.value || 0) / 100;
  const total = (totals?.total?.value || 0) / 100;

  const countryCode = useMemo(
    () => session?.shipping?.originAddress?.countryCode || 'US',
    [session?.shipping?.originAddress?.countryCode]
  );

  // Memoize address information with null handling
  const shippingAddress = useMemo(
    () => ({
      name: {
        full_name: `${order?.shipping?.firstName || ''} ${order?.shipping?.lastName || ''}`.trim(),
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
        full_name: `${order?.billing?.firstName || ''} ${order?.billing?.lastName || ''}`.trim(),
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
      amount: new Intl.NumberFormat('en-us', {
        style: 'currency',
        currency: currencyCode,
      }).format(total),
      type: 'final',
    },
    lineItems: [
      ...(items || []).map(lineItem => ({
        label: lineItem?.name || '',
        amount: new Intl.NumberFormat('en-us', {
          style: 'currency',
          currency: currencyCode,
        }).format((lineItem?.originalPrice || 0) * (lineItem?.quantity || 0)),
        type: 'LINE_ITEM',
        status: 'FINAL',
      })),
      {
        label: 'Subtotal',
        amount: new Intl.NumberFormat('en-us', {
          style: 'currency',
          currency: currencyCode,
        }).format(subtotal),
        type: 'final',
      },
      {
        label: 'Tax',
        amount: new Intl.NumberFormat('en-us', {
          style: 'currency',
          currency: currencyCode,
        }).format(tax),
        type: 'final',
      },
      {
        label: 'Shipping',
        amount: new Intl.NumberFormat('en-us', {
          style: 'currency',
          currency: currencyCode,
        }).format(shipping),
        type: 'final',
      },
      {
        label: 'Discount',
        amount: new Intl.NumberFormat('en-us', {
          style: 'currency',
          currency: currencyCode,
        }).format(-1 * discount),
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
          allowedCardNetworks: ['AMEX', 'DISCOVER', 'JCB', 'MASTERCARD', 'VISA'],
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
      totalPrice: new Intl.NumberFormat('en-us', {
        style: 'currency',
        currency: currencyCode,
      }).format(total),
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
          price: subtotal,
          type: 'LINE_ITEM',
          status: 'FINAL',
        },
        {
          label: 'Tax',
          price: tax,
          type: 'LINE_ITEM',
          status: 'FINAL',
        },
        {
          label: 'Shipping',
          price: shipping,
          type: 'LINE_ITEM',
          status: 'FINAL',
        },
        {
          label: 'Discount',
          price: -1 * discount,
          type: 'LINE_ITEM',
          status: 'FINAL',
        },
      ].filter(item => item?.price !== 0),
    },
  };

  // Create PayPal request with proper breakdown validation
  const calculatedTotal = subtotal + tax + shipping - discount;

  const payPalRequest: PayPalRequest = {
    purchase_units: [
      {
        amount: {
          currency_code: currencyCode,
          value: calculatedTotal.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: currencyCode,
              value: subtotal.toFixed(2),
            },
            tax_total: {
              currency_code: currencyCode,
              value: tax.toFixed(2),
            },
            shipping: {
              currency_code: currencyCode,
              value: shipping.toFixed(2),
            },
            discount: {
              currency_code: currencyCode,
              value: discount.toFixed(2),
            },
          },
        },
        items: items.map(lineItem => ({
          name: lineItem?.name || '',
          unit_amount: {
            currency_code: currencyCode,
            value: (lineItem?.originalPrice || 0).toFixed(2),
          },
          quantity: (lineItem?.quantity || 1).toString(),
        })),
        shipping: shippingAddress,
        billing: billingAddress,
      },
    ],
  };

  const stripePaymentCardRequest: CreateTokenCardData = {
    name: `${order?.billing?.firstName || ''} ${order?.billing?.lastName || ''}`.trim() || undefined,
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
        name: `${order?.billing?.firstName || ''} ${order?.billing?.lastName || ''}`.trim() || undefined,
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
      addressLines: [order?.billing?.address?.addressLine1 || '', order?.billing?.address?.addressLine2 || ''].filter(Boolean),
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
      amount: subtotal.toString(),
    },
    lineItems: [
      ...(items || []).map(lineItem => {
        return {
          label: lineItem?.name || '',
          amount: ((lineItem?.originalPrice || 0) * (lineItem?.quantity || 1)).toString(),
        };
      }),
    ],
  };

  const poyntStandardRequest: PoyntStandardRequest = {
    total: {
      label: 'Order Total',
      amount: total.toString(),
    },
    lineItems: [
      ...(items || []).map(lineItem => {
        return {
          label: lineItem?.name || '',
          amount: ((lineItem?.originalPrice || 0) * (lineItem?.quantity || 1)).toString(),
        };
      }),
      {
        label: 'Tax',
        amount: tax.toFixed(2),
      },
      {
        label: 'Shipping',
        amount: shipping.toFixed(2),
      },
      {
        label: 'Discount',
        amount: (-1 * discount).toFixed(2),
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
