'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getSellingPlans,
  type SellingPlanOption,
  type SellingPlanGroup,
} from '../actions';

interface SellingPlanDropdownProps {
  storeId: string;
  skuId: string | null;
  selectedPlanId: string | null;
  onSelectionChange: (planId: string | null, plan: SellingPlanOption | null) => void;
}

export function SellingPlanDropdown({
  storeId,
  skuId,
  selectedPlanId,
  onSelectionChange,
}: SellingPlanDropdownProps) {
  const [plans, setPlans] = useState<SellingPlanOption[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPlans = useCallback(async () => {
    if (!storeId || !skuId) {
      setPlans([]);
      return;
    }
    setLoading(true);
    try {
      const res = await getSellingPlans(storeId, { skuIds: [skuId] });
      const list =
        res.sellingPlanGroups?.flatMap((g: SellingPlanGroup) => g.sellingPlans ?? []) ?? [];
      setPlans(list);
      if (list.length === 0) {
        onSelectionChange(null, null);
      }
    } finally {
      setLoading(false);
    }
  }, [storeId, skuId]); // omit onSelectionChange so we don't refetch on every parent re-render

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  if (loading || !skuId || plans.length === 0) {
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
          const plan = val ? plans.find(p => p.planId === val) ?? null : null;
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
