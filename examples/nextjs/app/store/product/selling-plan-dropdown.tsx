'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSellingSellingPlans } from '../actions';

interface SellingPlanDropdownProps {
  storeId: string;
  /** SKU id (in this app the product page URL productId is the SKU id) */
  skuId: string;
  selectedPlanId: string | null;
  onSelectionChange: (planId: string | null) => void;
  disabled?: boolean;
}

export function SellingPlanDropdown({
  storeId,
  skuId,
  selectedPlanId,
  onSelectionChange,
  disabled = false,
}: SellingPlanDropdownProps) {
  const [options, setOptions] = useState<Array<{ planId: string; name: string; category?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOptions = useCallback(async () => {
    if (!storeId || !skuId) {
      setLoading(false);
      setOptions([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getSellingSellingPlans(storeId, { skuIds: [skuId] });
      const list: Array<{ planId: string; name: string; category?: string }> = [];
      const groups = Array.isArray(data)
        ? data
        : data?.groups ?? data?.sellingGroups ?? [];
      for (const group of groups) {
        const plans = group?.sellingPlans ?? group?.selling_plans ?? [];
        if (Array.isArray(plans) && plans.length) {
          for (const plan of plans) {
            const planId = plan?.planId ?? plan?.id ?? plan?.plan_id;
            const name = plan?.name ?? plan?.displayName ?? '';
            if (planId && name) {
              list.push({
                planId: String(planId),
                name: String(name),
                category: plan?.category ?? plan?.planCategory,
              });
            }
          }
        }
      }
      setOptions(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load selling plans');
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [storeId, skuId]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  // Reset selection when SKU changes (e.g. variant change) so we don't carry over a plan from another variant
  useEffect(() => {
    onSelectionChange(null);
  }, [skuId]); // eslint-disable-line react-hooks/exhaustive-deps -- only reset when skuId changes

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    const next = v === '' ? null : v;
    if (next === selectedPlanId) return;
    onSelectionChange(next);
  };

  // Hide while loading, on error, or when API returns no plans
  if (loading || error || options.length === 0) {
    return null;
  }

  return (
    <div className='rounded-lg border border-border bg-muted/30 px-3 py-3'>
      <h3 className='text-sm font-medium text-foreground mb-1'>
        Selling plan options
      </h3>
      <p className='text-xs text-muted-foreground mb-2'>
        Default is one-time purchase. Optionally choose a subscription plan.
      </p>
      <select
        id={`selling-plan-${skuId}`}
        value={selectedPlanId ?? ''}
        onChange={handleChange}
        disabled={disabled}
        aria-label='Choose purchase option'
        className='w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50'
      >
        <option value=''>One-time purchase</option>
        {options.map(plan => (
          <option key={plan.planId} value={plan.planId}>
            {plan.name}
            {plan.category ? ` · ${plan.category}` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
