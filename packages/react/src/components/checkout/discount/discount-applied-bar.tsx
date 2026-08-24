'use client';

import { Check, Loader2, X } from 'lucide-react';

import { useFormatCurrency } from '@/components/checkout/utils/format-currency';
import { cn } from '@/lib/utils';

interface DiscountAppliedBarProps {
  code: string;
  amount: number;
  currencyCode: string;
  inputInMinorUnits?: boolean;
  onRemove?: () => void;
  isRemoving?: boolean;
}

export function DiscountAppliedBar({
  code,
  amount,
  currencyCode,
  inputInMinorUnits = true,
  onRemove,
  isRemoving,
}: DiscountAppliedBarProps) {
  const formatCurrency = useFormatCurrency();

  const formattedAmount = formatCurrency({
    amount,
    currencyCode,
    inputInMinorUnits,
  });

  return (
    <div
      className={cn(
        'flex h-14 items-center justify-between rounded-md border border-[#22C55E] bg-[#F0FDF4] px-4'
      )}
    >
      <div className='flex items-center gap-3'>
        <span className='flex h-6 w-6 items-center justify-center rounded-full bg-[#22C55E] text-white'>
          <Check className='h-4 w-4' aria-hidden='true' />
        </span>
        <span className='text-base font-semibold text-[#15803D]'>{code}</span>
      </div>

      <div className='flex items-center gap-4'>
        <span className='text-base font-semibold text-[#15803D]'>
          – {formattedAmount}
        </span>
        {onRemove ? (
          <>
            <span
              className='h-6 w-px bg-[#D1D5DB]'
              aria-hidden='true'
            />
            <button
              type='button'
              className='flex h-6 w-6 items-center justify-center text-[#111111] disabled:opacity-50'
              onClick={onRemove}
              disabled={isRemoving}
              aria-label={`Remove ${code}`}
            >
              {isRemoving ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <X className='h-4 w-4' />
              )}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
