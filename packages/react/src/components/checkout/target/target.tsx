'use client';

import { type ReactNode, useMemo } from 'react';
import { useCheckoutContext } from '@/components/checkout/checkout';
import type { Target as CheckoutTarget } from '@/components/checkout/target/types';
import { useGoDaddyContext } from '@/godaddy-provider';
import { cn } from '@/lib/utils';
import type { CheckoutSession } from '@/types';
import { Target as UiExtensionTarget } from '@/ui-extensions/target';
import type { EnabledUiExtensionApp } from '@/ui-extensions/types';
import { groupAppsByUiExtensionTarget } from '@/ui-extensions/utils';

export function Target({ id }: { id: CheckoutTarget }) {
  const { debug } = useGoDaddyContext();
  const { targets, session } = useCheckoutContext();

  const target = targets?.[id];
  const enabledStoreApplications = (
    session as
      | (CheckoutSession & {
          enabledStoreApplications?: EnabledUiExtensionApp[] | null;
        })
      | null
      | undefined
  )?.enabledStoreApplications;
  const uiExtensionApps = useMemo(
    () => groupAppsByUiExtensionTarget(enabledStoreApplications)[id],
    [enabledStoreApplications, id]
  );

  if (!target && !uiExtensionApps?.length && !debug) {
    return null;
  }

  let content: ReactNode = null;
  if (target) {
    content = target(session);
  } else if (debug && !uiExtensionApps?.length) {
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
      {debug && target ? (
        <span className='text-xs text-blue-500'>{id}</span>
      ) : null}
      {content}
      {uiExtensionApps?.length ? (
        <UiExtensionTarget
          apps={uiExtensionApps}
          id={id}
          orderId={session?.draftOrder?.id ?? undefined}
          storeId={session?.storeId}
        />
      ) : null}
    </div>
  );
}
