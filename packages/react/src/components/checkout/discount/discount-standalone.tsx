'use client';

import React, { useState } from 'react';
import { DiscountApplyButton } from '@/components/checkout/discount/discount-apply-button';
import { DiscountErrorList } from '@/components/checkout/discount/discount-error-list';
import { DiscountInput } from '@/components/checkout/discount/discount-input';
import { useDiscountApply } from '@/components/checkout/discount/utils/use-discount-apply';
import { useDraftOrder } from '@/components/checkout/order/use-draft-order';
import { useIsPaymentDisabled } from '@/components/checkout/payment/utils/use-is-payment-disabled';
import { useGoDaddyContext } from '@/godaddy-provider';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';
import { eventIds } from '@/tracking/events';
import { TrackingEventType, track } from '@/tracking/track';
import { Discounts } from './discounts';
import type { DiscountFormProps } from './types';

export function DiscountStandalone({
  initialDiscounts = [],
  onDiscountsChange,
  onError,
}: DiscountFormProps) {
  const { t } = useGoDaddyContext();
  const isPaymentDisabled = useIsPaymentDisabled();
  const { data: draftOrder } = useDraftOrder();

  // Get current discount codes from order-level, line item-level, and shipping line-level discounts
  const currentDiscountCodes = React.useMemo(() => {
    if (!draftOrder) return [];

    const allCodes = new Set<string>();

    // Add order-level discount codes
    if (draftOrder.discounts) {
      for (const discount of draftOrder.discounts) {
        if (discount.code) {
          allCodes.add(discount.code);
        }
      }
    }

    // Add line item-level discount codes
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

    // Add shipping line-level discount codes
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

  const [discountCode, setDiscountCode] = useState<string>('');
  const [formErrors, setFormErrors] = useState<string[] | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRemovingDiscount, setIsRemovingDiscount] = useState<
    string | undefined
  >(undefined);
  const applyDiscount = useDiscountApply();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDiscountCode(e.target.value);
    setFormErrors(undefined);
  };

  const handleApply = async () => {
    // Validation

    if (!discountCode.trim()) {
      setFormErrors([t.discounts.enterCodeValidation]);
      return;
    }

    try {
      setIsSubmitting(true);
      // Normalize the discount code to uppercase for consistency
      const normalizedCode = discountCode.trim();

      // Check if the code already exists
      if (currentDiscountCodes.includes(normalizedCode)) {
        setFormErrors([t.discounts.alreadyApplied]);
        return;
      }

      // Apply discount with current codes + new code
      const newDiscountCodes = [...currentDiscountCodes, normalizedCode];
      await applyDiscount.mutateAsync({
        discountCodes: newDiscountCodes,
      });

      // Track successful discount application
      track({
        eventId: eventIds.applyCoupon,
        type: TrackingEventType.CLICK,
        properties: {
          success: true,
          discountCount: newDiscountCodes.length,
        },
      });

      // Call the change handler if provided
      onDiscountsChange?.(newDiscountCodes);

      // Reset the input
      setDiscountCode('');
      setFormErrors(undefined);
    } catch (error) {
      if (error instanceof GraphQLErrorWithCodes) {
        setFormErrors(error.codes);

        // Track discount error
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

        // Track generic discount error
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

      // Track discount removal
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

        // Track discount error
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

        // Track generic discount error
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

  return (
    <div>
      <div className='flex gap-2 items-start'>
        <div className='flex-1 m-0'>
          <DiscountInput
            value={discountCode}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={t.discounts.placeholder}
            hasError={!!formErrors?.length}
            className='h-12'
            disabled={isPaymentDisabled || !!isRemovingDiscount}
          />
        </div>
        <DiscountApplyButton
          onClick={handleApply}
          isSubmitting={isSubmitting}
          disabled={!discountCode.trim() || isPaymentDisabled}
          className='h-12 px-4'
        />
      </div>
      <DiscountErrorList checkoutErrors={formErrors} />

      {currentDiscountCodes.length > 0 && (
        <div className='mt-2'>
          <Discounts
            discounts={currentDiscountCodes}
            onRemove={handleRemoveDiscount}
            isRemovingDiscount={isRemovingDiscount}
          />
        </div>
      )}
    </div>
  );
}
