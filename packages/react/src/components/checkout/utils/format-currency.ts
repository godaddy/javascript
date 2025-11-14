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
   * Indicates whether the input is already in cents (minor units).
   * - true → format to currency string (default)
   * - false → convert to minor units and return as string
   */
  isInCents?: boolean;
  /**
   * Return raw numeric value without currency symbol.
   * - true → returns "10.00" instead of "$10.00"
   * - false → returns full currency string (default)
   */
  returnRaw?: boolean;
}

/**
 * Formats or converts a currency amount.
 *
 * - When `isInCents = true` (default): returns formatted string like "$123.45"
 * - When `isInCents = false`: returns string representing minor units like "12345"
 * - When `returnRaw = true`: returns numeric value without currency symbol like "123.45"
 */
export function formatCurrency({
  amount,
  currencyCode,
  locale = 'en-US',
  isInCents = true,
  returnRaw = false,
}: FormatCurrencyOptions): string {
  const config = currencyConfigs[currencyCode] || {};

  const { precision = 2 } = config;

  if (!isInCents) {
    // Convert major units to minor units and return as string
    return Math.round(amount * Math.pow(10, precision)).toString();
  }

  // Format value already in minor units
  const value = amount / Math.pow(10, precision);

  const nfLocale = returnRaw ? 'en-US' : locale;

  return new Intl.NumberFormat(nfLocale, {
    style: returnRaw ? 'decimal' : 'currency',
    currency: returnRaw ? undefined : currencyCode,
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
    useGrouping: returnRaw ? false : undefined,
  }).format(value);
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
