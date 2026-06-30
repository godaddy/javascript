import type { ResultOf } from 'gql.tada';
import { GetEnabledStoreUiExtensionsQuery } from '@/lib/godaddy/checkout-queries';
import type {
  UiExtensionContext,
  UiExtensionInitialProps,
  UiExtensionRuntimeError,
  UiExtensionRuntimeType,
} from './runtime/types';

export type UiExtensionTargetId = string;

export interface UiExtension {
  id: string;
  applicationId?: string | null;
  releaseId?: string | null;
  name?: string | null;
  handle?: string | null;
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
  runtime?: Extract<UiExtensionRuntimeType, 'dom-bundle'>;
  initialProps?: UiExtensionInitialProps;
  locale?: string;
  currencyCode?: string;
  theme?: UiExtensionContext['theme'];
  onExtensionError?(error: UiExtensionRuntimeError): void;
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
