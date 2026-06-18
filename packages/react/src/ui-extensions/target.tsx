'use client';

import { useMemo } from 'react';
import { useEnabledStoreUiExtensions } from './hooks';
import type { TargetProps } from './types';

export function Target({ id, apps, storeId }: TargetProps) {
  const { data, error, isLoading } = useEnabledStoreUiExtensions({
    target: id,
    storeId,
    enabled: !apps,
  });

  const providedExtensions = useMemo(
    () =>
      apps?.flatMap(app =>
        app.uiExtensions.filter(extension => extension.target === id)
      ),
    [apps, id]
  );

  const targetExtensions = providedExtensions || data || [];

  if (targetExtensions.length) {
    return (
      <pre>{JSON.stringify({ uiExtensions: targetExtensions }, null, 2)}</pre>
    );
  }

  if (error) {
    const message = error instanceof Error ? error.message : String(error);

    return <pre>{JSON.stringify({ error: message }, null, 2)}</pre>;
  }

  if (isLoading) {
    return null;
  }

  return null;
}
