import type { GodaddyPaymentsConfig } from '@/components/checkout/checkout';
import type { CheckoutSession } from '@/types';

/**
 * Prefer an explicit `godaddyPaymentsConfig` prop (embedded checkout); fall
 * back to `session.paymentProviderConfiguration.godaddy` from Settings
 * discovery (hosted checkout). GraphQL uses `applicationId`; the prop shape
 * keeps `appId`.
 */
export function resolveGodaddyPaymentsConfig(
  godaddyPaymentsConfig: GodaddyPaymentsConfig | undefined,
  session: CheckoutSession | null | undefined
): GodaddyPaymentsConfig | undefined {
  if (godaddyPaymentsConfig) {
    return godaddyPaymentsConfig;
  }

  const sessionGodaddyConfig = session?.paymentProviderConfiguration?.godaddy;
  if (!sessionGodaddyConfig) {
    return undefined;
  }

  return {
    businessId: sessionGodaddyConfig.businessId,
    appId: sessionGodaddyConfig.applicationId,
  };
}
