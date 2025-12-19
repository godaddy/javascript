'use client';

import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useGoDaddyContext } from '@/godaddy-provider';
import { normalizeApiHost, DEFAULT_API_HOST } from '@/lib/utils';

export type EntityType = 'STORE' | 'CUSTOMER';

export interface EnabledExtension {
  applicationId: string;
  releaseId: string;
  target: string;
}

export interface TargetProps {
  id: string;
  entityId: string;
  entityType: EntityType;
  minHeight?: number;
}

interface ExtensionResizeMessage {
  type: 'extension:resize';
  applicationId: string;
  releaseId: string;
  height: number;
}

interface EnabledExtensionsResponse {
  data: {
    enabledExtensions: EnabledExtension[];
  };
}

async function fetchEnabledExtensions(
  target: string,
  entityId: string,
  entityType: EntityType,
  apiHost: string,
  accessToken?: string
): Promise<EnabledExtension[]> {
  const baseUrl = normalizeApiHost(apiHost);
  const endpoint = `${baseUrl}/v1/apps/app-registry-subgraph`;

  const query = `
    query EnabledExtensions($entityId: String!, $entityType: EntityType!, $target: String!) {
      enabledExtensions(entityId: $entityId, entityType: $entityType, target: $target) {
        applicationId
        releaseId
        target
      }
    }
  `;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query,
      variables: {
        entityId,
        entityType,
        target,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch extensions: ${response.statusText}`);
  }

  const result: EnabledExtensionsResponse = await response.json();
  return result.data.enabledExtensions ?? [];
}

function buildExtensionUrl(
  applicationId: string,
  releaseId: string,
  apiHost: string
): string {
  return `https://cdn.ui-extensions.commerce.${apiHost}/${applicationId}/${releaseId}/index.html`;
}

function TargetError() {
  return (
    <div className="flex items-center justify-center p-4 text-sm text-destructive bg-destructive/10 rounded-md">
      Failed to load extension
    </div>
  );
}

function TargetLoading() {
  return <Skeleton className="h-16 w-full" />;
}

interface ExtensionIframeProps {
  extension: EnabledExtension;
  apiHost: string;
  height: number | undefined;
  minHeight: number;
}

function ExtensionIframe({
  extension,
  apiHost,
  height,
  minHeight,
}: ExtensionIframeProps) {
  const src = buildExtensionUrl(
    extension.applicationId,
    extension.releaseId,
    apiHost
  );

  return (
    <iframe
      src={src}
      title={`Extension ${extension.applicationId}`}
      className="w-full border-0"
      style={{ height: height ?? minHeight, minHeight }}
      sandbox="allow-scripts allow-same-origin"
    />
  );
}

const DEFAULT_MIN_HEIGHT = 200;

function isExtensionResizeMessage(data: unknown): data is ExtensionResizeMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    (data as ExtensionResizeMessage).type === 'extension:resize' &&
    'applicationId' in data &&
    'releaseId' in data &&
    'height' in data &&
    typeof (data as ExtensionResizeMessage).height === 'number'
  );
}

export function Target({
  id,
  entityId,
  entityType,
  minHeight = DEFAULT_MIN_HEIGHT,
}: TargetProps) {
  const { apiHost, accessToken } = useGoDaddyContext();
  const [heights, setHeights] = React.useState<Record<string, number>>({});

  const {
    data: extensions,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['enabled-extensions', id, entityId, entityType],
    queryFn: () =>
      fetchEnabledExtensions(
        id,
        entityId,
        entityType,
        apiHost || DEFAULT_API_HOST,
        accessToken
      ),
  });

  React.useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!isExtensionResizeMessage(event.data)) {
        return;
      }

      const { applicationId, releaseId, height } = event.data;
      const key = `${applicationId}-${releaseId}`;

      setHeights(prev => {
        if (prev[key] === height) {
          return prev;
        }
        return { ...prev, [key]: height };
      });
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (isLoading) {
    return <TargetLoading />;
  }

  if (isError) {
    return <TargetError />;
  }

  if (!extensions || extensions.length === 0) {
    return null;
  }

  const resolvedApiHost = apiHost || DEFAULT_API_HOST;

  return (
    <div className="flex flex-col gap-2">
      {extensions.map(extension => {
        const key = `${extension.applicationId}-${extension.releaseId}`;
        return (
          <ExtensionIframe
            key={key}
            extension={extension}
            apiHost={resolvedApiHost}
            height={heights[key]}
            minHeight={minHeight}
          />
        );
      })}
    </div>
  );
}
