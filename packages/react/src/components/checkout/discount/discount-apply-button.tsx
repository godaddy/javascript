'use client';

import { Loader2 } from 'lucide-react';
import type { ComponentProps } from 'react';
import { Button } from '@/components/ui/button';
import { useGoDaddyContext } from '@/godaddy-provider';

export type ApplyButtonProps = ComponentProps<typeof Button> & {
  isSubmitting?: boolean;
};

export function DiscountApplyButton({ onClick, disabled, isSubmitting, className, ...rest }: ApplyButtonProps) {
  const { t } = useGoDaddyContext();
  return (
    <div className='inline-block'>
      <Button
        onClick={onClick}
        disabled={isSubmitting || disabled}
        className={`relative flex-shrink-0 ${className || ''}`}
        {...rest}
      >
        <span className={isSubmitting ? 'invisible' : 'visible'}>{t.discounts.apply}</span>
        {isSubmitting && (
          <span className='absolute inset-0 flex items-center justify-center'>
            <Loader2 className='h-4 w-4 animate-spin' />
          </span>
        )}
        <span className='invisible absolute inset-0 flex items-center justify-center whitespace-nowrap'>
          {/* This span reserves space for the text */}
          {t.discounts.apply}
        </span>
      </Button>
    </div>
  );
}
