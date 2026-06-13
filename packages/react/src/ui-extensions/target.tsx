'use client';

import { useMemo } from 'react';
import { useEnabledStoreUiExtensionApps } from './hooks';
import type { TargetProps } from './types';
import { groupAppsByUiExtensionTarget } from './utils';

export function Target({ id, apps, token, storeId }: TargetProps) {
  const shouldQuery = !apps && Boolean(token && storeId);
  const { data, error, isLoading } = useEnabledStoreUiExtensionApps({
    target: id,
    token: token || '',
    storeId: storeId || '',
    enabled: shouldQuery,
  });

  const queriedApps = useMemo(
    () => groupAppsByUiExtensionTarget(data?.enabledApplications)[id],
    [data?.enabledApplications, id]
  );
  const targetApps = apps || queriedApps;

  if (targetApps?.length) {
    return (
      <pre>{JSON.stringify({ enabledApplications: targetApps }, null, 2)}</pre>
    );
  }

  if (error) {
    const message = error instanceof Error ? error.message : String(error);

    return <pre>{JSON.stringify({ error: message }, null, 2)}</pre>;
  }

  if (!shouldQuery || isLoading || !data) {
    return null;
  }

  return null;
}
