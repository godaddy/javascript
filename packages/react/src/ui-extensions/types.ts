import type { ResultOf } from 'gql.tada';
import { GetEnabledApplicationsQuery } from '@/lib/godaddy/app-registry-queries';

export type UiExtensionTargetId = string;

export interface UiExtension {
  id: string;
  name?: string | null;
  handle?: string | null;
  source?: string | null;
  cdnUrl?: string | null;
  type: string;
  target?: string | null;
}

export interface UiExtensionAppRelease {
  id: string;
  version: string;
  uiExtensions: UiExtension[];
}

export interface EnabledUiExtensionApp {
  id: string;
  name: string;
  release?: UiExtensionAppRelease | null;
}

export interface EnabledStoreUiExtensionApp extends EnabledUiExtensionApp {
  uiExtensions: UiExtension[];
}

export interface TargetProps {
  id: UiExtensionTargetId;
  apps?: EnabledStoreUiExtensionApp[];
  token?: string;
  storeId?: string;
  orderId?: string;
}

export interface UseEnabledStoreUiExtensionAppsOptions {
  target: UiExtensionTargetId;
  token: string;
  storeId: string;
  enabled?: boolean;
}

export interface UseCheckoutUiExtensionAppsOptions {
  targets: UiExtensionTargetId[];
}

export type EnabledStoreUiExtensionAppsData = ResultOf<
  typeof GetEnabledApplicationsQuery
>;

export function withReleaseUiExtensions(
  app: EnabledUiExtensionApp
): EnabledStoreUiExtensionApp {
  return {
    ...app,
    uiExtensions: app.release?.uiExtensions || [],
  };
}
