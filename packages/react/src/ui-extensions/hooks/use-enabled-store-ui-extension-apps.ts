'use client';

import { useQuery } from '@tanstack/react-query';
import { useGoDaddyContext } from '@/godaddy-provider';
import { GetEnabledApplicationsQuery } from '@/lib/godaddy/app-registry-queries';
import { graphqlRequestWithErrors } from '@/lib/graphql-with-errors';
import type {
  EnabledStoreUiExtensionAppsData,
  UseEnabledStoreUiExtensionAppsOptions,
} from '../types';

const APP_REGISTRY_SUBGRAPH_PATH = '/v1/apps/app-registry-subgraph';

function getAppRegistrySubgraphEndpoint(apiHost?: string) {
  return `https://${apiHost || 'api.godaddy.com'}${APP_REGISTRY_SUBGRAPH_PATH}`;
}

function getEnabledStoreUiExtensionApps({
  apiHost,
  token,
  storeId,
  target,
}: UseEnabledStoreUiExtensionAppsOptions & {
  apiHost?: string;
}) {
  return graphqlRequestWithErrors<EnabledStoreUiExtensionAppsData>(
    getAppRegistrySubgraphEndpoint(apiHost),
    GetEnabledApplicationsQuery,
    {
      entityId: storeId,
      entityType: 'STORE',
      target,
    },
    {
      Authorization: `Bearer ${token}`,
      'x-entity-id': storeId,
      'x-entity-type': 'STORE',
    }
  );
}

export function useEnabledStoreUiExtensionApps({
  target,
  token,
  storeId,
  enabled = true,
}: UseEnabledStoreUiExtensionAppsOptions) {
  const { apiHost } = useGoDaddyContext();

  return useQuery({
    queryKey: ['ui-extension-target', apiHost, target, storeId, token],
    queryFn: () =>
      getEnabledStoreUiExtensionApps({
        apiHost,
        token,
        storeId,
        target,
      }),
    enabled: Boolean(enabled && target && token && storeId),
  });
}
