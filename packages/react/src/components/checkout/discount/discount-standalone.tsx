'use client';

import { enUs } from '@godaddy/localizations';
import { Loader2, X } from 'lucide-react';
import React, { useState } from 'react';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { DiscountAppliedBar } from '@/components/checkout/discount/discount-applied-bar';
import { useDiscountApply } from '@/components/checkout/discount/utils/use-discount-apply';
import { useDraftOrder } from '@/components/checkout/order/use-draft-order';
import { useIsPaymentDisabled } from '@/components/checkout/payment/utils/use-is-payment-disabled';
import { useGoDaddyContext } from '@/godaddy-provider';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';
import { cn } from '@/lib/utils';
import { eventIds } from '@/tracking/events';
import { TrackingEventType, track } from '@/tracking/track';
import type { DiscountFormProps } from './types';

export function DiscountStandalone({
  initialDiscounts = [],
  onDiscountsChange,
  onError,
}: DiscountFormProps) {
  const { t } = useGoDaddyContext();
  const { elements } = useCheckoutContext();
  const isPaymentDisabled = useIsPaymentDisabled();
  const { data: draftOrder } = useDraftOrder();

  const currentDiscountCodes = React.useMemo(() => {
    if (!draftOrder) return [];

    const allCodes = new Set<string>();

    if (draftOrder.discounts) {
      for (const discount of draftOrder.discounts) {
        if (discount.code) {
          allCodes.add(discount.code);
        }
      }
    }

    if (draftOrder.lineItems) {
      for (const lineItem of draftOrder.lineItems) {
        if (lineItem.discounts) {
          for (const discount of lineItem.discounts) {
            if (discount.code) {
              allCodes.add(discount.code);
            }
          }
        }
      }
    }

    if (draftOrder.shippingLines) {
      for (const shippingLine of draftOrder.shippingLines) {
        if (shippingLine.discounts) {
          for (const discount of shippingLine.discounts) {
            if (discount.code) {
              allCodes.add(discount.code);
            }
          }
        }
      }
    }

    return Array.from(allCodes);
  }, [draftOrder]);

  const discountAmountsByCode = React.useMemo(() => {
    const amounts = new Map<string, { amount: number; currencyCode: string }>();
    if (!draftOrder) return amounts;

    const addAmount = (discount: {
      code?: string | null;
      amount?: { value?: number | null; currencyCode?: string | null } | null;
    }) => {
      if (!discount.code) return;
      const existing = amounts.get(discount.code);
      const value = discount.amount?.value ?? 0;
      const currencyCode = discount.amount?.currencyCode ?? 'USD';
      if (existing) {
        existing.amount += value;
        return;
      }
      amounts.set(discount.code, { amount: value, currencyCode });
    };

    draftOrder.discounts?.forEach(addAmount);
    draftOrder.lineItems?.forEach(lineItem => {
      lineItem.discounts?.forEach(addAmount);
    });
    draftOrder.shippingLines?.forEach(shippingLine => {
      shippingLine.discounts?.forEach(addAmount);
    });

    return amounts;
  }, [draftOrder]);

  const [discountCode, setDiscountCode] = useState<string>('');
  const [formErrors, setFormErrors] = useState<string[] | undefined>(undefined);
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
      d => d !== discountToRemove
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

  const primaryError = (() => {
    const error = formErrors?.[0];
    if (!error) return undefined;
    if (
      error === t.discounts.alreadyApplied ||
      error === t.discounts.enterCodeValidation ||
      error === t.discounts.failedToApply
    ) {
      return error;
    }
    return (
      t.apiErrors?.[error as keyof typeof t.apiErrors] ||
      t.discounts.failedToApply ||
      enUs.discounts.failedToApply
    );
  })();

  return (
    <div className='flex flex-col gap-2'>
      {currentDiscountCodes.length > 0 && (
        <div className='flex flex-col gap-2'>
          {currentDiscountCodes.map(code => {
            const amountInfo = discountAmountsByCode.get(code);
            return (
              <DiscountAppliedBar
                key={code}
                code={code}
                amount={amountInfo?.amount ?? 0}
                currencyCode={amountInfo?.currencyCode ?? 'USD'}
                onRemove={() => handleRemoveDiscount(code)}
                isRemoving={isRemovingDiscount === code}
              />
            );
          })}
        </div>
      )}

      {currentDiscountCodes.length === 0 ? (
        <div className='flex flex-col gap-1.5'>
          <div
            className={cn(
              'flex h-12 items-center justify-between rounded-md border bg-input py-2 pl-3 pr-2',
              hasError
                ? 'border-destructive'
                : isFocused || hasInputValue
                  ? 'border-ring ring-1 ring-ring'
                  : 'border-border'
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
              aria-label={t.discounts.enterCode}
              disabled={isPaymentDisabled || !!isRemovingDiscount}
              className={cn(
                'min-w-0 flex-1 border-0 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                elements?.input
              )}
            />

            {hasError ? (
              <div className='flex items-center gap-4'>
                <span className='h-6 w-px bg-border' aria-hidden='true' />
                <button
                  type='button'
                  className='flex h-6 w-6 items-center justify-center text-foreground'
                  onClick={handleClearInput}
                  aria-label={`Clear ${discountCode}`}
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
                  'inline-flex h-9 shrink-0 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors',
                  isApplyDisabled
                    ? 'cursor-not-allowed bg-muted text-muted-foreground'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90',
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
            <p className='text-[0.8rem] font-medium text-destructive'>
              {primaryError}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
