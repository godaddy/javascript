'use client';

import { enUs } from '@godaddy/localizations';
import { Loader2, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { DiscountAppliedBar } from '@/components/checkout/discount/discount-applied-bar';
import { useDiscountApply } from '@/components/checkout/discount/utils/use-discount-apply';
import { useDraftOrder } from '@/components/checkout/order/use-draft-order';
import { useIsPaymentDisabled } from '@/components/checkout/payment/utils/use-is-payment-disabled';
import { useGoDaddyContext } from '@/godaddy-provider';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';
import { cn } from '@/lib/utils';
import type { DraftOrder } from '@/types';
import { eventIds } from '@/tracking/events';
import { TrackingEventType, track } from '@/tracking/track';
import type { DiscountFormProps } from './types';

type AppliedDiscount = {
  code: string;
  amount: number;
  currencyCode: string;
};

function collectAppliedDiscounts(draftOrder: DraftOrder): AppliedDiscount[] {
  const discountsByCode = new Map<string, AppliedDiscount>();

  const addDiscount = (discount: {
    code?: string | null;
    amount?: { value?: number | null; currencyCode?: string | null } | null;
  }) => {
    if (!discount.code) return;

    const existing = discountsByCode.get(discount.code);
    const amountValue = discount.amount?.value ?? 0;
    const currencyCode = discount.amount?.currencyCode ?? 'USD';

    if (existing) {
      existing.amount += amountValue;
      return;
    }

    discountsByCode.set(discount.code, {
      code: discount.code,
      amount: amountValue,
      currencyCode,
    });
  };

  draftOrder.discounts?.forEach(addDiscount);
  draftOrder.lineItems?.forEach(lineItem => {
    lineItem.discounts?.forEach(addDiscount);
  });
  draftOrder.shippingLines?.forEach(shippingLine => {
    shippingLine.discounts?.forEach(addDiscount);
  });

  return Array.from(discountsByCode.values());
}

function collectDiscountCodes(appliedDiscounts: AppliedDiscount[]): string[] {
  return appliedDiscounts.map(discount => discount.code);
}

export function DiscountStandalone({
  onDiscountsChange,
  onError,
}: DiscountFormProps) {
  const { t } = useGoDaddyContext();
  const { elements } = useCheckoutContext();
  const isPaymentDisabled = useIsPaymentDisabled();
  const { data: draftOrder } = useDraftOrder();
  const appliedDiscounts = useMemo(
    () => (draftOrder ? collectAppliedDiscounts(draftOrder) : []),
    [draftOrder]
  );
  const currentDiscountCodes = useMemo(
    () => collectDiscountCodes(appliedDiscounts),
    [appliedDiscounts]
  );

  const [discountCode, setDiscountCode] = useState<string>('');
  const [formErrors, setFormErrors] = useState<string[] | undefined>(
    undefined
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRemovingDiscount, setIsRemovingDiscount] = useState<
    string | undefined
  >(undefined);
  const [isFocused, setIsFocused] = useState(false);
  const applyDiscount = useDiscountApply();

  const hasError = !!formErrors?.length;
  const hasInputValue = discountCode.trim().length > 0;
  const isApplyDisabled =
    !hasInputValue || isPaymentDisabled || isSubmitting || !!isRemovingDiscount;

  const resolveErrorMessage = (error: string) => {
    if (
      error === t.discounts.alreadyApplied ||
      error === t.discounts.enterCodeValidation
    ) {
      return error;
    }

    return t.discounts.invalid ?? enUs.discounts.invalid;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDiscountCode(e.target.value.replace(/\s+/g, ''));
    setFormErrors(undefined);
  };

  const handleClearInput = () => {
    setDiscountCode('');
    setFormErrors(undefined);
  };

  const handleApply = async () => {
    if (!discountCode.trim()) {
      setFormErrors([t.discounts.enterCodeValidation]);
      return;
    }

    try {
      setIsSubmitting(true);
      const normalizedCode = discountCode.trim();

      if (currentDiscountCodes.includes(normalizedCode)) {
        setFormErrors([t.discounts.alreadyApplied]);
        return;
      }

      const newDiscountCodes = [...currentDiscountCodes, normalizedCode];
      await applyDiscount.mutateAsync({
        discountCodes: newDiscountCodes,
      });

      track({
        eventId: eventIds.applyCoupon,
        type: TrackingEventType.CLICK,
        properties: {
          success: true,
          discountCount: newDiscountCodes.length,
        },
      });

      onDiscountsChange?.(newDiscountCodes);
      setDiscountCode('');
      setFormErrors(undefined);
    } catch (error) {
      if (error instanceof GraphQLErrorWithCodes) {
        setFormErrors(error.codes);
        track({
          eventId: eventIds.discountError,
          type: TrackingEventType.EVENT,
          properties: {
            success: false,
            errorCodes: error.codes.join(','),
          },
        });
      } else {
        const genericError = new Error(t.discounts.failedToApply);
        setFormErrors([t.discounts.failedToApply]);
        onError?.(genericError);
        track({
          eventId: eventIds.discountError,
          type: TrackingEventType.EVENT,
          properties: {
            success: false,
            errorType: 'generic',
          },
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && discountCode.trim()) {
      e.preventDefault();
      handleApply();
    }
  };

  const handleRemoveDiscount = async (discountToRemove: string) => {
    const newDiscountCodes = currentDiscountCodes.filter(
      code => code !== discountToRemove
    );

    try {
      setIsRemovingDiscount(discountToRemove);
      await applyDiscount.mutateAsync({
        discountCodes: newDiscountCodes,
      });

      track({
        eventId: eventIds.removeDiscount,
        type: TrackingEventType.CLICK,
        properties: {
          success: true,
          discountCount: newDiscountCodes.length,
        },
      });

      onDiscountsChange?.(newDiscountCodes);
      setIsRemovingDiscount(undefined);
    } catch (error) {
      if (error instanceof GraphQLErrorWithCodes) {
        setFormErrors(error.codes);
        track({
          eventId: eventIds.discountError,
          type: TrackingEventType.EVENT,
          properties: {
            success: false,
            errorCodes: error.codes.join(','),
          },
        });
      } else {
        const genericError = new Error(t.discounts.failedToApply);
        setFormErrors([t.discounts.failedToApply]);
        onError?.(genericError);
        track({
          eventId: eventIds.discountError,
          type: TrackingEventType.EVENT,
          properties: {
            success: false,
            errorType: 'generic',
          },
        });
      }
    }
  };

  const label =
    t.discounts.haveACouponCode ?? enUs.discounts.haveACouponCode;
  const primaryError = formErrors?.[0]
    ? resolveErrorMessage(formErrors[0])
    : undefined;

  return (
    <div className='flex flex-col gap-2'>
      <label className='text-sm font-medium text-[#111111]'>{label}</label>

      {appliedDiscounts.length > 0 ? (
        <div className='flex flex-col gap-2'>
          {appliedDiscounts.map(discount => (
            <DiscountAppliedBar
              key={discount.code}
              code={discount.code}
              amount={discount.amount}
              currencyCode={discount.currencyCode}
              onRemove={() => handleRemoveDiscount(discount.code)}
              isRemoving={isRemovingDiscount === discount.code}
            />
          ))}
        </div>
      ) : null}

      <div className='flex flex-col gap-1.5'>
        <div
          className={cn(
            'flex h-14 items-center justify-between rounded-md border bg-white py-2 pl-4 pr-2',
            hasError
              ? 'border-[#EF4444]'
              : isFocused || hasInputValue
                ? 'border-[#2563EB]'
                : 'border-[#D1D5DB]'
          )}
        >
          <input
            type='text'
            value={discountCode}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={t.discounts.placeholder}
            disabled={isPaymentDisabled || !!isRemovingDiscount}
            className={cn(
              'min-w-0 flex-1 border-0 bg-transparent text-base text-[#111111] outline-none placeholder:text-[#9CA3AF] disabled:cursor-not-allowed disabled:opacity-50',
              elements?.input
            )}
          />

          {hasError ? (
            <div className='flex items-center gap-4'>
              <span className='h-6 w-px bg-[#D1D5DB]' aria-hidden='true' />
              <button
                type='button'
                className='flex h-6 w-6 items-center justify-center text-[#111111]'
                onClick={handleClearInput}
                aria-label={t.discounts.removeCoupon ?? enUs.discounts.removeCoupon}
              >
                <X className='h-4 w-4' />
              </button>
            </div>
          ) : (
            <button
              type='button'
              onClick={handleApply}
              disabled={isApplyDisabled}
              className={cn(
                'inline-flex h-10 shrink-0 items-center justify-center rounded-md px-6 text-sm font-semibold transition-colors',
                isApplyDisabled
                  ? 'cursor-not-allowed bg-[#E5E7EB] text-[#9CA3AF]'
                  : 'bg-[#2563EB] text-white hover:bg-[#2563EB]/90',
                elements?.button
              )}
            >
              {isSubmitting ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                t.discounts.apply
              )}
            </button>
          )}
        </div>

        {primaryError ? (
          <p className='text-[13px] font-medium leading-4 text-[#DC2626]'>
            {primaryError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
