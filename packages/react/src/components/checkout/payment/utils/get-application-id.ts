import type { CheckoutSession } from '@/types';

/**
 * Resolves the applicationId for TokenizeJs initialization.
 * When the session has `experimental_rules.gopay_override` enabled,
 * the goPayAppId from that rule takes precedence over the default appId.
 */
export function getApplicationId(
  session: CheckoutSession | null | undefined,
  defaultAppId: string | undefined
): string | undefined {
  const goPayOverride = session?.experimental_rules?.gopay_override;
  if (goPayOverride?.enabled && goPayOverride?.goPayAppId) {
    return goPayOverride.goPayAppId;
  }
  return defaultAppId;
}
