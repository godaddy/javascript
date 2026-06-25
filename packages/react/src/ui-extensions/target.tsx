'use client';

import { useEffect, useMemo } from 'react';
import { useGoDaddyContext } from '@/godaddy-provider';
import { useEnabledStoreUiExtensions } from './hooks';
import { buildUiExtensionContext, UiExtensionRuntimeHost } from './runtime';
import type { TargetProps } from './types';

export function Target({
  id,
  apps,
  storeId,
  orderId,
  runtime = 'dom-bundle',
  initialProps,
  locale,
  currencyCode,
  theme,
  onExtensionError,
}: TargetProps) {
  const { debug } = useGoDaddyContext();
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
  const context = useMemo(
    () =>
      buildUiExtensionContext({
        id,
        storeId,
        orderId,
        locale,
        currencyCode,
        theme,
      }),
    [id, storeId, orderId, locale, currencyCode, theme]
  );

  useEffect(() => {
    if (!debug || !targetExtensions.length) return;

    // biome-ignore lint/suspicious/noConsole: debug mode intentionally exposes extension metadata to developers
    console.debug('[GoDaddy UI Extensions]', {
      target: id,
      uiExtensions: targetExtensions,
      context,
      initialPropKeys: initialProps ? Object.keys(initialProps) : [],
    });
  }, [debug, id, targetExtensions, context, initialProps]);

  if (targetExtensions.length) {
    return (
      <>
        {targetExtensions.map(extension => (
          <UiExtensionRuntimeHost
            context={context}
            extension={extension}
            initialProps={initialProps}
            key={extension.id}
            onError={onExtensionError}
            runtimeType={runtime}
          />
        ))}
      </>
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
