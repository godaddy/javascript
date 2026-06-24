import type { TargetProps } from '../types';
import type { UiExtensionContext } from './types';

export function buildUiExtensionContext({
  id,
  storeId,
  orderId,
  locale,
  currencyCode,
  theme,
}: Pick<
  TargetProps,
  'id' | 'storeId' | 'orderId' | 'locale' | 'currencyCode' | 'theme'
>): UiExtensionContext {
  return {
    target: id,
    ...(storeId ? { storeId } : {}),
    ...(orderId ? { orderId } : {}),
    ...(locale ? { locale } : {}),
    ...(currencyCode ? { currencyCode } : {}),
    ...(theme ? { theme } : {}),
  };
}
