export type NestedPartial<T> = {
  [P in keyof T]?: T[P] extends object ? NestedPartial<T[P]> : T[P];
};

export type TokenizeJsEvent = {
  type: string;
  data?: {
    validated?: boolean;
    error?: {
      message: string;
    };
    nonce?: string;
  };
};

export type TokenizeJsOptions = Record<string, object | string | boolean>;

export type WalletErrorCode =
  | 'invalid_shipping_address'
  | 'invalid_billing_address'
  | 'invalid_coupon_code'
  | 'expired_coupon_code'
  | 'unserviceable_address'
  | 'invalid_payment_data'
  | 'unknown';

export interface WalletRequestUpdate {
  total?: LineItem;
  shippingMethods?: ShippingMethod[];
  lineItems?: LineItem[];
  error?: WalletError;
  couponCode?: CouponCode;
}

export interface WalletError {
  code?: WalletErrorCode;
  message?: string;
  contactField?: string;
}

export interface LineItem {
  label: string;
  amount: string; // Decimal string format (e.g., "12.99")
  discountAmount?: string;
  isPending?: boolean; // Default: false (final)
}

export interface ShippingMethod {
  id: string;
  label: string;
  detail: string;
  amount: string;
}

export enum WalletType {
  ApplePay = 'apple_pay',
  GooglePay = 'google_pay',
  Paze = 'paze',
}

export interface CouponCode {
  code: string;
  label: string;
  amount: string;
}

export interface PaymentAuthorizedResponse {
  shippingAddress?: Address;
  billingAddress?: Address;
  nonce: string;
  source: WalletType;
  complete: (walletRequestUpdate?: WalletRequestUpdate) => void;
}

export interface Address {
  emailAddress?: string;
  administrativeArea?: string;
  countryCode?: string;
  postalCode?: string;
  locality?: string;
  phoneNumber?: string;
  addressLines?: string[];
  name?: string;
}

export interface ShippingAddressResponse {
  shippingAddress: Address;
  updateWith: (walletRequestUpdate: WalletRequestUpdate) => void;
}

export interface ShippingMethodResponse {
  shippingMethod: Partial<ShippingMethod>;
  updateWith: (walletRequestUpdate: WalletRequestUpdate) => void;
}

export interface CouponCodeResponse {
  couponCode: string;
  updateWith: (walletRequestUpdate: WalletRequestUpdate) => void;
}

export type ShippingMethods =
  | {
      carrierCode: string | null;
      cost: {
        value: number | null;
        currencyCode: string | null;
      } | null;
      description: string | null;
      displayName: string | null;
      features: string[] | null;
      maxDeliveryDate: string | null;
      minDeliveryDate: string | null;
      serviceCode: string | null;
    }[]
  | undefined;

export declare class TokenizeJs {
  constructor(businessId: string, appId: string, options?: TokenizeJsOptions);
  mount(elementId: string, document: Document, mountOptions?: TokenizeJsOptions): void;
  unmount(elementId: string, document: Document): void;
  on(eventName: 'ready', callback: (event: TokenizeJsEvent) => void): void;
  on(eventName: 'nonce', callback: (event: TokenizeJsEvent) => void): void;
  on(eventName: 'error', callback: (event: TokenizeJsEvent) => void): void;
  on(eventName: 'validated', callback: (event: TokenizeJsEvent) => void): void;
  on(eventName: 'close_wallet', callback: (event: TokenizeJsEvent) => void): void;
  on(eventName: 'payment_authorized', callback: (event: PaymentAuthorizedResponse) => void): void;
  on(eventName: 'shipping_method_change', callback: (event: ShippingMethodResponse) => void): void;
  on(eventName: 'shipping_address_change', callback: (event: ShippingAddressResponse) => void): void;
  on(eventName: 'coupon_code_change', callback: (event: CouponCodeResponse) => void): void;
  startGooglePaySession: (obj: object) => void;
  startApplePaySession: (obj: object) => void;
  abortApplePaySession: () => void;
  startPazeSession: (obj: object) => void;
  supportWalletPayments: () => Promise<{
    applePay: boolean;
    googlePay: boolean;
    paze: boolean;
  }>;
  getNonce: (request: object) => void;
}
