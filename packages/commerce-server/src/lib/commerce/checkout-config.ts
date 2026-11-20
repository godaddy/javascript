import type { CheckoutSessionPaymentMethodsInput } from './checkout-subgraph';
import { type CommerceLogger, type CommerceWarningLogContext, consoleCommerceLogger } from './commerce-route';

/** Shipping options accepted by the hosted checkout API. Omit to use the store's configuration. */
export interface CommerceCheckoutShippingConfiguration {
  readonly originAddress?: Readonly<Record<string, unknown>>;
  readonly fulfillmentLocationId?: string;
}

export interface CommerceCheckoutConfiguration {
  readonly enablePromotionCodes: boolean;
  readonly enableTaxCollection: boolean;
  readonly enableShipping: boolean;
  readonly shipping?: CommerceCheckoutShippingConfiguration;
  readonly paymentMethods?: CheckoutSessionPaymentMethodsInput;
}

const PAYMENT_METHOD_NAMES = new Set<keyof CheckoutSessionPaymentMethodsInput>([
  'ach',
  'applePay',
  'card',
  'ccavenue',
  'express',
  'googlePay',
  'mercadopago',
  'offline',
  'paypal',
  'paze',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function invalidPaymentMethods(logger: CommerceLogger): undefined {
  const message =
    'commerce-server: Invalid paymentMethods configuration; falling back to standard GoDaddy card payments. Check method names, processor, checkoutTypes, and unsupported fields.';
  const context: CommerceWarningLogContext = {
    code: 'invalid_checkout_payment_methods',
    fallback: 'standard_godaddy_card',
  };
  try {
    if (logger.warn) {
      logger.warn(message, context);
      return undefined;
    }
  } catch {
    // A host logger failure must not prevent checkout or expose its error/configuration values.
    consoleCommerceLogger.warn?.(message, context);
    return undefined;
  }
  consoleCommerceLogger.warn?.(message, context);
  return undefined;
}

/** Shared validation for environment and host settings; at least one method must be enabled. */
export function parseCheckoutPaymentMethods(
  value: unknown,
  logger: CommerceLogger = consoleCommerceLogger,
): CheckoutSessionPaymentMethodsInput | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value) || Object.keys(value).length === 0) return invalidPaymentMethods(logger);
  let hasEnabledMethod = false;
  for (const [name, method] of Object.entries(value)) {
    if (!PAYMENT_METHOD_NAMES.has(name as keyof CheckoutSessionPaymentMethodsInput))
      return invalidPaymentMethods(logger);
    if (method === null) continue;
    if (
      !isRecord(method) ||
      Object.keys(method).some((key) => key !== 'processor' && key !== 'checkoutTypes')
    ) {
      return invalidPaymentMethods(logger);
    }
    if (
      typeof method.processor !== 'string' ||
      !method.processor ||
      method.processor !== method.processor.trim()
    ) {
      return invalidPaymentMethods(logger);
    }
    if (
      !Array.isArray(method.checkoutTypes) ||
      method.checkoutTypes.length === 0 ||
      !method.checkoutTypes.every(
        (type: unknown) => typeof type === 'string' && type !== '' && type === type.trim(),
      )
    )
      return invalidPaymentMethods(logger);
    hasEnabledMethod = true;
  }
  return hasEnabledMethod ? (value as CheckoutSessionPaymentMethodsInput) : invalidPaymentMethods(logger);
}

const DEFAULT_CHECKOUT_CONFIGURATION: CommerceCheckoutConfiguration = {
  enablePromotionCodes: false,
  enableTaxCollection: false,
  enableShipping: false,
};

export function parseCommerceCheckoutConfiguration(
  raw: string | undefined,
  logger?: CommerceLogger,
): CommerceCheckoutConfiguration {
  if (!raw?.trim()) return DEFAULT_CHECKOUT_CONFIGURATION;

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return DEFAULT_CHECKOUT_CONFIGURATION;
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return DEFAULT_CHECKOUT_CONFIGURATION;
  }

  const candidate = value as Record<string, unknown>;
  for (const key of ['enablePromotionCodes', 'enableTaxCollection', 'enableShipping'] as const) {
    if (typeof candidate[key] !== 'boolean') {
      return DEFAULT_CHECKOUT_CONFIGURATION;
    }
  }

  const shipping = candidate.shipping as Record<string, unknown> | undefined;
  if (shipping !== undefined) {
    if (shipping === null || typeof shipping !== 'object' || Array.isArray(shipping)) {
      return DEFAULT_CHECKOUT_CONFIGURATION;
    }
    const hasOriginAddress =
      shipping.originAddress !== null &&
      typeof shipping.originAddress === 'object' &&
      !Array.isArray(shipping.originAddress);
    const hasFulfillmentLocationId =
      typeof shipping.fulfillmentLocationId === 'string' && shipping.fulfillmentLocationId.trim() !== '';
    if (hasOriginAddress === hasFulfillmentLocationId) {
      return DEFAULT_CHECKOUT_CONFIGURATION;
    }
  }

  const configuredPaymentMethods = parseCheckoutPaymentMethods(candidate.paymentMethods, logger);
  return {
    enablePromotionCodes: candidate.enablePromotionCodes as boolean,
    enableTaxCollection: candidate.enableTaxCollection as boolean,
    enableShipping: candidate.enableShipping as boolean,
    ...(shipping ? { shipping: shipping as CommerceCheckoutShippingConfiguration } : {}),
    ...(configuredPaymentMethods ? { paymentMethods: configuredPaymentMethods } : {}),
  };
}
