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
  convertMajorToMinorUnits,
  type FormatCurrencyOptions,
  formatCurrency,
  useConvertMajorToMinorUnits,
  useFormatCurrency,
} from '@/components/checkout/utils/format-currency';
