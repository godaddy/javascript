'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { UiExtension } from '../types';
import { DomBundleUiExtensionRuntime } from './dom-bundle-runtime';
import type {
  UiExtensionContext,
  UiExtensionInitialProps,
  UiExtensionRuntimeError,
} from './types';

export interface UiExtensionRuntimeHostProps {
  extension: UiExtension;
  context: UiExtensionContext;
  initialProps?: UiExtensionInitialProps;
  onError?(error: UiExtensionRuntimeError): void;
}

function getExtensionKey(extension: UiExtension) {
  return [
    extension.id,
    extension.applicationId || '',
    extension.releaseId || '',
    extension.target || '',
  ].join(':');
}

export function UiExtensionRuntimeHost({
  context,
  extension,
  initialProps,
  onError,
}: UiExtensionRuntimeHostProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const runtimeRef = useRef<DomBundleUiExtensionRuntime | undefined>(undefined);
  const onErrorRef = useRef(onError);
  const extensionKey = useMemo(() => getExtensionKey(extension), [extension]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    const runtime = new DomBundleUiExtensionRuntime();
    runtimeRef.current = runtime;

    void runtime.mount({
      extension,
      context,
      initialProps,
      container: containerRef.current || undefined,
      onError: error => onErrorRef.current?.(error),
    });

    return () => {
      runtimeRef.current = undefined;
      void runtime.unmount().catch(error => {
        onErrorRef.current?.(
          error && typeof error === 'object' && 'code' in error
            ? (error as UiExtensionRuntimeError)
            : {
                code: 'unmount_failed',
                message: 'Failed to unmount UI extension.',
                runtimeType: 'dom-bundle',
                extensionId: extension.id,
                applicationId: extension.applicationId,
                releaseId: extension.releaseId,
                target: extension.target,
                cause: error,
              }
        );
      });
    };
  }, [extensionKey]);

  useEffect(() => {
    void runtimeRef.current?.update({ context, initialProps }).catch(error => {
      onErrorRef.current?.(
        error && typeof error === 'object' && 'code' in error
          ? (error as UiExtensionRuntimeError)
          : {
              code: 'update_failed',
              message: 'Failed to update UI extension.',
              runtimeType: 'dom-bundle',
              extensionId: extension.id,
              applicationId: extension.applicationId,
              releaseId: extension.releaseId,
              target: extension.target,
              cause: error,
            }
      );
    });
  }, [context, extension, initialProps]);

  return (
    <div
      data-gd-ui-extension-container='true'
      data-gd-ui-extension-id={extension.id}
      data-gd-ui-extension-target={extension.target || context.target}
      ref={containerRef}
    />
  );
}
