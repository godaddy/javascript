import { useMemo } from 'react';
import { DiscountStandalone } from '@/components/checkout/discount/discount-standalone';
import { Target } from '@/components/checkout/target/target';
import { TotalLineItemSkeleton } from '@/components/checkout/totals/totals-skeleton';
import { useFormatCurrency } from '@/components/checkout/utils/format-currency';
import { useGoDaddyContext } from '@/godaddy-provider';

export interface DraftOrderTotalsProps {
  subtotal?: number;
  discount?: number;
  isDiscountLoading?: boolean;
  shipping?: number;
  isShippingLoading?: boolean;
  totalSavings?: number;
  currencyCode?: string;
  itemCount?: number;
  total?: number;
  tip?: number;
  taxes?: number;
  isTaxLoading?: boolean;
  enableTaxes?: boolean | null;
  enableDiscounts?: boolean | null;
  enableShipping?: boolean | null;
  inputInMinorUnits?: boolean;
}

export interface TotalLineItemProps {
  title: string;
  description?: string;
  value: number;
  currencyCode?: string;
  inputInMinorUnits?: boolean;
}

export function TotalLineItem({
  title,
  description,
  value,
  currencyCode = 'USD',
  inputInMinorUnits = false,
}: TotalLineItemProps) {
  const formatCurrency = useFormatCurrency();

  return (
    <div className='flex justify-between text-sm'>
      <div className='flex flex-col gap-0.5'>
        <span>{title}</span>
        {description ? (
          <span className='text-xs text-muted-foreground'>{description}</span>
        ) : null}
      </div>
      <span>
        {formatCurrency({
          amount: value,
          currencyCode,
          inputInMinorUnits,
        })}
      </span>
    </div>
  );
}

export function DraftOrderTotals({
  subtotal = 0,
  discount = 0,
  shipping = 0,
  currencyCode = 'USD',
  itemCount = 0,
  total = 0,
  tip = 0,
  taxes = 0,
  enableDiscounts = false,
  enableTaxes = false,
  isTaxLoading = false,
  isShippingLoading = false,
  isDiscountLoading = false,
  enableShipping = true,
  inputInMinorUnits = false,
}: DraftOrderTotalsProps) {
  const { t } = useGoDaddyContext();
  const formatCurrency = useFormatCurrency();
  const handleDiscountsChange = (discounts: string[]) => {
    // Discount changes are handled by the DiscountStandalone component
  };

  // Calculates the total plus tips and surcharge
  const calculatedTotal = useMemo(() => {
    return total + tip;
  }, [total, tip]);

  return (
    <div className='grid gap-4'>
      <div className='space-y-2'>
        <Target id='checkout.summary.totals.subtotal.before' />
        <TotalLineItem
          currencyCode={currencyCode}
          title={t.totals.subtotal}
          description={
            itemCount > 0
              ? `${itemCount} ${t.totals.itemCount}`
              : t.totals.noItems
          }
          value={subtotal}
          inputInMinorUnits={inputInMinorUnits}
        />
        <Target id='checkout.summary.totals.discount.before' />
        {discount > 0 ? (
          isDiscountLoading ? (
            <TotalLineItemSkeleton title={t.totals.discount} />
          ) : (
            <TotalLineItem
              currencyCode={currencyCode}
              title={t.totals.discount}
              value={-discount || 0}
              inputInMinorUnits={inputInMinorUnits}
            />
          )
        ) : null}
        <Target id='checkout.summary.totals.shipping.before' />
        {enableShipping &&
          (isShippingLoading ? (
            <TotalLineItemSkeleton title={t.totals.shipping} />
          ) : (
            <TotalLineItem
              currencyCode={currencyCode}
              title={t.totals.shipping}
              value={shipping || 0}
              inputInMinorUnits={inputInMinorUnits}
            />
          ))}
        <Target id='checkout.summary.totals.tip.before' />
        {tip ? (
          <TotalLineItem
            currencyCode={currencyCode}
            title={t.totals.tip}
            value={tip || 0}
            inputInMinorUnits={inputInMinorUnits}
          />
        ) : null}
        <Target id='checkout.summary.totals.taxes.before' />
        {enableTaxes &&
          (isTaxLoading ? (
            <TotalLineItemSkeleton title={t.totals.estimatedTaxes} />
          ) : (
            <TotalLineItem
              currencyCode={currencyCode}
              title={t.totals.estimatedTaxes}
              value={taxes || 0}
              inputInMinorUnits={inputInMinorUnits}
            />
          ))}
        <Target id='checkout.summary.totals.after' />
      </div>

      {enableDiscounts ? (
        <div className='mt-0'>
          <DiscountStandalone
            initialDiscounts={[]}
            onDiscountsChange={handleDiscountsChange}
            onError={() => {
              // Error is handled by the discount component internally
            }}
          />
        </div>
      ) : null}

      <Target id='checkout.summary.totals.total-due.before' />
      <div className='border-t border-border pt-4'>
        <div className='flex justify-between items-end'>
          <span className='text-sm'>{t.totals.totalDue}</span>
          <div className='text-right'>
            <span className='text-xs text-muted-foreground'>
              {currencyCode}{' '}
            </span>
            <span className='font-bold text-lg'>
              {formatCurrency({
                amount: calculatedTotal,
                currencyCode,
                inputInMinorUnits,
              })}
            </span>
          </div>
        </div>
      </div>
      <Target id='checkout.summary.totals.total-due.after' />
    </div>
  );
}
