'use client';

import { useQuery } from '@tanstack/react-query';
import { useGoDaddyContext } from '@/godaddy-provider';
import { getEnabledStoreUiExtensions } from '@/lib/godaddy/godaddy';
import type { UseEnabledStoreUiExtensionsOptions } from '../types';

export function useEnabledStoreUiExtensions({
  target,
  storeId,
  enabled = true,
}: UseEnabledStoreUiExtensionsOptions) {
  const { apiHost, storeId: contextStoreId } = useGoDaddyContext();
  const resolvedStoreId = storeId || contextStoreId || '';

  return useQuery({
    queryKey: ['ui-extension-target', apiHost, target, resolvedStoreId],
    queryFn: () =>
      getEnabledStoreUiExtensions(
        {
          storeId: resolvedStoreId,
          target,
        },
        apiHost
      ),
    enabled: Boolean(enabled && target && resolvedStoreId),
  });
}
