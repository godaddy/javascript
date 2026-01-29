import { useGoDaddyContext } from '@/godaddy-provider';

/**
 * Currency configuration map with symbols and decimal precision.
 */
export const currencyConfigs: Record<
  string,
  { symbol: string; precision: number; pattern?: string }
> = {
  AUD: { symbol: '$', precision: 2 },
  CAD: { symbol: '$', precision: 2 },
  HKD: { symbol: '$', precision: 2 },
  SGD: { symbol: '$', precision: 2 },
  NZD: { symbol: '$', precision: 2 },
  USD: { symbol: '$', precision: 2 },
  VND: { symbol: '₫', precision: 0 },
  EUR: { symbol: '€', precision: 2 },
  GBP: { symbol: '£', precision: 2 },
  ARS: { symbol: '$', precision: 2 },
  CLP: { symbol: '$', precision: 0 },
  COP: { symbol: '$', precision: 2 },
  PHP: { symbol: '₱', precision: 2 },
  MXN: { symbol: '$', precision: 2 },
  BRL: { symbol: 'R$', precision: 2 },
  INR: { symbol: '₹', precision: 2 },
  IDR: { symbol: 'Rp', precision: 2 },
  PEN: { symbol: 'S/', precision: 2 },
  AED: { symbol: 'د.إ', precision: 2, pattern: '#!' },
  ILS: { symbol: '₪', precision: 2 },
  TRY: { symbol: '₺', precision: 2 },
  ZAR: { symbol: 'R', precision: 2 },
  CNY: { symbol: '¥', precision: 2 },
  JPY: { symbol: '¥', precision: 0 },
  KRW: { symbol: '₩', precision: 0 },
  TWD: { symbol: 'NT$', precision: 0 },
  KWD: { symbol: 'د.ك', precision: 3 },
  BHD: { symbol: '.د.ب', precision: 3 },
  JOD: { symbol: 'د.ا', precision: 3 },
  OMR: { symbol: 'ر.ع.', precision: 3 },
};

export interface FormatCurrencyOptions {
  /** Numeric amount to format or convert */
  amount: number;
  /** ISO 4217 currency code (e.g. 'USD', 'VND', 'CLP') */
  currencyCode: string;
  /** Optional locale, defaults to 'en-US' */
  locale?: string;
  /**
   * Indicates whether the input is in cents (minor units).
   * - true → input is in cents/minor units, will be converted to dollars/major units for formatting (default)
   * - false → input is already in dollars/major units, will be formatted as-is
   */
  inputInMinorUnits?: boolean;
  /**
   * Return raw numeric value without currency symbol.
   * - true → returns "10.00" instead of "$10.00"
   * - false → returns full currency string (default)
   */
  returnRaw?: boolean;
}

/**
 * Formats a currency amount.
 *
 * - When `inputInMinorUnits = true` (default): converts from minor units (cents) and returns formatted string like "$123.45"
 * - When `inputInMinorUnits = false`: formats major units (dollars) directly and returns formatted string like "$123.45"
 * - When `returnRaw = true`: returns numeric value without currency symbol like "123.45"
 */
export function formatCurrency({
  amount,
  currencyCode,
  locale = 'en-US',
  inputInMinorUnits = true,
  returnRaw = false,
}: FormatCurrencyOptions): string {
  const config = currencyConfigs[currencyCode] || {};

  const { precision = 2 } = config;

  // Calculate the value to format
  const value = inputInMinorUnits
    ? amount / Math.pow(10, precision) // Convert from minor units (cents) to major units (dollars)
    : amount; // Already in major units (dollars)

  const nfLocale = returnRaw ? 'en-US' : locale;

  try {
    return new Intl.NumberFormat(nfLocale, {
      style: returnRaw ? 'decimal' : 'currency',
      currency: returnRaw ? undefined : currencyCode,
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
      useGrouping: returnRaw ? false : undefined,
    }).format(value);
  } catch (_error) {
    // Fallback to 'en-US' for invalid locales
    return new Intl.NumberFormat('en-US', {
      style: returnRaw ? 'decimal' : 'currency',
      currency: returnRaw ? undefined : currencyCode,
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
      useGrouping: returnRaw ? false : undefined,
    }).format(value);
  }
}

/**
 * Converts a currency amount from major units (dollars) to minor units (cents).
 *
 * This is the reverse operation of formatCurrency with inputInMinorUnits=true.
 * It properly handles different currency precisions:
 * - 2 decimals (USD, EUR, etc.): multiply by 100
 * - 0 decimals (JPY, KRW, VND, etc.): multiply by 1
 * - 3 decimals (KWD, BHD, JOD, OMR): multiply by 1000
 *
 * @param amount - The amount in major units (e.g., "10.50" or 10.50)
 * @param currencyCode - ISO 4217 currency code (e.g., 'USD', 'JPY', 'KWD')
 * @returns The amount in minor units (e.g., 1050 for USD, 10 for JPY, 10500 for KWD)
 */
export function convertMajorToMinorUnits(
  amount: number | string,
  currencyCode: string
): number {
  const config = currencyConfigs[currencyCode] || { precision: 2 };
  const numAmount = typeof amount === 'string' ? Number(amount) : amount;
  return Math.round(numAmount * Math.pow(10, config.precision));
}

/**
 * Hook that returns a formatCurrency function using the locale from GoDaddyProvider context.
 * The returned function has the same signature as formatCurrency, but uses the context locale as default.
 */
export function useFormatCurrency() {
  const { locale: contextLocale } = useGoDaddyContext();

  return (options: FormatCurrencyOptions) => {
    return formatCurrency({
      ...options,
      locale: options.locale ?? contextLocale ?? 'en-US',
    });
  };
}

/**
 * Hook that returns a convertMajorToMinorUnits function.
 * This follows the same pattern as useFormatCurrency for consistency.
 * Note: Locale is not used in currency conversion (only in display formatting),
 * but we access context to maintain the same hook pattern.
 */
export function useConvertMajorToMinorUnits() {
  return (amount: number | string, currencyCode: string) => {
    return convertMajorToMinorUnits(amount, currencyCode);
  };
}
