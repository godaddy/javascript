import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { formatCurrency } from '@/components/checkout/utils/format-currency';
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
  const { requiredFields } = useCheckoutContext();
  const form = useFormContext();
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
        className='grid grid-cols-3 gap-2'
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
                isInCents: true,
              })}
            </span>
          </Button>
        ))}
      </div>

      <div
        className='grid grid-cols-2 gap-2'
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
        <FormField
          control={form.control}
          name='tipAmount'
          render={({ field, fieldState }) => (
            <FormItem className='space-y-1'>
              <FormLabel className='sr-only'>
                {t.tips.customTipAmount}
              </FormLabel>
              <FormControl>
                <Input
                  type='number'
                  step='.01'
                  hasError={!!fieldState.error}
                  aria-required={requiredFields?.tipAmount}
                  {...field}
                  placeholder={t.tips.placeholder}
                  className='h-12'
                  value={
                    field.value > 0
                      ? formatCurrency({
                          amount: field.value,
                          currencyCode: currencyCode || 'USD',
                          isInCents: true,
                          returnRaw: true,
                        })
                      : ''
                  }
                  onChange={e => {
                    // User inputs in major units (e.g., $10.50), convert to minor units for storage
                    const inputValue = Number.parseFloat(e.target.value);
                    if (!Number.isNaN(inputValue)) {
                      const tipAmount = Math.round(inputValue * 100);
                      field.onChange(tipAmount);
                    } else {
                      field.onChange(0);
                    }
                  }}
                  onBlur={e => {
                    // User inputs in major units (e.g., $10.50), convert to minor units for storage
                    const inputValue = Number.parseFloat(e.target.value);
                    const tipAmount = !Number.isNaN(inputValue)
                      ? Math.round(inputValue * 100)
                      : 0;
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
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </fieldset>
  );
}
