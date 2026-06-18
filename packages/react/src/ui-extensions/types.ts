import type { ResultOf } from 'gql.tada';
import { GetEnabledStoreUiExtensionsQuery } from '@/lib/godaddy/checkout-queries';

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
  storeId?: string;
  orderId?: string;
  apps?: EnabledStoreUiExtensionApp[];
}

export interface UseEnabledStoreUiExtensionsOptions {
  target: UiExtensionTargetId;
  storeId?: string;
  enabled?: boolean;
}

export interface UseCheckoutUiExtensionAppsOptions {
  targets: UiExtensionTargetId[];
}

export type EnabledStoreUiExtensionsData = ResultOf<
  typeof GetEnabledStoreUiExtensionsQuery
>;

export function withReleaseUiExtensions(
  app: EnabledUiExtensionApp
): EnabledStoreUiExtensionApp {
  return {
    ...app,
    uiExtensions: app.release?.uiExtensions || [],
  };
}
