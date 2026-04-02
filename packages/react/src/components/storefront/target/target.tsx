'use client';

import { useGoDaddyContext } from '@/godaddy-provider';
import { cn } from '@/lib/utils';
import { useProductDetailsContext } from '../product-details-context';

export type ProductDetailsTarget =
  | 'product-details.before'
  | 'product-details.after'
  | 'product-details.media.before'
  | 'product-details.media.after'
  | 'product-details.title.before'
  | 'product-details.title.after'
  | 'product-details.description.before'
  | 'product-details.description.after'
  | 'product-details.attributes.before'
  | 'product-details.attributes.after'
  | 'product-details.quantity.before'
  | 'product-details.quantity.after'
  | 'product-details.add-to-cart.before'
  | 'product-details.add-to-cart.after'
  | 'product-details.metadata.before'
  | 'product-details.metadata.after';

export function ProductDetailsTargetSlot({
  id,
}: {
  id: ProductDetailsTarget;
}) {
  const { debug } = useGoDaddyContext();
  const { targets, skuId, storeId } = useProductDetailsContext();

  const target = targets?.[id];

  let content: React.ReactNode = null;
  if (target) {
    content = target({ skuId, storeId });
  } else if (debug) {
    content = <span className='text-xs text-blue-500'>{id}</span>;
  }

  return (
    <div
      id={id}
      className={cn(
        debug && 'border border-dashed border-blue-300 p-3 rounded-md',
        'm-0'
      )}
    >
      {content}
    </div>
  );
}
