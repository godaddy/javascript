import { useDebouncedValue } from '@tanstack/react-pacer';
import { useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useCheckoutContext } from '@/components/checkout/checkout';
import {
  convertMajorToMinorUnits,
  currencyConfigs,
  useFormatCurrency,
} from '@/components/checkout/utils/format-currency';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useGoDaddyContext } from '@/godaddy-provider';
import { cn } from '@/lib/utils';
import { eventIds } from '@/tracking/events';
import { TrackingEventType, track } from '@/tracking/track';

interface TipsFormProps {
  total: number;
  currencyCode?: string;
}

export function TipsForm({ total, currencyCode }: TipsFormProps) {
  const { t } = useGoDaddyContext();
  const form = useFormContext();
  const formatCurrency = useFormatCurrency();
  const [showCustomTip, setShowCustomTip] = useState(false);

  const calculateTipAmount = (percentage: number): number => {
    // total is in minor units, so calculate percentage and return in minor units
    return Math.round((total * percentage) / 100);
  };

  const handlePercentageSelect = (percentage: number) => {
    const tipAmount = calculateTipAmount(percentage);
    form.setValue('tipAmount', tipAmount);
    form.setValue('tipPercentage', percentage);
    setShowCustomTip(false);

    // Track tip percentage selection
    track({
      eventId: eventIds.selectTipAmount,
      type: TrackingEventType.CLICK,
      properties: {
        tipPercentage: percentage,
        tipAmount: tipAmount,
        totalBeforeTip: total,
        currencyCode,
      },
    });
  };

  const handleNoTip = () => {
    form.setValue('tipAmount', 0);
    form.setValue('tipPercentage', 0);
    setShowCustomTip(false);

    // Track no tip selection
    track({
      eventId: eventIds.selectTipAmount,
      type: TrackingEventType.CLICK,
      properties: {
        tipPercentage: 0,
        tipAmount: 0,
        totalBeforeTip: total,
        currencyCode,
      },
    });
  };

  const handleCustomTip = () => {
    setShowCustomTip(true);
    form.setValue('tipPercentage', null);

    // Track custom tip selection
    track({
      eventId: eventIds.enterCustomTip,
      type: TrackingEventType.CLICK,
      properties: {
        totalBeforeTip: total,
        currencyCode,
      },
    });
  };

  const tipPercentages = [15, 18, 20];
  const tipPercentage = form.watch('tipPercentage');

  return (
    <fieldset className='space-y-4'>
      <div
        className='grid grid-cols-1 sm:grid-cols-3 gap-2'
        role='radiogroup'
        aria-label={t.tips?.title || 'Tip amount'}
      >
        {tipPercentages.map(percentage => (
          <Button
            key={percentage}
            type='button'
            variant={tipPercentage === percentage ? 'default' : 'outline'}
            className={cn(
              'h-16 flex flex-col items-center justify-center',
              tipPercentage === percentage
                ? 'bg-primary text-primary-foreground'
                : 'bg-card hover:bg-muted active:ring'
            )}
            onClick={() => handlePercentageSelect(percentage)}
            aria-checked={tipPercentage === percentage ? 'true' : 'false'}
          >
            <span className='text-lg'>{percentage}%</span>
            <span className='text-sm'>
              {formatCurrency({
                amount: calculateTipAmount(percentage),
                currencyCode: currencyCode || 'USD',
                inputInMinorUnits: true,
              })}
            </span>
          </Button>
        ))}
      </div>

      <div
        className='grid grid-cols-1 sm:grid-cols-2 gap-2'
        role='radiogroup'
        aria-label={t.ui.accessibility.additionalTipOptions}
      >
        <Button
          type='button'
          variant={tipPercentage === 0 ? 'default' : 'outline'}
          className={cn(
            'h-12 font-normal',
            tipPercentage !== 0 && 'hover:bg-muted'
          )}
          onClick={handleNoTip}
          aria-checked={tipPercentage === 0 ? 'true' : 'false'}
        >
          {t.tips.noTip}
        </Button>
        <Button
          type='button'
          variant={showCustomTip ? 'default' : 'outline'}
          className={cn('h-12 font-normal', !showCustomTip && 'hover:bg-muted')}
          onClick={handleCustomTip}
          aria-checked={showCustomTip ? 'true' : 'false'}
        >
          {t.tips.customAmount}
        </Button>
      </div>

      {showCustomTip && (
        <CustomTipInput
          currencyCode={currencyCode}
          total={total}
          formatCurrency={formatCurrency}
        />
      )}
    </fieldset>
  );
}

/**
 * Isolated component for the custom tip input.
 *
 * Uses the "format on blur" pattern — the industry standard for currency inputs
 * (Stripe, Square, Shopify, etc.):
 *
 * - While focused: the user edits raw text freely (local state).
 *   Only non-numeric characters are stripped; intermediate states like
 *   "10.", "10.5", "" are all preserved so delete/backspace work naturally.
 * - On blur: the raw text is parsed, converted to minor units, synced to
 *   form state, and the display is reformatted (e.g. "10.5" → "10.50").
 * - On focus: if a formatted value exists it is shown as an editable raw
 *   number so the user can continue editing from where they left off.
 */
interface CustomTipInputProps {
  currencyCode?: string;
  total: number;
  formatCurrency: (options: {
    amount: number;
    currencyCode: string;
    inputInMinorUnits?: boolean;
    returnRaw?: boolean;
  }) => string;
}

/**
 * Currencies where the symbol is conventionally placed after the number.
 * Derived from currencyConfigs entries with `pattern: '#!'`.
 */
const SUFFIX_CURRENCIES = new Set(
  Object.entries(currencyConfigs)
    .filter(([, cfg]) => cfg.pattern === '#!')
    .map(([code]) => code)
);

/**
 * Map symbol character length to Tailwind padding classes.
 * Arabic / multi-char symbols need more room than a single `$`.
 */
function symbolPadding(symbol: string, position: 'prefix' | 'suffix') {
  const len = symbol.length;
  if (position === 'prefix') {
    if (len <= 1) return 'pl-7'; // $, €, ¥, ₩, etc.
    if (len <= 2) return 'pl-10'; // R$, Rp, S/
    if (len <= 3) return 'pl-12'; // NT$, د.إ, د.ك
    return 'pl-14'; // .د.ب, ر.ع.
  }
  // suffix
  if (len <= 1) return 'pr-7';
  if (len <= 2) return 'pr-10';
  if (len <= 3) return 'pr-12';
  return 'pr-14';
}

function CustomTipInput({
  currencyCode,
  total,
  formatCurrency,
}: CustomTipInputProps) {
  const { t } = useGoDaddyContext();
  const { requiredFields } = useCheckoutContext();
  const form = useFormContext();

  const code = currencyCode || 'USD';
  const config = currencyConfigs[code] || { symbol: '$', precision: 2 };
  const { symbol, precision } = config;
  const isSuffix = SUFFIX_CURRENCIES.has(code);

  // Local state holds the raw text the user is actively typing.
  // `null` means "not focused — derive display from form state".
  const [localValue, setLocalValue] = useState<string | null>(null);
  const isFocused = useRef(false);

  // Debounce the local value so the form syncs after 3s of inactivity,
  // even if the user hasn't blurred the input yet. This keeps the order
  // summary / totals up-to-date while the input stays focused.
  const [debouncedLocal] = useDebouncedValue(localValue, { wait: 1500 });

  /**
   * Sanitize input: allow only digits and (for currencies with decimals)
   * a single decimal point with at most `precision` fractional digits.
   */
  const sanitize = (raw: string): string => {
    // Strip everything except digits and '.'
    let cleaned = raw.replace(/[^\d.]/g, '');

    // For zero-precision currencies (JPY, KRW, etc.), strip any decimal
    if (precision === 0) {
      return cleaned.replace(/\./g, '');
    }

    // Allow only one decimal point
    const dotIndex = cleaned.indexOf('.');
    if (dotIndex !== -1) {
      const before = cleaned.slice(0, dotIndex);
      const after = cleaned.slice(dotIndex + 1).replace(/\./g, '');
      // Limit fractional digits to currency precision
      cleaned = `${before}.${after.slice(0, precision)}`;
    }

    return cleaned;
  };

  /**
   * Format a minor-units value as a raw numeric string for display
   * (e.g. 1050 → "10.50" for USD).
   */
  const formatRaw = (minorUnits: number): string => {
    if (minorUnits <= 0) return '';
    return formatCurrency({
      amount: minorUnits,
      currencyCode: code,
      inputInMinorUnits: true,
      returnRaw: true,
    });
  };

  // When the debounced value settles and the input is still focused,
  // sync to form state and format the display — the same effect as blur
  // but triggered by 3s of inactivity. This keeps the order summary
  // up-to-date and gives the user visual confirmation of their amount.
  useEffect(() => {
    if (!isFocused.current || debouncedLocal === null) return;
    const tipAmount = convertMajorToMinorUnits(debouncedLocal ?? '', code);
    form.setValue('tipAmount', tipAmount);
    // Clear local state so the display derives from the formatted form
    // value (e.g. "10.5" → "10.50"), same as the blur handler.
    setLocalValue(null);
  }, [debouncedLocal]); // eslint-disable-line react-hooks/exhaustive-deps

  const symbolEl = (
    <span
      className={cn(
        'pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground text-base md:text-sm',
        isSuffix ? 'right-3' : 'left-3'
      )}
      aria-hidden='true'
    >
      {symbol}
    </span>
  );

  return (
    <FormField
      control={form.control}
      name='tipAmount'
      render={({ field, fieldState }) => {
        // While focused, show local text. Otherwise, derive from form state.
        const displayValue =
          localValue !== null ? localValue : formatRaw(field.value);

        return (
          <FormItem className='space-y-1'>
            <FormLabel className='sr-only'>{t.tips.customTipAmount}</FormLabel>
            <FormControl>
              <div className='relative'>
                {symbolEl}
                <Input
                  type='text'
                  inputMode='decimal'
                  autoComplete='off'
                  hasError={!!fieldState.error}
                  aria-required={requiredFields?.tipAmount}
                  placeholder={
                    precision > 0 ? `0.${'0'.repeat(precision)}` : '0'
                  }
                  className={cn(
                    'h-12',
                    isSuffix
                      ? symbolPadding(symbol, 'suffix')
                      : symbolPadding(symbol, 'prefix')
                  )}
                  value={displayValue}
                  onFocus={() => {
                    isFocused.current = true;
                    // Seed local state with the current formatted value so
                    // the user can continue editing naturally.
                    setLocalValue(formatRaw(field.value));
                  }}
                  onChange={e => {
                    // Only sanitize (strip invalid chars) — do NOT parse or
                    // round-trip through minor units. This preserves intermediate
                    // states like "10.", "10.5", "" so editing feels natural.
                    setLocalValue(sanitize(e.target.value));
                  }}
                  onBlur={e => {
                    isFocused.current = false;

                    // Parse the raw text and sync to form state
                    const tipAmount = convertMajorToMinorUnits(
                      e.target.value,
                      code
                    );

                    field.onChange(tipAmount);

                    // Clear local state so display derives from formatted form value
                    setLocalValue(null);

                    // Track custom tip amount entry
                    track({
                      eventId: eventIds.enterCustomTip,
                      type: TrackingEventType.CLICK,
                      properties: {
                        tipAmount: tipAmount,
                        totalBeforeTip: total,
                        tipPercentage: Number(
                          ((tipAmount / total) * 100).toFixed(2)
                        ),
                        currencyCode,
                      },
                    });
                  }}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
