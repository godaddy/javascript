import type { UiExtension } from '../types';

export type UiExtensionRuntimeType = 'dom-bundle' | 'worker-sdk';

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
  /**
   * Asks the host to run an action, such as opening a page or saving a value.
   * The request and the host's result are structured-cloned on the way, so
   * neither side keeps a live reference to the other's objects. It resolves
   * with the host's result. It rejects with an `action_rejected` runtime error
   * when the host has no action handler, when the host rejects the action,
   * when the action name is missing, blank or has spaces around it, when
   * either value can't be cloned, or when the extension unmounts before
   * the host answers. A request rejected at unmount may still have run on the
   * host. Requests stop when unmount starts, so an `unmount` hook can't send
   * one, and a request awaited inside `mount` counts against the mount
   * timeout. Catch every call, including fire-and-forget ones, or a rejection
   * goes unhandled. The rejection value is a plain `UiExtensionRuntimeError`
   * object, not an `Error`.
   *
   * Optional because older hosts don't pass it, so check for it before
   * calling. The same function stays valid until unmount. Under `Target` and
   * `UiExtensionRuntimeHost` it always reaches the host's current committed
   * handler; the runtime alone keeps the handler it was mounted with.
   */
  requestAction?(request: UiExtensionActionRequest): Promise<unknown>;
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
  | 'unmount_failed'
  | 'protocol_error'
  | 'render_tree_invalid'
  | 'action_rejected';

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

export interface UiExtensionCapabilities {
  apiAccess?: boolean;
  stateManagement?: boolean;
  blockProgression?: boolean;
  checkoutData?: Array<'cart' | 'totals' | 'shipping' | 'customer'>;
}

export interface UiExtensionComponentNode {
  id?: string;
  type: string;
  props?: Record<string, unknown>;
  children?: Array<UiExtensionComponentNode | string>;
}

export type UiExtensionComponentTree = UiExtensionComponentNode;

export interface UiExtensionActionRequest {
  action: string;
  input?: unknown;
}

/**
 * Which extension sent an action request, so a host can scope or audit it.
 * The runtime builds it from the host's record of the extension, never from
 * anything the extension can change.
 */
export interface UiExtensionActionSource {
  extension: UiExtensionMetadata;
}

export interface UiExtensionRuntimeMountInput {
  extension: UiExtension;
  context: UiExtensionContext;
  initialProps?: UiExtensionInitialProps;
  capabilities?: UiExtensionCapabilities;
  apiHost?: string;
  container?: HTMLElement;
  onRender?(tree: UiExtensionComponentTree): void;
  onResize?(size: { height?: number; width?: number }): void;
  onError(error: UiExtensionRuntimeError): void;
  /**
   * Runs an action the extension requests through `requestAction`. The
   * `dom-bundle` runtime always passes `source`, built from the host's own
   * record of the extension; it is optional so runtimes that call this with
   * the request alone still compile. Without it, requests reject with an
   * `action_rejected` runtime error.
   *
   * A handler's failure goes only to the extension, as a generic rejection, so
   * a host that wants to log one catches it inside its handler. Resolve with
   * structured-cloneable values.
   */
  onActionRequest?(
    request: UiExtensionActionRequest,
    source?: UiExtensionActionSource
  ): Promise<unknown>;
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
