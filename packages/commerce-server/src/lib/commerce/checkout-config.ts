export interface CommerceCheckoutShippingReadinessConfiguration {
  readonly originAddressConfigured: true;
  readonly originAddressContractVersion: 1;
}

/** @deprecated Existing generated apps may retain this shape until the next configuration sync. */
export interface LegacyCommerceCheckoutShippingConfiguration {
  readonly originAddress: Readonly<Record<string, unknown>>;
}

export type CommerceCheckoutShippingConfiguration =
  | CommerceCheckoutShippingReadinessConfiguration
  | LegacyCommerceCheckoutShippingConfiguration;

export interface CommerceCheckoutConfiguration {
  readonly storeId?: string;
  readonly channelId?: string;
  readonly currencyCode?: string;
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

  const shipping = candidate.shipping;
  if (
    shipping !== undefined &&
    (shipping === null || typeof shipping !== 'object' || Array.isArray(shipping))
  ) {
    throw new Error('Commerce config: GODADDY_CHECKOUT_CONFIGURATION.shipping must be an object.');
  }

  return candidate as unknown as CommerceCheckoutConfiguration;
}
