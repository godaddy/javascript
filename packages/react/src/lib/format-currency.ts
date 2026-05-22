/**
 * Public re-exports of currency formatting utilities.
 *
 * The implementation lives in `components/checkout/utils/format-currency.ts`
 * for historical reasons; this module is the stable public entry point.
 *
 * `currencyConfigs` is intentionally not re-exported — keep the symbol/precision
 * table internal so it can be extended without semver impact.
 */
export {
  formatCurrency,
  convertMajorToMinorUnits,
  useFormatCurrency,
  useConvertMajorToMinorUnits,
  type FormatCurrencyOptions,
} from '@/components/checkout/utils/format-currency';
