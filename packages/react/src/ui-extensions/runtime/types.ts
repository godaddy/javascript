import type { UiExtension } from '../types';

export type UiExtensionRuntimeType = 'debug' | 'dom-bundle' | 'worker-sdk';

export type UiExtensionInitialProps = Record<string, unknown>;

export interface UiExtensionContext {
  target: string;
  storeId?: string;
  orderId?: string;
  locale?: string;
  currencyCode?: string;
  theme?: {
    name?: string;
    variables?: Record<string, string>;
  };
}

export interface UiExtensionMetadata {
  id: string;
  applicationId: string;
  releaseId: string;
  target: string;
}

export interface DomExtensionMountInput {
  container: HTMLElement;
  context: UiExtensionContext;
  initialProps?: UiExtensionInitialProps;
  extension: UiExtensionMetadata;
}

export interface DomExtensionUpdateInput {
  context: UiExtensionContext;
  initialProps?: UiExtensionInitialProps;
  extension: UiExtensionMetadata;
}

export interface DomExtensionContract {
  mount(input: DomExtensionMountInput): void | Promise<void>;
  update?(input: DomExtensionUpdateInput): void | Promise<void>;
  unmount?(): void | Promise<void>;
}

export type UiExtensionRuntimeErrorCode =
  | 'missing_required_field'
  | 'invalid_script_url'
  | 'load_failed'
  | 'registration_timeout'
  | 'invalid_module_contract'
  | 'mount_timeout'
  | 'mount_failed'
  | 'update_failed'
  | 'unmount_failed';

export interface UiExtensionRuntimeError {
  code: UiExtensionRuntimeErrorCode;
  message: string;
  runtimeType: Extract<UiExtensionRuntimeType, 'dom-bundle' | 'worker-sdk'>;
  extensionId: string;
  applicationId?: string | null;
  releaseId?: string | null;
  target?: string | null;
  cause?: unknown;
}

export interface UiExtensionRuntimeMountInput {
  extension: UiExtension;
  context: UiExtensionContext;
  initialProps?: UiExtensionInitialProps;
  container?: HTMLElement;
  onError(error: UiExtensionRuntimeError): void;
}

export interface UiExtensionRuntimeUpdateInput {
  context: UiExtensionContext;
  initialProps?: UiExtensionInitialProps;
}

export interface UiExtensionRuntime {
  mount(input: UiExtensionRuntimeMountInput): void | Promise<void>;
  update(input: UiExtensionRuntimeUpdateInput): void | Promise<void>;
  unmount(): void | Promise<void>;
}

type GoDaddyUiExtensionsRegistry = {
  register(contract: unknown): void;
};

declare global {
  interface Window {
    GoDaddyUiExtensions?: GoDaddyUiExtensionsRegistry;
  }
}
