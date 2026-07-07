'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useGoDaddyContext } from '@/godaddy-provider';
import { useEnabledStoreUiExtensions } from './hooks';
import { buildUiExtensionContext, UiExtensionRuntimeHost } from './runtime';
import type { TargetProps, UiExtension } from './types';

function getInitialPropKeys(initialProps?: Record<string, unknown>) {
  return initialProps ? Object.keys(initialProps).sort() : [];
}

function getDiscoveryErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getDiscoveryErrorSignature(id: string, error: unknown) {
  return JSON.stringify({ target: id, error: getDiscoveryErrorMessage(error) });
}

function getDebugLogSignature({
  context,
  id,
  initialPropKeys,
  targetExtensions,
}: {
  context: unknown;
  id: string;
  initialPropKeys: string[];
  targetExtensions: UiExtension[];
}) {
  return JSON.stringify({
    target: id,
    extensionKeys: targetExtensions.map(extension => [
      extension.id,
      extension.applicationId,
      extension.releaseId,
      extension.target,
    ]),
    context,
    initialPropKeys,
  });
}

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
  const { apiHost, debug } = useGoDaddyContext();
  const lastDebugLogSignatureRef = useRef<string | undefined>(undefined);
  const lastDiscoveryErrorSignatureRef = useRef<string | undefined>(undefined);
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
    if (!error) return;

    const signature = getDiscoveryErrorSignature(id, error);
    if (lastDiscoveryErrorSignatureRef.current === signature) {
      return;
    }

    lastDiscoveryErrorSignatureRef.current = signature;

    onExtensionError?.({
      code: 'load_failed',
      message: `Failed to discover UI extensions: ${getDiscoveryErrorMessage(error)}`,
      runtimeType: 'dom-bundle',
      extensionId: id,
      target: id,
      cause: error,
    });
  }, [error, id, onExtensionError]);

  useEffect(() => {
    if (!debug || !targetExtensions.length) return;

    const initialPropKeys = getInitialPropKeys(initialProps);
    const signature = getDebugLogSignature({
      context,
      id,
      initialPropKeys,
      targetExtensions,
    });

    if (lastDebugLogSignatureRef.current === signature) {
      return;
    }

    lastDebugLogSignatureRef.current = signature;

    // biome-ignore lint/suspicious/noConsole: debug mode intentionally exposes extension metadata to developers
    console.info('[GoDaddy UI Extensions]', {
      target: id,
      uiExtensions: targetExtensions,
      context,
      initialPropKeys,
    });
  }, [debug, id, targetExtensions, context, initialProps]);

  if (targetExtensions.length) {
    return (
      <>
        {targetExtensions.map(extension => (
          <UiExtensionRuntimeHost
            apiHost={apiHost}
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
    return null;
  }

  if (isLoading) {
    return null;
  }

  return null;
}
