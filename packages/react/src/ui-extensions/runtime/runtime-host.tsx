'use client';

import { Component, type ReactNode, useEffect, useMemo, useRef } from 'react';
import type { UiExtension } from '../types';
import { DomBundleUiExtensionRuntime } from './dom-bundle-runtime';
import type {
  UiExtensionContext,
  UiExtensionInitialProps,
  UiExtensionRuntime,
  UiExtensionRuntimeError,
  UiExtensionRuntimeType,
} from './types';

export interface UiExtensionRuntimeHostProps {
  extension: UiExtension;
  apiHost?: string;
  context: UiExtensionContext;
  initialProps?: UiExtensionInitialProps;
  runtimeType?: Extract<UiExtensionRuntimeType, 'dom-bundle'>;
  onError?(error: UiExtensionRuntimeError): void;
}

interface UiExtensionErrorBoundaryProps {
  children: ReactNode;
  extension: UiExtension;
  fallback?: ReactNode;
  onError?(error: UiExtensionRuntimeError): void;
}

function createUiExtensionRuntime(
  runtimeType: Extract<UiExtensionRuntimeType, 'dom-bundle'>
): UiExtensionRuntime {
  switch (runtimeType) {
    case 'dom-bundle':
    default:
      return new DomBundleUiExtensionRuntime();
  }
}

function getExtensionKey(extension: UiExtension) {
  return [
    extension.id,
    extension.applicationId || '',
    extension.releaseId || '',
    extension.target || '',
  ].join(':');
}

function createHostRuntimeError(
  extension: UiExtension,
  error: unknown,
  code: UiExtensionRuntimeError['code'],
  message: string
): UiExtensionRuntimeError {
  return error && typeof error === 'object' && 'code' in error
    ? (error as UiExtensionRuntimeError)
    : {
        code,
        message,
        runtimeType: 'dom-bundle',
        extensionId: extension.id,
        applicationId: extension.applicationId,
        releaseId: extension.releaseId,
        target: extension.target,
        cause: error,
      };
}

class UiExtensionErrorBoundary extends Component<UiExtensionErrorBoundaryProps> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    const { extension, onError } = this.props;

    onError?.(
      createHostRuntimeError(
        extension,
        error,
        'mount_failed',
        'UI extension runtime host failed to render.'
      )
    );
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }

    return this.props.children;
  }
}

function UiExtensionRuntimeHostContainer({
  apiHost,
  context,
  extension,
  initialProps,
  runtimeType = 'dom-bundle',
  onError,
}: UiExtensionRuntimeHostProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const runtimeRef = useRef<UiExtensionRuntime | undefined>(undefined);
  const onErrorRef = useRef(onError);
  const extensionKey = useMemo(() => getExtensionKey(extension), [extension]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    const runtime = createUiExtensionRuntime(runtimeType);
    runtimeRef.current = runtime;

    void runtime.mount({
      extension,
      apiHost,
      context,
      initialProps,
      container: containerRef.current || undefined,
      onError: error => onErrorRef.current?.(error),
    });

    return () => {
      runtimeRef.current = undefined;
      void Promise.resolve(runtime.unmount()).catch(error => {
        onErrorRef.current?.(
          createHostRuntimeError(
            extension,
            error,
            'unmount_failed',
            'Failed to unmount UI extension.'
          )
        );
      });
    };
  }, [apiHost, extensionKey, runtimeType]);

  useEffect(() => {
    void Promise.resolve(
      runtimeRef.current?.update({ context, initialProps })
    ).catch(error => {
      onErrorRef.current?.(
        createHostRuntimeError(
          extension,
          error,
          'update_failed',
          'Failed to update UI extension.'
        )
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

export function UiExtensionRuntimeHost(props: UiExtensionRuntimeHostProps) {
  return (
    <UiExtensionErrorBoundary
      extension={props.extension}
      onError={props.onError}
    >
      <UiExtensionRuntimeHostContainer {...props} />
    </UiExtensionErrorBoundary>
  );
}
