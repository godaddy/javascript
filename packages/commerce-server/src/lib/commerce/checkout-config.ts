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
}

const DEFAULT_CHECKOUT_CONFIGURATION: CommerceCheckoutConfiguration = {
  enablePromotionCodes: false,
  enableTaxCollection: false,
  enableShipping: false,
};

export function parseCommerceCheckoutConfiguration(raw: string | undefined): CommerceCheckoutConfiguration {
  if (!raw?.trim()) return DEFAULT_CHECKOUT_CONFIGURATION;

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    throw new Error('Commerce config: GODADDY_CHECKOUT_CONFIGURATION must be valid JSON.', {
      cause: error,
    });
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Commerce config: GODADDY_CHECKOUT_CONFIGURATION must be a JSON object.');
  }

  const candidate = value as Record<string, unknown>;
  for (const key of ['enablePromotionCodes', 'enableTaxCollection', 'enableShipping'] as const) {
    if (typeof candidate[key] !== 'boolean') {
      throw new Error(`Commerce config: GODADDY_CHECKOUT_CONFIGURATION.${key} must be boolean.`);
    }
  }

  const shipping = candidate.shipping as Record<string, unknown> | undefined;
  if (shipping !== undefined) {
    if (shipping === null || typeof shipping !== 'object' || Array.isArray(shipping)) {
      throw new Error('Commerce config: GODADDY_CHECKOUT_CONFIGURATION.shipping must be an object.');
    }
    const hasOriginAddress =
      shipping.originAddress !== null &&
      typeof shipping.originAddress === 'object' &&
      !Array.isArray(shipping.originAddress);
    const hasFulfillmentLocationId =
      typeof shipping.fulfillmentLocationId === 'string' && shipping.fulfillmentLocationId.trim() !== '';
    if (hasOriginAddress === hasFulfillmentLocationId) {
      throw new Error(
        'Commerce config: GODADDY_CHECKOUT_CONFIGURATION.shipping must contain either originAddress or fulfillmentLocationId.',
      );
    }
  }

  return {
    enablePromotionCodes: candidate.enablePromotionCodes as boolean,
    enableTaxCollection: candidate.enableTaxCollection as boolean,
    enableShipping: candidate.enableShipping as boolean,
    ...(shipping ? { shipping: shipping as CommerceCheckoutShippingConfiguration } : {}),
  };
}
