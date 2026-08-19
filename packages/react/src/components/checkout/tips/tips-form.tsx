import { useDebouncedValue } from '@tanstack/react-pacer';
import { useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { TIP_SERVER_ERROR_TYPE } from '@/components/checkout/tips/utils/tip-field-errors';
import {
  convertMajorToMinorUnits,
  currencyConfigs,
  type FormatCurrencyOptions,
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
import { type CheckoutSession } from '@/types';

interface TipsFormProps {
  subtotal: number;
  options?: CheckoutSession['tips'];
  currencyCode?: string;
  /** The subtotal arrives with the draft order, so it reads as 0 until then. */
  isTotalsLoading?: boolean;
}

const DEFAULT_TIP_PERCENTAGES = [15, 18, 20];

/** `subtotal` is in minor units, so the tip is too. */
function percentageToAmount(subtotal: number, percentage: number): number {
  return Math.round((subtotal * percentage) / 100);
}

/**
 * Which preset index counts as selected.
 *
 * The clicked index wins, since that is what tells two presets of the same value
 * apart — but only while it still holds the selected value. It stops doing so
 * when the subtotal crosses a threshold and swaps the list out from under it,
 * and it was never set at all for a tip the host app preselected. Both fall back
 * to matching by value.
 */
function resolveActiveIndex(
  clickedIndex: number | null,
  presets: readonly (number | null | undefined)[] | null | undefined,
  value: unknown
): number {
  if (!presets) return -1;
  if (clickedIndex != null && presets[clickedIndex] === value) {
    return clickedIndex;
  }
  return presets.indexOf(value as number);
}

// A library cannot assume `process` exists, and bundlers replace this expression
// at build time, so the warning below is compiled out of production apps.
const IS_DEV =
  typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';

export function TipsForm({
  subtotal,
  options,
  currencyCode,
  isTotalsLoading = false,
}: TipsFormProps) {
  const { t } = useGoDaddyContext();
  const form = useFormContext();
  const formatCurrency = useFormatCurrency();
  const [showCustomTip, setShowCustomTip] = useState(false);
  // Which preset the customer picked. Selection is matched by index as well as
  // by value so a merchant that lists the same amount twice does not light up
  // both buttons; the form value stays authoritative.
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const calculateTipAmount = (percentage: number): number =>
    percentageToAmount(subtotal, percentage);

  const handleAmountSelect = (amount: number, index: number) => {
    form.setValue('tipAmount', amount);
    form.setValue('tipPercentage', null);
    setSelectedIndex(index);
    setShowCustomTip(false);

    // Track tip amount selection
    track({
      eventId: eventIds.selectTipAmount,
      type: TrackingEventType.CLICK,
      properties: {
        tipPercentage: null,
        tipAmount: amount,
        totalBeforeTip: subtotal,
        currencyCode,
      },
    });
  };

  const handlePercentageSelect = (percentage: number, index: number) => {
    const tipAmount = calculateTipAmount(percentage);
    form.setValue('tipAmount', tipAmount);
    form.setValue('tipPercentage', percentage);
    setSelectedIndex(index);
    setShowCustomTip(false);

    // Track tip percentage selection
    track({
      eventId: eventIds.selectTipAmount,
      type: TrackingEventType.CLICK,
      properties: {
        tipPercentage: percentage,
        tipAmount: tipAmount,
        totalBeforeTip: subtotal,
        currencyCode,
      },
    });
  };

  const handleNoTip = () => {
    form.setValue('tipAmount', 0);
    form.setValue('tipPercentage', 0);
    setSelectedIndex(null);
    setShowCustomTip(false);

    // Track no tip selection
    track({
      eventId: eventIds.selectTipAmount,
      type: TrackingEventType.CLICK,
      properties: {
        tipPercentage: 0,
        tipAmount: 0,
        totalBeforeTip: subtotal,
        currencyCode,
      },
    });
  };

  const handleCustomTip = () => {
    const currentTipAmount = form.getValues('tipAmount') || 0;

    setShowCustomTip(true);
    setSelectedIndex(null);
    form.setValue('tipAmount', currentTipAmount);
    form.setValue('tipPercentage', null);

    // Track custom tip selection
    track({
      eventId: eventIds.enterCustomTip,
      type: TrackingEventType.CLICK,
      properties: {
        totalBeforeTip: subtotal,
        currencyCode,
      },
    });
  };

  const tipPercentage = form.watch('tipPercentage');
  let tipPercentages = options?.default?.percentages;

  const tipAmount = form.watch('tipAmount');
  let tipAmounts = options?.default?.amounts;

  const matchingThresholds =
    options?.thresholds?.filter(
      thres =>
        (thres?.minSubtotal == null || subtotal >= thres.minSubtotal) &&
        (thres?.maxSubtotal == null || subtotal <= thres.maxSubtotal)
    ) ?? [];
  const threshold = matchingThresholds[0];
  const matchCount = matchingThresholds.length;

  // Overlapping ranges make the order of `thresholds` load-bearing, which is
  // never what a merchant intends and is invisible at runtime — the first match
  // simply wins. Warned about in development so the config gets fixed rather
  // than the array quietly reordered later.
  useEffect(() => {
    if (!IS_DEV || matchCount <= 1) return;

    // biome-ignore lint/suspicious/noConsole: a misconfiguration only the developer integrating the SDK can fix, and only reachable in development
    console.warn(
      `[godaddy-checkout] tips.thresholds has ${matchCount} entries matching a subtotal of ${subtotal}. The first match is used; overlapping ranges make the array order significant.`
    );
  }, [matchCount, subtotal]);

  if (threshold) {
    if (threshold.amounts?.length) {
      tipAmounts = threshold.amounts;
      tipPercentages = undefined;
    } else if (threshold.percentages?.length) {
      tipPercentages = threshold.percentages;
      tipAmounts = undefined;
    }
  }

  const percentagePresets = tipPercentages?.length
    ? tipPercentages
    : DEFAULT_TIP_PERCENTAGES;

  // Percentages of a zero subtotal are all worth nothing, so the presets would be
  // $0.00 buttons that do nothing when picked; Custom Amount still tips. Fixed
  // amounts are worth what they say. A subtotal still loading keeps the presets
  // rather than flashing them in once the draft order lands.
  const showAmountPresets = Boolean(tipAmounts?.length);
  const showPercentagePresets =
    !showAmountPresets && (isTotalsLoading || subtotal > 0);

  const activeAmountIndex = resolveActiveIndex(
    selectedIndex,
    tipAmounts,
    tipAmount
  );
  const activePercentageIndex = resolveActiveIndex(
    selectedIndex,
    percentagePresets,
    tipPercentage
  );

  // A rejection the API attributed to `tipAmount` (TIP_EXCEEDS_LIMIT and
  // friends) is shown here rather than only in the checkout-wide error list, so
  // the customer can see which field to fix.
  const tipFieldError = form.formState.errors.tipAmount;

  // Ref to avoid `form` (unstable reference) in the dependency array.
  const formRef = useRef(form);
  formRef.current = form;

  // A percentage preset is worth whatever it is worth now. The amount shown under
  // the button is recomputed from the current subtotal on every render, so form
  // state has to follow it — otherwise a preset picked before the draft-order
  // totals arrived stays worth a percentage of nothing while displaying, and
  // reporting as selected, the amount it would be worth today.
  useEffect(() => {
    const percentage = formRef.current.getValues('tipPercentage');
    if (!percentage) return;

    const nextTipAmount = percentageToAmount(subtotal, percentage);
    if (formRef.current.getValues('tipAmount') !== nextTipAmount) {
      formRef.current.setValue('tipAmount', nextTipAmount);
    }
  }, [subtotal]);

  // That rejection goes stale as soon as the customer picks a different amount,
  // and react-hook-form leaves manually-set errors in place on its own.
  useEffect(() => {
    if (
      formRef.current.formState.errors.tipAmount?.type === TIP_SERVER_ERROR_TYPE
    ) {
      formRef.current.clearErrors('tipAmount');
    }
  }, [tipAmount]);

  return (
    <fieldset className='space-y-4'>
      {showAmountPresets || showPercentagePresets ? (
        <div
          className='grid grid-cols-1 sm:grid-cols-3 gap-2'
          role='radiogroup'
          aria-label={t.tips?.title || 'Tip amount'}
        >
          {tipAmounts?.length
            ? tipAmounts.map((amount, index) => {
                const isSelected =
                  !showCustomTip &&
                  tipAmount === amount &&
                  index === activeAmountIndex;

                return (
                  <Button
                    key={`tip-amount-${index}`}
                    type='button'
                    role='radio'
                    variant='outline'
                    className={cn(
                      'h-16 flex flex-col items-center justify-center gap-y-0.5 hover:bg-muted bg-card',
                      isSelected
                        ? 'border-primary ring-2 ring-primary'
                        : 'active:ring'
                    )}
                    onClick={() => handleAmountSelect(amount, index)}
                    aria-checked={isSelected ? 'true' : 'false'}
                  >
                    <span className='text-base'>
                      {formatCurrency({
                        amount,
                        currencyCode: currencyCode || 'USD',
                        inputInMinorUnits: true,
                      })}
                    </span>
                  </Button>
                );
              })
            : percentagePresets.map((percentage, index) => {
                const isSelected =
                  tipPercentage === percentage &&
                  index === activePercentageIndex;

                return (
                  <Button
                    key={`tip-percentage-${index}`}
                    type='button'
                    role='radio'
                    variant='outline'
                    className={cn(
                      'h-16 flex flex-col items-center justify-center gap-y-0.5 hover:bg-muted bg-card',
                      isSelected
                        ? 'border-primary ring-2 ring-primary'
                        : 'active:ring'
                    )}
                    onClick={() => handlePercentageSelect(percentage, index)}
                    aria-checked={isSelected ? 'true' : 'false'}
                  >
                    <span className='text-lg leading-tight font-bold'>
                      {percentage}%
                    </span>
                    <span className='text-sm'>
                      {formatCurrency({
                        amount: calculateTipAmount(percentage),
                        currencyCode: currencyCode || 'USD',
                        inputInMinorUnits: true,
                      })}
                    </span>
                  </Button>
                );
              })}
        </div>
      ) : null}

      <div
        className='grid grid-cols-1 sm:grid-cols-2 gap-2'
        role='radiogroup'
        aria-label={t.ui.accessibility.additionalTipOptions}
      >
        <Button
          type='button'
          role='radio'
          variant='outline'
          className={cn(
            'h-12 font-normal hover:bg-muted',
            !tipAmount &&
              tipPercentage === 0 &&
              'border-primary ring-2 ring-primary'
          )}
          onClick={handleNoTip}
          aria-checked={!tipAmount && tipPercentage === 0 ? 'true' : 'false'}
        >
          {t.tips.noTip}
        </Button>
        <Button
          type='button'
          role='radio'
          variant='outline'
          className={cn(
            'h-12 font-normal hover:bg-muted',
            showCustomTip && 'border-primary ring-2 ring-primary'
          )}
          onClick={handleCustomTip}
          aria-checked={showCustomTip ? 'true' : 'false'}
        >
          {t.tips.customAmount}
        </Button>
      </div>

      {showCustomTip ? (
        <CustomTipInput
          currencyCode={currencyCode}
          subtotal={subtotal}
          formatCurrency={formatCurrency}
        />
      ) : (
        // When the custom input is open its own FormMessage renders this, wired
        // to the input via aria-describedby.
        tipFieldError?.message && (
          <p
            className='text-[0.8rem] font-medium text-destructive'
            role='alert'
          >
            {String(tipFieldError.message)}
          </p>
        )
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
  subtotal: number;
  formatCurrency: (options: FormatCurrencyOptions) => string;
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
  subtotal,
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

  // Debounce the local value so the form syncs after 1.5s of inactivity,
  // even if the user hasn't blurred the input yet. This keeps the order
  // summary / totals up-to-date while the input stays focused.
  const [debouncedLocal] = useDebouncedValue(localValue, { wait: 1500 });

  /**
   * Sanitize input: allow only digits and (for currencies with decimals)
   * a single decimal separator with at most `precision` fractional digits.
   * Commas are normalized to decimal points so entries like "10,50" do not
   * become "1050".
   */
  const sanitize = (raw: string): string => {
    let cleaned = raw.replace(/,/g, '.').replace(/[^\d.]/g, '');

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

  // Ref to avoid `form` (unstable reference) in the dependency array.
  const formRef = useRef(form);
  formRef.current = form;

  // When the debounced value settles and the input is still focused,
  // sync to form state and format the display — the same effect as blur
  // but triggered by 1.5s of inactivity. This keeps the order summary
  // up-to-date and gives the user visual confirmation of their amount.
  useEffect(() => {
    if (!isFocused.current || debouncedLocal === null) return;
    const tipAmount = convertMajorToMinorUnits(debouncedLocal ?? '', code);
    formRef.current.setValue('tipAmount', tipAmount);
    // Clear local state so the display derives from the formatted form
    // value (e.g. "10.5" → "10.50"), same as the blur handler.
    setLocalValue(null);
  }, [debouncedLocal, code]);

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
                        totalBeforeTip: subtotal,
                        tipPercentage:
                          subtotal > 0
                            ? Number(((tipAmount / subtotal) * 100).toFixed(2))
                            : 0,
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
