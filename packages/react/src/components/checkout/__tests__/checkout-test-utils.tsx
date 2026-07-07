import '@testing-library/jest-dom/vitest';
import { expect, type Mock, vi } from 'vitest';

vi.mock('@paypal/react-paypal-js', () => ({
  PayPalScriptProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  PayPalButtons: () => <button type='button'>PayPal mock</button>,
}));

import { QueryClient } from '@tanstack/react-query';
import type { RenderResult } from '@testing-library/react';
import { act, render, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Checkout, type CheckoutProps } from '@/components/checkout/checkout';
import { DeliveryMethods } from '@/components/checkout/delivery/delivery-methods';
import { checkoutQueryKeys } from '@/components/checkout/utils/query-keys';
import { GoDaddyProvider } from '@/godaddy-provider';
import * as godaddyApi from '@/lib/godaddy/godaddy';
import * as trackingModule from '@/tracking/track';
import type {
  CheckoutSession,
  DraftOrder,
  ShippingMethod,
  UpdateDraftOrderInput,
} from '@/types';
import { CheckoutType, PaymentMethodType, PaymentProvider } from '@/types';

export type OperationName =
  | 'CheckoutSession'
  | 'DraftOrder'
  | 'DraftOrderSkus'
  | 'DraftOrderShippingRates'
  | 'UpdateCheckoutSessionDraftOrder'
  | 'CalculateCheckoutSessionTaxes'
  | 'ApplyCheckoutSessionShippingMethod'
  | 'RemoveAppliedCheckoutSessionShippingMethod'
  | 'ApplyCheckoutSessionDiscount'
  | 'ApplyCheckoutSessionFulfillmentLocation'
  | 'ConfirmCheckoutSession'
  | 'TokenizeJs.getNonce'
  | 'ExchangeCheckoutToken'
  | 'RefreshCheckoutToken'
  | 'GetAddressMatches';

export interface OperationRecord {
  op: OperationName;
  input?: unknown;
  timestamp: number;
}

type DeepPartial<T> = T extends Array<infer U>
  ? Array<DeepPartial<NonNullable<U>>>
  : T extends object
    ? {
        [K in keyof T]?: DeepPartial<NonNullable<T[K]>> | Extract<T[K], null>;
      }
    : T;

export type MockGodaddyApiErrorKey =
  | 'getCheckoutSession'
  | 'exchangeCheckoutToken'
  | 'refreshCheckoutToken'
  | 'getAddressMatches'
  | 'getDraftOrder'
  | 'updateDraftOrder'
  | 'updateDraftOrderTaxes'
  | 'applyShippingMethod'
  | 'removeShippingMethod'
  | 'applyDiscount'
  | 'applyFulfillmentLocation'
  | 'confirmCheckout'
  | 'getDraftOrderShippingMethods'
  | 'getProductsFromOrderSkus';

export type MockGodaddyApiErrors = Partial<
  Record<MockGodaddyApiErrorKey, unknown>
>;

export interface WalletSupport {
  applePay?: boolean;
  googlePay?: boolean;
  paze?: boolean;
}

interface ApiState {
  session: CheckoutSession;
  draftOrder: DraftOrder;
  shippingMethods: ShippingMethod[];
  operations: OperationRecord[];
  delayMs: number;
  updateDraftOrderDelayMs: number;
  tokenNonce: string;
  tokenError?: string;
  exchangeToken: string;
  refreshToken: string;
  addressMatches: Array<Record<string, string | null>>;
  suppressTokenNonce?: boolean;
  errors: MockGodaddyApiErrors;
  oneShotErrors: Partial<Record<MockGodaddyApiErrorKey, unknown>>;
  walletSupport: WalletSupport;
  priceAdjustments: unknown[];
}

interface MockGodaddyApiOptions {
  session: CheckoutSession;
  draftOrder: DraftOrder;
  shippingMethods?: ShippingMethod[];
  delayMs?: number;
  updateDraftOrderDelayMs?: number;
  tokenNonce?: string;
  tokenError?: string;
  exchangeToken?: string;
  refreshToken?: string;
  addressMatches?: Array<Record<string, string | null>>;
  suppressTokenNonce?: boolean;
  errors?: MockGodaddyApiErrors;
  walletSupport?: WalletSupport;
}

export interface RenderCheckoutOptions {
  sessionOverrides?: DeepPartial<CheckoutSession>;
  draftOrderOverrides?: DeepPartial<DraftOrder>;
  apiOverrides?: Partial<
    Pick<
      MockGodaddyApiOptions,
      | 'shippingMethods'
      | 'delayMs'
      | 'updateDraftOrderDelayMs'
      | 'tokenNonce'
      | 'tokenError'
      | 'exchangeToken'
      | 'refreshToken'
      | 'addressMatches'
      | 'suppressTokenNonce'
      | 'errors'
      | 'walletSupport'
    >
  >;
  session?: CheckoutSession;
  draftOrder?: DraftOrder;
  queryClient?: QueryClient;
  renderSessionProp?: boolean;
  checkoutProps?: Partial<CheckoutProps>;
}

export interface RenderCheckoutResult extends RenderResult {
  user: ReturnType<typeof userEvent.setup>;
  queryClient: QueryClient;
  session: CheckoutSession;
  draftOrder: DraftOrder;
}

const baseTimestamp = Date.UTC(2026, 0, 5, 15, 0, 0);
let state: ApiState | undefined;
let tokenizeInstances: MockTokenizeJs[] = [];

function clone<T>(value: T): T {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function deepMerge<T>(base: T, patch?: DeepPartial<T>): T {
  if (!patch) return clone(base);

  if (!isPlainObject(base) || !isPlainObject(patch)) {
    return clone(patch as T);
  }

  const result: Record<string, unknown> = clone(base) as Record<
    string,
    unknown
  >;

  for (const [key, patchValue] of Object.entries(patch)) {
    if (patchValue === undefined) continue;

    if (Array.isArray(patchValue)) {
      result[key] = clone(patchValue);
      continue;
    }

    if (isPlainObject(result[key]) && isPlainObject(patchValue)) {
      result[key] = deepMerge(result[key], patchValue as never);
      continue;
    }

    result[key] = clone(patchValue);
  }

  return result as T;
}

async function maybeDelay(ms = state?.delayMs ?? 0) {
  if (ms <= 0) return;
  await new Promise(resolve => setTimeout(resolve, ms));
}

function record(op: OperationName, input?: unknown) {
  state?.operations.push({
    op,
    input: clone(input),
    timestamp: Date.now(),
  });
}

function money(value: number, currencyCode = 'USD') {
  return { value, currencyCode };
}

function base64Url(value: string) {
  return btoa(value)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function createMockJwt(
  payload: { exp?: number; [key: string]: unknown } = {}
) {
  const exp = payload.exp ?? Math.floor(Date.now() / 1000) + 300;
  return `${base64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }))}.${base64Url(
    JSON.stringify({ ...payload, exp })
  )}.signature`;
}

type DraftOrderAddress = NonNullable<
  NonNullable<DraftOrder['shipping']>['address']
>;
type DraftOrderContact = NonNullable<DraftOrder['shipping']>;
type DraftOrderLineItem = NonNullable<DraftOrder['lineItems']>[number];
type DraftOrderShippingLine = NonNullable<DraftOrder['shippingLines']>[number];
type DraftOrderDiscount = NonNullable<DraftOrder['discounts']>[number];
type CheckoutLocation = NonNullable<CheckoutSession['locations']>[number];

type MockedGodaddyApi = {
  [K in keyof typeof godaddyApi]: Mock;
};

const mockedGodaddyApi = godaddyApi as unknown as MockedGodaddyApi;

function discount(code: string): DraftOrderDiscount {
  return {
    id: `discount-${code}`,
    name: code,
    code,
    ratePercentage: null,
    appliedBeforeTax: true,
    amount: money(100),
  };
}

function defaultTotals() {
  return {
    subTotal: money(2500),
    discountTotal: money(0),
    shippingTotal: money(0),
    taxTotal: money(0),
    feeTotal: money(0),
    total: money(2500),
  };
}

export function buildShippingAddress(
  overrides: DeepPartial<DraftOrderAddress> = {}
): DraftOrderAddress {
  const base: DraftOrderAddress = {
    addressLine1: '123 Test St',
    addressLine2: '',
    addressLine3: '',
    adminArea1: 'GA',
    adminArea2: 'Jasper',
    adminArea3: '',
    adminArea4: '',
    postalCode: '30143',
    countryCode: 'US',
  };

  return deepMerge<DraftOrderAddress>(base, overrides);
}

export function buildBillingAddress(
  overrides: DeepPartial<DraftOrderAddress> = {}
): DraftOrderAddress {
  return buildShippingAddress(overrides);
}

function buildContact(
  overrides: DeepPartial<DraftOrderContact> = {}
): DraftOrderContact {
  const base: DraftOrderContact = {
    firstName: 'Jane',
    lastName: 'Buyer',
    email: 'jane@example.com',
    phone: '+12015550123',
    address: buildShippingAddress(),
  };

  return deepMerge<DraftOrderContact>(base, overrides);
}

export function buildLineItem(
  overrides: DeepPartial<DraftOrderLineItem> = {}
): DraftOrderLineItem {
  const base: DraftOrderLineItem = {
    externalId: null,
    id: `line-item-${Math.random().toString(36).slice(2, 8)}`,
    name: 'Test Product',
    productId: 'product-1',
    quantity: 1,
    status: 'ACTIVE',
    tags: [],
    type: 'SKU',
    fulfillmentMode: DeliveryMethods.SHIP,
    details: {
      sku: 'sku-1',
      productAssetUrl: null,
      selectedAddons: [],
      selectedOptions: [],
      unitOfMeasure: null,
    },
    totals: {
      subTotal: money(2500),
      discountTotal: money(0),
      feeTotal: money(0),
      taxTotal: money(0),
    },
    unitAmount: money(2500),
    discounts: [],
    fees: [],
    notes: [],
    taxes: [],
    metafields: [],
  } as unknown as DraftOrderLineItem;

  return deepMerge(base, overrides);
}

export function buildShippingRates(
  overrides: DeepPartial<ShippingMethod>[] = []
): ShippingMethod[] {
  const defaults = [
    {
      serviceCode: 'free-shipping',
      displayName: 'Free',
      description: 'Free',
      carrierCode: 'unknown',
      features: [],
      minDeliveryDate: null,
      maxDeliveryDate: null,
      cost: money(0),
    },
    {
      serviceCode: 'weight-based',
      displayName: 'Weight Based',
      description: 'Weight Based',
      carrierCode: 'unknown',
      features: [],
      minDeliveryDate: null,
      maxDeliveryDate: null,
      cost: money(100),
    },
  ] as ShippingMethod[];

  if (!overrides.length) return defaults;

  return overrides.map((override, index) =>
    deepMerge(defaults[index] ?? defaults[0], override)
  );
}

export function buildDraftOrder(
  overrides: DeepPartial<DraftOrder> = {}
): DraftOrder {
  const draftOrder: DraftOrder = {
    id: 'draft-order-1',
    customerId: 'customer-1',
    shipping: buildContact(),
    billing: buildContact(),
    notes: [],
    discounts: [],
    shippingLines: [],
    taxes: [],
    fees: [],
    statuses: {
      fulfillmentStatus: null,
      paymentStatus: null,
      status: 'CREATED',
    },
    totals: defaultTotals(),
    lineItems: [
      {
        externalId: null,
        id: 'line-item-1',
        name: 'Test Product',
        productId: 'product-1',
        quantity: 1,
        status: 'ACTIVE',
        tags: [],
        type: 'SKU',
        fulfillmentMode: DeliveryMethods.SHIP,
        details: {
          sku: 'sku-1',
          productAssetUrl: null,
          selectedAddons: [],
          selectedOptions: [],
          unitOfMeasure: null,
        },
        totals: {
          subTotal: money(2500),
          discountTotal: money(0),
          feeTotal: money(0),
          taxTotal: money(0),
        },
        unitAmount: money(2500),
        discounts: [],
        fees: [],
        notes: [],
        taxes: [],
        metafields: [],
      },
    ],
  } as unknown as DraftOrder;

  return deepMerge(draftOrder, overrides);
}

export function buildPickupLocation(
  overrides: DeepPartial<CheckoutLocation> = {}
): CheckoutLocation {
  const base: CheckoutLocation = {
    id: 'location-1',
    isDefault: true,
    address: {
      addressLine1: '599 Stegall Dr',
      addressLine2: '',
      addressLine3: '',
      adminArea1: 'GA',
      adminArea2: 'Jasper',
      adminArea3: 'Jasper Store',
      adminArea4: '',
      postalCode: '30143',
      countryCode: 'US',
    },
    operatingHours: {
      timeZone: 'America/New_York',
      leadTime: 30,
      pickupWindowInDays: 0,
      pickupMode: null,
      pickupSlotInterval: 30,
      hours: {
        sunday: { enabled: true, openTime: '09:00', closeTime: '17:00' },
        monday: { enabled: true, openTime: '09:00', closeTime: '17:00' },
        tuesday: { enabled: true, openTime: '09:00', closeTime: '17:00' },
        wednesday: { enabled: true, openTime: '09:00', closeTime: '17:00' },
        thursday: { enabled: true, openTime: '09:00', closeTime: '17:00' },
        friday: { enabled: true, openTime: '09:00', closeTime: '17:00' },
        saturday: { enabled: true, openTime: '09:00', closeTime: '17:00' },
      },
    },
  };

  return deepMerge<CheckoutLocation>(base, overrides);
}

export function buildCheckoutSession(
  overrides: DeepPartial<CheckoutSession> & { draftOrder?: DraftOrder } = {}
): CheckoutSession {
  const draftOrder = overrides.draftOrder
    ? (overrides.draftOrder as DraftOrder)
    : buildDraftOrder();

  const session = {
    id: 'checkout-session-1',
    token: 'session-token-1',
    channelId: 'channel-1',
    storeId: 'store-1',
    storeName: 'Test Store',
    businessId: 'business-1',
    customerId: 'customer-1',
    successUrl: undefined,
    returnUrl: undefined,
    enableShipping: true,
    enableLocalPickup: true,
    enableShippingAddressCollection: true,
    enableBillingAddressCollection: true,
    enablePhoneCollection: true,
    enableTaxCollection: true,
    enableNotesCollection: true,
    enablePromotionCodes: true,
    enableTips: false,
    enableAddressAutocomplete: false,
    shipping: {
      originAddress: {
        addressLine1: '1 Origin Way',
        addressLine2: '',
        addressLine3: '',
        adminArea1: 'GA',
        adminArea2: 'Jasper',
        adminArea3: '',
        adminArea4: '',
        postalCode: '30143',
        countryCode: 'US',
      },
    },
    paymentMethods: {
      card: {
        type: PaymentMethodType.CREDIT_CARD,
        processor: PaymentProvider.STRIPE,
        checkoutTypes: [CheckoutType.STANDARD],
      },
    },
    defaultOperatingHours: buildPickupLocation().operatingHours,
    locations: [buildPickupLocation()],
    draftOrder,
    experimental_rules: {
      gopay_override: {
        enabled: true,
        goPayAppId: 'test-app-id',
      },
    },
  } as unknown as CheckoutSession;

  return deepMerge(session, overrides);
}

function recalculateTotal(draftOrder: DraftOrder): DraftOrder {
  const totals = draftOrder.totals ?? defaultTotals();
  const subtotal = totals.subTotal?.value ?? 0;
  const shipping = totals.shippingTotal?.value ?? 0;
  const discountTotal = totals.discountTotal?.value ?? 0;
  const tax = totals.taxTotal?.value ?? 0;
  const fee = totals.feeTotal?.value ?? 0;

  return {
    ...draftOrder,
    totals: {
      subTotal: totals.subTotal ?? money(0),
      discountTotal: totals.discountTotal ?? money(0),
      shippingTotal: totals.shippingTotal ?? money(0),
      taxTotal: totals.taxTotal ?? money(0),
      feeTotal: totals.feeTotal ?? money(0),
      total: money(
        Math.max(0, subtotal + shipping + tax + fee - discountTotal)
      ),
    },
  };
}

function mergeDraftOrderPatch(input: Record<string, unknown>) {
  if (!state) return;

  const { context: _context, customerId: _customerId, ...patch } = input;
  state.draftOrder = recalculateTotal(
    deepMerge(state.draftOrder, patch as DeepPartial<DraftOrder>)
  );
  state.session = { ...state.session, draftOrder: state.draftOrder };
}

function makeDraftOrderResponse() {
  if (!state) throw new Error('mockGodaddyApi must be called first');
  return {
    checkoutSession: {
      ...state.session,
      draftOrder: state.draftOrder,
    },
  };
}

function applyShippingLines(shippingMethods: unknown) {
  if (!state || !Array.isArray(shippingMethods)) return;

  const shippingLines: DraftOrderShippingLine[] = shippingMethods.map(
    method => {
      const typedMethod = method as {
        requestedService?: string | null;
        requestedProvider?: string | null;
        name?: string | null;
        subTotal?: {
          value?: number | null;
          currencyCode?: string | null;
        } | null;
      };

      return {
        id: `shipping-line-${typedMethod.requestedService ?? 'unknown'}`,
        requestedService: typedMethod.requestedService ?? '',
        requestedProvider: typedMethod.requestedProvider ?? '',
        name: typedMethod.name ?? '',
        amount: money(
          typedMethod.subTotal?.value ?? 0,
          typedMethod.subTotal?.currencyCode ?? 'USD'
        ),
        discounts: [],
      };
    }
  );

  const shippingTotal = money(
    shippingLines.reduce((sum, line) => sum + (line.amount?.value ?? 0), 0)
  );

  state.draftOrder = recalculateTotal({
    ...state.draftOrder,
    shippingLines,
    totals: {
      ...(state.draftOrder.totals ?? defaultTotals()),
      shippingTotal,
    },
    lineItems:
      state.draftOrder.lineItems?.map(lineItem => ({
        ...lineItem,
        fulfillmentMode: DeliveryMethods.SHIP,
      })) ?? [],
  });
  state.session = { ...state.session, draftOrder: state.draftOrder };
}

function applyDiscountCodes(discountCodes: string[]) {
  if (!state) return;
  const discounts = discountCodes.map(code => discount(code));
  const discountTotal = money(discountCodes.length * 100);
  state.draftOrder = recalculateTotal({
    ...state.draftOrder,
    discounts,
    totals: {
      ...(state.draftOrder.totals ?? defaultTotals()),
      discountTotal,
    },
  });
  state.session = { ...state.session, draftOrder: state.draftOrder };
}

function calculateTaxes() {
  if (!state) return money(0);
  const taxTotal = money(200);
  state.draftOrder = recalculateTotal({
    ...state.draftOrder,
    totals: {
      ...(state.draftOrder.totals ?? defaultTotals()),
      taxTotal,
    },
  });
  state.session = { ...state.session, draftOrder: state.draftOrder };
  return taxTotal;
}

function applyFulfillmentLocation(fulfillmentLocationId?: string | null) {
  if (!state || !fulfillmentLocationId) return;
  state.draftOrder = {
    ...state.draftOrder,
    lineItems:
      state.draftOrder.lineItems?.map(lineItem => ({
        ...lineItem,
        fulfillmentMode: DeliveryMethods.PICKUP,
      })) ?? [],
    shippingLines: [],
  };
  state.session = { ...state.session, draftOrder: state.draftOrder };
}

function maybeThrow(key: MockGodaddyApiErrorKey) {
  // One-shot errors fire once and clear themselves.
  if (state?.oneShotErrors && key in state.oneShotErrors) {
    const err = state.oneShotErrors[key];
    delete state.oneShotErrors[key];
    if (err) {
      if (err instanceof Error) throw err;
      throw new Error(typeof err === 'string' ? err : `Mock error: ${key}`);
    }
  }
  const err = state?.errors?.[key];
  if (!err) return;
  if (err instanceof Error) throw err;
  throw new Error(typeof err === 'string' ? err : `Mock error: ${key}`);
}

export function mockGodaddyApi(options: MockGodaddyApiOptions) {
  state = {
    session: options.session,
    draftOrder: options.draftOrder,
    shippingMethods: options.shippingMethods ?? buildShippingRates(),
    operations: [],
    delayMs: options.delayMs ?? 0,
    updateDraftOrderDelayMs: options.updateDraftOrderDelayMs ?? 0,
    tokenNonce: options.tokenNonce ?? 'test-nonce',
    tokenError: options.tokenError,
    exchangeToken: options.exchangeToken ?? '',
    refreshToken: options.refreshToken ?? createMockJwt(),
    addressMatches: options.addressMatches ?? [],
    suppressTokenNonce: options.suppressTokenNonce,
    errors: { ...(options.errors ?? {}) },
    oneShotErrors: {},
    walletSupport: { ...(options.walletSupport ?? {}) },
    priceAdjustments: [],
  };

  mockedGodaddyApi.exchangeCheckoutToken.mockImplementation(async input => {
    record('ExchangeCheckoutToken', input);
    await maybeDelay();
    maybeThrow('exchangeCheckoutToken');
    return { jwt: state?.exchangeToken ?? '', expiresAt: '', expiresIn: 300 };
  });

  mockedGodaddyApi.refreshCheckoutToken.mockImplementation(
    async accessToken => {
      record('RefreshCheckoutToken', { accessToken });
      await maybeDelay();
      maybeThrow('refreshCheckoutToken');
      return { jwt: state?.refreshToken ?? '', expiresAt: '', expiresIn: 300 };
    }
  );

  mockedGodaddyApi.getCheckoutSession.mockImplementation(async auth => {
    record('CheckoutSession', auth);
    await maybeDelay();
    maybeThrow('getCheckoutSession');
    return state?.session;
  });

  mockedGodaddyApi.getAddressMatches.mockImplementation(async input => {
    record('GetAddressMatches', input);
    await maybeDelay();
    maybeThrow('getAddressMatches');
    return {
      checkoutSession: {
        addresses: state?.addressMatches ?? [],
      },
    };
  });

  mockedGodaddyApi.getDraftOrder.mockImplementation(async () => {
    record('DraftOrder');
    await maybeDelay();
    maybeThrow('getDraftOrder');
    return makeDraftOrderResponse();
  });

  mockedGodaddyApi.getProductsFromOrderSkus.mockImplementation(async () => {
    record('DraftOrderSkus');
    await maybeDelay();
    maybeThrow('getProductsFromOrderSkus');
    return {
      checkoutSession: {
        id: state?.session.id ?? 'checkout-session-1',
        skus: {
          edges: [
            {
              node: {
                id: 'sku-node-1',
                code: 'sku-1',
                label: 'Test Product',
                name: 'Test Product',
                description: null,
                status: 'ACTIVE',
                weight: null,
                unitOfWeight: null,
                disableShipping: null,
                htmlDescription: null,
                prices: [],
                attributes: [],
                attributeValues: [],
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
        },
      },
    };
  });

  mockedGodaddyApi.getDraftOrderShippingMethods.mockImplementation(
    async (_sessionOrAuth, destination) => {
      record('DraftOrderShippingRates', { destination });
      await maybeDelay();
      maybeThrow('getDraftOrderShippingMethods');
      return {
        checkoutSession: {
          id: state?.session.id ?? 'checkout-session-1',
          storeId: state?.session.storeId ?? 'store-1',
          draftOrder: {
            id: state?.draftOrder.id ?? null,
            calculatedShippingRates: {
              rates: state?.shippingMethods ?? [],
            },
          },
        },
      };
    }
  );

  mockedGodaddyApi.updateDraftOrder.mockImplementation(async input => {
    record('UpdateCheckoutSessionDraftOrder', input);
    await maybeDelay(state?.updateDraftOrderDelayMs ?? state?.delayMs ?? 0);
    maybeThrow('updateDraftOrder');
    mergeDraftOrderPatch(input as Record<string, unknown>);
    return {
      updateCheckoutSessionDraftOrder: {
        id: state?.draftOrder.id ?? null,
        totals: state?.draftOrder.totals ?? null,
      },
    };
  });

  mockedGodaddyApi.updateDraftOrderTaxes.mockImplementation(
    async (_sessionOrAuth, destination) => {
      record('CalculateCheckoutSessionTaxes', { destination });
      await maybeDelay();
      maybeThrow('updateDraftOrderTaxes');
      const totalTaxAmount = calculateTaxes();
      return {
        calculateCheckoutSessionTaxes: {
          totalTaxAmount,
          draftOrder: state?.draftOrder,
        },
      };
    }
  );

  mockedGodaddyApi.applyShippingMethod.mockImplementation(
    async shippingMethods => {
      record('ApplyCheckoutSessionShippingMethod', shippingMethods);
      await maybeDelay();
      maybeThrow('applyShippingMethod');
      applyShippingLines(shippingMethods);
      return {
        applyCheckoutSessionShippingMethod: {
          draftOrder: state?.draftOrder,
        },
      };
    }
  );

  mockedGodaddyApi.removeShippingMethod.mockImplementation(async input => {
    record('RemoveAppliedCheckoutSessionShippingMethod', input);
    await maybeDelay();
    maybeThrow('removeShippingMethod');
    if (state) {
      state.draftOrder = recalculateTotal({
        ...state.draftOrder,
        shippingLines: [],
        totals: {
          ...(state.draftOrder.totals ?? defaultTotals()),
          shippingTotal: money(0),
        },
      });
      state.session = { ...state.session, draftOrder: state.draftOrder };
    }
    return {
      removeAppliedCheckoutSessionShippingMethod: {
        draftOrder: state?.draftOrder,
      },
    };
  });

  mockedGodaddyApi.applyDiscount.mockImplementation(async discountCodes => {
    record('ApplyCheckoutSessionDiscount', { discountCodes });
    await maybeDelay();
    maybeThrow('applyDiscount');
    applyDiscountCodes([...(discountCodes ?? [])]);
    return {
      applyCheckoutSessionDiscount: {
        ...state?.draftOrder,
        totals: state?.draftOrder.totals,
        discounts: state?.draftOrder.discounts,
        lineItems: state?.draftOrder.lineItems,
        shippingLines: state?.draftOrder.shippingLines,
      },
    };
  });

  mockedGodaddyApi.applyFulfillmentLocation.mockImplementation(async input => {
    record('ApplyCheckoutSessionFulfillmentLocation', input);
    await maybeDelay();
    maybeThrow('applyFulfillmentLocation');
    applyFulfillmentLocation(input?.fulfillmentLocationId);
    return {
      applyCheckoutSessionFulfillmentLocation: {
        draftOrder: state?.draftOrder,
      },
    };
  });

  // getDraftOrderPriceAdjustments is only invoked by the express-checkout
  // buttons (which are mocked inert in checkout-test-env). We still wire a
  // default to keep the mock surface symmetric and to support targeted unit
  // tests that may invoke it directly.
  if (
    typeof (mockedGodaddyApi as Record<string, unknown>)
      .getDraftOrderPriceAdjustments === 'function'
  ) {
    (
      mockedGodaddyApi as unknown as {
        getDraftOrderPriceAdjustments: Mock;
      }
    ).getDraftOrderPriceAdjustments.mockImplementation(async () => {
      return {
        checkoutSession: {
          draftOrder: {
            calculatedAdjustments: {
              adjustments: state?.priceAdjustments ?? [],
            },
          },
        },
      };
    });
  }

  mockedGodaddyApi.confirmCheckout.mockImplementation(async input => {
    record('ConfirmCheckoutSession', input);
    await maybeDelay();
    maybeThrow('confirmCheckout');
    return {
      confirmCheckoutSession: {
        status: 'COMPLETED',
      },
    };
  });

  return state;
}

export function setApiError(key: MockGodaddyApiErrorKey, error: unknown) {
  if (!state) throw new Error('mockGodaddyApi must be called first');
  state.errors[key] = error;
}

export function clearApiError(key: MockGodaddyApiErrorKey) {
  if (!state) return;
  delete state.errors[key];
}

/**
 * Make the next call to the mocked operation matching `key` throw `error`,
 * then clear itself so subsequent calls succeed normally.
 *
 * `key` is the API key form (matches `setApiError`/`MockGodaddyApiErrorKey`),
 * e.g. `'updateDraftOrder'`, `'applyShippingMethod'`, `'applyDiscount'`.
 */
export function setApiErrorOnce(
  key: MockGodaddyApiErrorKey,
  error: unknown = new Error(`Mock one-shot error: ${key}`)
) {
  if (!state) throw new Error('mockGodaddyApi must be called first');
  state.oneShotErrors[key] = error;
}

/**
 * Set the next refetch's `feeTotal` on the current draft order. Recalculates
 * the order total to keep the totals consistent.
 */
export function setFeeTotal(value: number, currencyCode = 'USD') {
  if (!state) throw new Error('mockGodaddyApi must be called first');
  state.draftOrder = recalculateTotal({
    ...state.draftOrder,
    totals: {
      ...(state.draftOrder.totals ?? defaultTotals()),
      feeTotal: { value, currencyCode },
    },
  });
  state.session = { ...state.session, draftOrder: state.draftOrder };
}

/**
 * Replace the mock `getDraftOrderPriceAdjustments` response. By default the
 * mock returns an empty list of adjustments.
 */
export function setPriceAdjustments(adjustments: unknown[]) {
  if (!state) throw new Error('mockGodaddyApi must be called first');
  state.priceAdjustments = adjustments;
}

export function getOperations(op?: OperationName) {
  const operations = state?.operations ?? [];
  return op ? operations.filter(operation => operation.op === op) : operations;
}

export function getOperationNames() {
  return getOperations().map(operation => operation.op);
}

/**
 * Return the index of the first occurrence of each named operation in the
 * order they appear in the operations log. If a name is not present, its
 * entry in the result is `-1`.
 *
 * Useful for asserting relative ordering of recorded operations without
 * brittle `.indexOf` chains in tests.
 */
export function getOperationOrder(names: OperationName[]): number[] {
  const log = getOperationNames();
  return names.map(name => log.indexOf(name));
}

export function clearOperations() {
  if (state) state.operations = [];
}

export function getCurrentDraftOrder() {
  return state?.draftOrder;
}

export function setCurrentDraftOrder(draftOrder: DraftOrder) {
  if (!state) throw new Error('mockGodaddyApi must be called first');
  state.draftOrder = draftOrder;
  state.session = { ...state.session, draftOrder };
}

export function buildDraftOrderUpdate(
  input: Omit<UpdateDraftOrderInput['input'], 'context'>,
  session = state?.session
): UpdateDraftOrderInput['input'] {
  if (!session) throw new Error('mockGodaddyApi must be called first');

  return {
    ...input,
    context: {
      channelId: session.channelId ?? 'channel-1',
      storeId: session.storeId ?? 'store-1',
    },
  };
}

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: Number.POSITIVE_INFINITY,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export async function advanceCheckoutDebounce(ms = 1200) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
  await flushPromises();
}

export async function flushPromises() {
  await act(async () => {
    await Promise.resolve();
  });
}

export async function waitForCheckoutReady() {
  await waitFor(
    () => {
      expect(document.body).toHaveTextContent('Contact');
      expect(document.body).toHaveTextContent('Payment');
    },
    { timeout: 5000 }
  );
  await flushPromises();
}

export async function waitForCheckoutIdle() {
  await waitFor(
    () => {
      expect(
        getOperations().filter(operation =>
          [
            'DraftOrder',
            'DraftOrderSkus',
            'DraftOrderShippingRates',
            'ApplyCheckoutSessionShippingMethod',
            'CalculateCheckoutSessionTaxes',
            'ApplyCheckoutSessionFulfillmentLocation',
          ].includes(operation.op)
        ).length
      ).toBeGreaterThanOrEqual(0);
      expect(
        document.querySelectorAll('button[disabled], input[disabled]').length
      ).toBe(0);
    },
    { timeout: 5000 }
  );
}

export async function waitForOperation(
  op: OperationName,
  count = 1,
  timeout = 3000
) {
  await waitFor(
    () => {
      expect(getOperations(op).length).toBeGreaterThanOrEqual(count);
    },
    { timeout }
  );
}

interface MockWindowLocationHandle {
  href: string;
  search: string;
  pathname: string;
  hash: string;
  origin: string;
  restore: () => void;
  setSearch: (search: string) => void;
}

let activeLocationMock: MockWindowLocationHandle | undefined;

export function mockWindowLocation(
  initial: {
    href?: string;
    search?: string;
    pathname?: string;
    hash?: string;
  } = {}
): MockWindowLocationHandle {
  if (activeLocationMock) {
    activeLocationMock.restore();
  }

  const originalLocation = window.location;
  const handle: MockWindowLocationHandle = {
    href: initial.href ?? 'https://test.example/checkout',
    search: initial.search ?? '',
    pathname: initial.pathname ?? '/checkout',
    hash: initial.hash ?? '',
    origin: 'https://test.example',
    restore: () => {
      Object.defineProperty(window, 'location', {
        configurable: true,
        writable: true,
        value: originalLocation,
      });
      activeLocationMock = undefined;
    },
    setSearch: (search: string) => {
      handle.search = search;
    },
  };

  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: {
      get href() {
        return handle.href;
      },
      set href(value: string) {
        handle.href = value;
      },
      get search() {
        return handle.search;
      },
      set search(value: string) {
        handle.search = value;
      },
      get pathname() {
        return handle.pathname;
      },
      get hash() {
        return handle.hash;
      },
      set hash(value: string) {
        handle.hash = value;
      },
      get origin() {
        return handle.origin;
      },
      assign: (value: string) => {
        handle.href = value;
      },
      replace: (value: string) => {
        handle.href = value;
      },
      reload: () => undefined,
      toString: () => handle.href,
    },
  });

  activeLocationMock = handle;
  return handle;
}

export function getMockedLocation() {
  return activeLocationMock;
}

export function setCheckoutUrl({
  pathname = '/checkout/checkout-session-1',
  search = '',
  hash = '',
}: {
  pathname?: string;
  search?: string;
  hash?: string;
} = {}) {
  const normalizedSearch =
    search && !search.startsWith('?') ? `?${search}` : search;
  const normalizedHash = hash && !hash.startsWith('#') ? `#${hash}` : hash;
  window.history.pushState(
    {},
    '',
    `${pathname}${normalizedSearch}${normalizedHash}`
  );
  return window.location;
}

export function seedCheckoutSessionStorage({
  jwt,
  sessionId,
}: {
  jwt?: string;
  sessionId?: string;
}) {
  if (jwt !== undefined) {
    window.sessionStorage.setItem('godaddy-checkout-jwt', JSON.stringify(jwt));
  }
  if (sessionId !== undefined) {
    window.sessionStorage.setItem(
      'godaddy-checkout-session-id',
      JSON.stringify(sessionId)
    );
  }
}

export function restoreWindowLocation() {
  activeLocationMock?.restore();
}

export function setupCheckoutTestGlobals() {
  vi.setSystemTime(baseTimestamp);
  window.sessionStorage.clear();
  window.history.pushState({}, '', '/');
  document.documentElement.className = '';
  document.documentElement.removeAttribute('style');
  tokenizeInstances = [];

  vi.stubGlobal('TokenizeJs', MockTokenizeJs);
  const scripts = Array.from(document.querySelectorAll('script'));
  for (const script of scripts) {
    act(() => {
      script.onload?.(new Event('load'));
    });
  }
  const originalAppendChild = document.body.appendChild.bind(document.body);
  vi.spyOn(document.body, 'appendChild').mockImplementation(node => {
    const appended = originalAppendChild(node);
    if (node instanceof HTMLScriptElement) {
      setTimeout(() => {
        act(() => {
          node.onload?.(new Event('load'));
        });
      }, 0);
    }
    return appended;
  });

  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn();
  } else {
    vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(
      () => undefined
    );
  }

  // Polyfill PointerEvent capture API used by Radix UI primitives. jsdom
  // does not implement these methods, which causes Radix Select / Popover
  // pointer-down handlers to throw and abort interactions during tests.
  type PointerCapableElement = Element & {
    hasPointerCapture: (pointerId: number) => boolean;
    setPointerCapture: (pointerId: number) => void;
    releasePointerCapture: (pointerId: number) => void;
  };
  const proto = Element.prototype as unknown as PointerCapableElement;
  if (typeof proto.hasPointerCapture !== 'function') {
    proto.hasPointerCapture = () => false;
  }
  if (typeof proto.setPointerCapture !== 'function') {
    proto.setPointerCapture = () => undefined;
  }
  if (typeof proto.releasePointerCapture !== 'function') {
    proto.releasePointerCapture = () => undefined;
  }

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  class ResizeObserverMock {
    observe() {
      return undefined;
    }
    unobserve() {
      return undefined;
    }
    disconnect() {
      return undefined;
    }
  }

  class IntersectionObserverMock {
    observe() {
      return undefined;
    }
    unobserve() {
      return undefined;
    }
    disconnect() {
      return undefined;
    }
    takeRecords() {
      return [];
    }
  }

  vi.stubGlobal('ResizeObserver', ResizeObserverMock);
  vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
}

export class MockTokenizeJs {
  handlers = new Map<string, (event: unknown) => void>();

  constructor() {
    tokenizeInstances.push(this);
  }

  mount() {
    setTimeout(() => {
      act(() => {
        this.handlers.get('ready')?.({});
      });
    }, 0);
  }

  unmount() {
    return undefined;
  }

  on(eventName: string, callback: (event: unknown) => void) {
    this.handlers.set(eventName, callback);
  }

  getNonce(request?: object) {
    record('TokenizeJs.getNonce', request);

    if (state?.tokenError) {
      act(() => {
        this.handlers.get('error')?.({
          data: { error: { message: state?.tokenError } },
        });
      });
      return;
    }

    if (state?.suppressTokenNonce) return;

    act(() => {
      this.handlers.get('nonce')?.({
        data: { nonce: state?.tokenNonce ?? 'test-nonce' },
      });
    });
  }

  supportWalletPayments() {
    const support = state?.walletSupport ?? {};
    return Promise.resolve({
      applePay: support.applePay ?? false,
      googlePay: support.googlePay ?? false,
      paze: support.paze ?? false,
    });
  }
}

export function getLastTokenizeInstance() {
  return tokenizeInstances.at(-1);
}

export function getTokenizeInstances() {
  return tokenizeInstances;
}

export function renderCheckout({
  sessionOverrides,
  draftOrderOverrides,
  apiOverrides,
  session: providedSession,
  draftOrder: providedDraftOrder,
  queryClient = createTestQueryClient(),
  renderSessionProp = true,
  checkoutProps,
}: RenderCheckoutOptions = {}): RenderCheckoutResult {
  const draftOrder = providedDraftOrder ?? buildDraftOrder(draftOrderOverrides);
  const session =
    providedSession ??
    buildCheckoutSession({
      ...(sessionOverrides ?? {}),
      draftOrder,
    });

  mockGodaddyApi({
    session,
    draftOrder,
    ...apiOverrides,
  });

  queryClient.setQueryDefaults(checkoutQueryKeys.draftOrder(session.id), {
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: Number.POSITIVE_INFINITY,
  });
  queryClient.setQueryData(checkoutQueryKeys.draftOrder(session.id), {
    checkoutSession: {
      ...session,
      draftOrder,
    },
  });
  if (!apiOverrides?.errors?.getProductsFromOrderSkus) {
    queryClient.setQueryData(checkoutQueryKeys.draftOrderProducts(session.id), {
      checkoutSession: {
        skus: {
          edges: [
            {
              node: {
                code: 'sku-1',
                label: 'Test Product',
                name: 'Test Product',
                attributes: [],
                attributeValues: [],
              },
            },
          ],
        },
      },
    });
  }
  const shippingDestination = draftOrder.shipping?.address;
  if (shippingDestination?.addressLine1) {
    queryClient.setQueryData(
      [
        ...checkoutQueryKeys.draftOrderShippingMethods(session.id),
        {
          addressLine1: shippingDestination.addressLine1,
          adminArea1: shippingDestination.adminArea1,
          adminArea2: shippingDestination.adminArea2,
          postalCode: shippingDestination.postalCode,
          countryCode: shippingDestination.countryCode,
        },
      ],
      {
        checkoutSession: {
          draftOrder: {
            calculatedShippingRates: {
              rates: apiOverrides?.shippingMethods ?? buildShippingRates(),
            },
          },
        },
      }
    );
  }

  const user = userEvent.setup({
    advanceTimers: vi.advanceTimersByTime,
  });

  const result = render(
    <GoDaddyProvider
      queryClient={queryClient}
      apiHost='api.godaddy.test'
      clientId='client-1'
      storeId={session.storeId ?? undefined}
      channelId={session.channelId ?? undefined}
    >
      <Checkout
        session={renderSessionProp ? session : undefined}
        godaddyPaymentsConfig={{
          businessId: 'business-1',
          appId: 'test-app-id',
        }}
        {...checkoutProps}
      />
    </GoDaddyProvider>
  );

  return {
    user,
    queryClient,
    session,
    draftOrder,
    ...result,
  };
}

export function renderCheckoutWithProps(
  checkoutProps: Partial<CheckoutProps>,
  options: Omit<RenderCheckoutOptions, 'checkoutProps'> = {}
): RenderCheckoutResult {
  return renderCheckout({ ...options, checkoutProps });
}

export function getTextbox(name: RegExp | string) {
  return document.body.querySelector<HTMLInputElement>(
    `input[placeholder="${name}"]`
  );
}

export async function typeIntoPlaceholder(
  user: ReturnType<typeof userEvent.setup>,
  placeholder: string | RegExp,
  value: string
) {
  const field = await within(document.body).findByPlaceholderText(placeholder);
  await user.clear(field);
  if (value) {
    await user.type(field, value);
  }
  return field;
}

export async function fillShippingAddress(
  user: ReturnType<typeof userEvent.setup>,
  values: {
    firstName?: string;
    lastName?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    phone?: string;
  } = {}
) {
  const defaults = {
    firstName: 'Ship',
    lastName: 'Buyer',
    addressLine1: '456 Shipping Ln',
    addressLine2: 'Unit 7',
    city: 'Jasper',
    state: 'GA',
    postalCode: '30143',
    phone: '(201) 555-1234',
    ...values,
  };

  await typeIntoNamedField(user, 'shippingFirstName', defaults.firstName);
  await typeIntoNamedField(user, 'shippingLastName', defaults.lastName);
  await typeIntoNamedField(user, 'shippingAddressLine1', defaults.addressLine1);
  await typeIntoNamedField(user, 'shippingAddressLine2', defaults.addressLine2);
  await typeIntoNamedField(user, 'shippingAdminArea2', defaults.city);
  await typeIntoNamedField(user, 'shippingPostalCode', defaults.postalCode);
}

export async function typeIntoNamedField(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
  value: string
) {
  const field = await waitFor(() => {
    const input = document.querySelector<HTMLInputElement>(
      `input[name="${name}"]`
    );
    expect(input).toBeTruthy();
    return input as HTMLInputElement;
  });
  await user.clear(field);
  if (value) {
    await user.type(field, value);
  }
  return field;
}

export function getNamedInput(name: string) {
  const field = document.querySelector<HTMLInputElement>(
    `input[name="${name}"]`
  );
  if (!field) throw new Error(`Could not find input named ${name}`);
  return field;
}

// ----------------------------------------------------------------------------
// Tracking helpers
// ----------------------------------------------------------------------------
//
// Tests assert that the right `track({ eventId, type, properties })` calls
// fire from checkout components. To keep wiring consistent across files, the
// pattern is:
//
//   vi.mock('@/tracking/track', async (importOriginal) => {
//     const actual = await importOriginal<typeof import('@/tracking/track')>();
//     return { ...actual, track: vi.fn() };
//   });
//
//   const tracking = mockTrack();
//   beforeEach(() => tracking.clearTrackedEvents());
//
// `mockTrack()` returns helpers that read from the now-mocked `track` fn.

interface TrackedEvent {
  eventId: string;
  type?: string;
  properties?: Record<string, unknown>;
}

type TrackPropsMatcher =
  | Record<string, unknown>
  | ((props: Record<string, unknown> | undefined) => boolean);

export interface MockTrackHandle {
  /** Filter recorded tracking events, optionally by event id (suffix-matched). */
  getTrackedEvents: (eventId?: string) => TrackedEvent[];
  /** Clear the recorded events log. */
  clearTrackedEvents: () => void;
  /**
   * Assert at least one recorded event matches `eventId` and the optional
   * matcher. `eventId` matches if the recorded id ends with the given value
   * (so callers can pass `eventIds.checkoutStart` directly without worrying
   * about the `godaddy.checkout.` prefix that `track()` may prepend).
   */
  expectTracked: (eventId: string, propsMatcher?: TrackPropsMatcher) => void;
}

function matchesEventId(recordedId: string, expected: string) {
  return recordedId === expected || recordedId.endsWith(`.${expected}`);
}

function matchesProps(
  recorded: Record<string, unknown> | undefined,
  matcher: TrackPropsMatcher | undefined
): boolean {
  if (matcher === undefined) return true;
  if (typeof matcher === 'function') return matcher(recorded);
  for (const [key, expectedValue] of Object.entries(matcher)) {
    const actualValue = recorded?.[key];
    try {
      expect(actualValue).toEqual(expectedValue);
    } catch {
      return false;
    }
  }
  return true;
}

/**
 * Returns helpers backed by the mocked `@/tracking/track`. The caller is
 * responsible for hoisting the `vi.mock('@/tracking/track', …)` call at the
 * top of their test file (see comment above for the canonical snippet).
 */
export function mockTrack(): MockTrackHandle {
  const trackFn = (trackingModule as { track: unknown }).track as Mock;
  if (!trackFn || typeof (trackFn as Mock).mock?.calls === 'undefined') {
    throw new Error(
      'mockTrack: `@/tracking/track` does not appear to be mocked. ' +
        'Add `vi.mock("@/tracking/track", ...)` at the top of your test file.'
    );
  }

  function readEvents(): TrackedEvent[] {
    return trackFn.mock.calls.map(([arg]: [TrackedEvent]) => arg);
  }

  return {
    getTrackedEvents(eventId?: string) {
      const events = readEvents();
      if (!eventId) return events;
      return events.filter(event => matchesEventId(event.eventId, eventId));
    },
    clearTrackedEvents() {
      trackFn.mockClear();
    },
    expectTracked(eventId, propsMatcher) {
      const events = readEvents().filter(event =>
        matchesEventId(event.eventId, eventId)
      );
      const match = events.find(event =>
        matchesProps(event.properties, propsMatcher)
      );
      if (!match) {
        const summary = events.map(event => ({
          eventId: event.eventId,
          type: event.type,
          properties: event.properties,
        }));
        throw new Error(
          `expectTracked: no event matching "${eventId}" with the given props matcher.\n` +
            `Recorded events for that id:\n${JSON.stringify(summary, null, 2)}`
        );
      }
    },
  };
}

export async function refetchDraftOrder(
  queryClient: QueryClient,
  sessionId: string
) {
  await act(async () => {
    await queryClient.invalidateQueries({
      queryKey: checkoutQueryKeys.draftOrder(sessionId),
    });
  });
}
