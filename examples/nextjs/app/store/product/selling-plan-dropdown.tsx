'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSellingPlans } from '../actions';

/**
 * Resolve checkout price for the current SKU from the plan's catalogPrices.
 * API shape: plan.catalogPrices[] has { skuId, checkoutPrices: [{ value, currency }] }.
 * Picks the entry matching skuId and returns checkoutPrices[0] as { value, currencyCode }.
 * Value is in minor units (cents).
 */
function normalizeCheckoutPrice(
  plan: any,
  skuId: string | null
): { value: number; currencyCode?: string } | undefined {
  if (plan.checkoutPrice?.value != null) {
    return {
      value: Number(plan.checkoutPrice.value),
      currencyCode: plan.checkoutPrice.currencyCode ?? plan.checkoutPrice.currency,
    };
  }
  if (skuId && Array.isArray(plan.catalogPrices)) {
    const forSku = plan.catalogPrices.find((c: any) => c.skuId === skuId);
    const checkout = forSku?.checkoutPrices?.[0];
    if (checkout?.value != null) {
      return {
        value: Number(checkout.value),
        currencyCode: checkout.currencyCode ?? checkout.currency,
      };
    }
  }
  const first = plan.catalogPrices?.[0];
  const checkoutFirst = first?.checkoutPrices?.[0];
  if (checkoutFirst?.value != null) {
    return {
      value: Number(checkoutFirst.value),
      currencyCode: checkoutFirst.currencyCode ?? checkoutFirst.currency,
    };
  }
  if (plan.priceAtCheckout?.value != null) {
    return {
      value: Number(plan.priceAtCheckout.value),
      currencyCode: plan.priceAtCheckout.currencyCode ?? plan.priceAtCheckout.currency,
    };
  }
  return undefined;
}

export function SellingPlanDropdown({
  storeId,
  skuId,
  skuGroupId,
  selectedPlanId,
  onSelectionChange,
}: {
  storeId: string;
  skuId: string | null;
  skuGroupId: string | null;
  selectedPlanId: string | null;
  onSelectionChange: (planId: string | null, plan: any) => void;
}) {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * Loads selling plans from the selling-plans API for the current skuId/skuGroupId.
   *
   * Production note: This triggers one API call per product (or per PDP visit). To reduce
   * requests, consider a strategy to preload selling groups on the store list page: fetch 
   * groups for all visible skuIds and skuGroupIds once, pass the result (e.g. via context 
   * or cache) into this component.
   */ 
  const loadPlans = useCallback(async () => {
    if (!storeId || (!skuId && !skuGroupId)) {
      setPlans([]);
      return;
    }
    setLoading(true);
    try {
      const groups: any = await getSellingPlans(storeId, {
        skuIds: skuId ? [skuId] : [],
        skuGroupIds: skuGroupId ? [skuGroupId] : [],
      }) ?? [];
      // 1. Max 2 selling groups: one for skuId, one for skuGroupId
      // 2. Each group has sellingPlans and allocations
      // 3. Each allocation has resourceType (SKU | SKU_GROUP) and resourceId
      // 4. Prefer group that matches skuId; else group that matches skuGroupId; else []
      const forSku = groups?.find((g: any) =>
        (g.allocations ?? []).some(
          (a: any) => a.resourceType === 'SKU' && a.resourceId === skuId
        )
      );
      const forSkuGroup = groups?.find((g: any) =>
        (g.allocations ?? []).some(
          (a: any) =>
            a.resourceType === 'SKU_GROUP' && a.resourceId === skuGroupId
        )
      );
      const sellingPlans = (forSku ?? forSkuGroup)?.sellingPlans ?? [];
      setPlans(sellingPlans);
      if (sellingPlans.length === 0) {
        onSelectionChange(null, null);
      }
    } finally {
      setLoading(false);
    }
  }, [storeId, skuId, skuGroupId, onSelectionChange]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  if (loading || plans.length === 0) {
    return null;
  }

  const value = selectedPlanId ?? '';

  return (
    <div className='space-y-2'>
      <label className='text-sm font-medium text-foreground' htmlFor='selling-plan'>
        Subscription
      </label>
      <select
        id='selling-plan'
        className='flex h-10 w-full items-center justify-between rounded-md border border-border bg-input px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring'
        value={value}
        onChange={e => {
          const val = e.target.value;
          const raw = val ? plans.find(p => p.planId === val) ?? null : null;
          const plan = raw
            ? {
                ...raw,
                checkoutPrice: normalizeCheckoutPrice(raw, skuId),
              }
            : null;
          onSelectionChange(val || null, plan);
        }}
      >
        <option value=''>One-time purchase</option>
        {plans.map(p => (
          <option key={p.planId} value={p.planId}>
            {p.name ?? p.planId}
            {p.category ? ` · ${p.category}` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
