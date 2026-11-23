import type { UiExtension } from '../types';
import { getUiExtensionScriptUrl } from './script-url';
import type {
  DomExtensionContract,
  UiExtensionActionRequest,
  UiExtensionActionSource,
  UiExtensionMetadata,
  UiExtensionRuntime,
  UiExtensionRuntimeError,
  UiExtensionRuntimeMountInput,
  UiExtensionRuntimeUpdateInput,
} from './types';

const DEFAULT_TIMEOUT_MS = 5000;

const NOT_MOUNTED = 'UI extension is no longer mounted.';
const NO_HANDLER = 'The host does not handle UI extension actions.';

/**
 * What `UiExtensionRuntimeHost` rejects with when no handler is passed, so the
 * runtime can tell it from a host's own rejection. Not part of the public API.
 */
export const NO_ACTION_HANDLER: unique symbol = Symbol(
  'no UI extension action handler'
);

let scriptLoadQueue = Promise.resolve();

function enqueueScriptLoad<T>(task: () => Promise<T>): Promise<T> {
  const result = scriptLoadQueue.then(task, task);
  scriptLoadQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  getError: () => UiExtensionRuntimeError
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(getError()), timeoutMs);

    promise.then(
      value => {
        window.clearTimeout(timeout);
        resolve(value);
      },
      error => {
        window.clearTimeout(timeout);
        reject(error);
      }
    );
  });
}

function createRuntimeError(
  extension: UiExtension,
  error: Omit<UiExtensionRuntimeError, 'runtimeType' | 'extensionId'>
): UiExtensionRuntimeError {
  return {
    runtimeType: 'dom-bundle',
    extensionId: extension.id,
    applicationId: extension.applicationId,
    releaseId: extension.releaseId,
    target: extension.target,
    ...error,
  };
}

export function getExtensionMetadata(
  extension: UiExtension
): UiExtensionMetadata {
  return {
    id: extension.id,
    applicationId: extension.applicationId || '',
    releaseId: extension.releaseId || '',
    target: extension.target || '',
  };
}

function isDomExtensionContract(value: unknown): value is DomExtensionContract {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof (value as DomExtensionContract).mount === 'function'
  );
}

function loadRegisteredContract(
  scriptUrl: string,
  extension: UiExtension,
  timeoutMs: number
): Promise<DomExtensionContract> {
  return enqueueScriptLoad(
    () =>
      new Promise<DomExtensionContract>((resolve, reject) => {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
          reject(
            createRuntimeError(extension, {
              code: 'load_failed',
              message: 'UI extension scripts can only be loaded in a browser.',
            })
          );
          return;
        }

        const previousRegistry = window.GoDaddyUiExtensions;
        let registeredContract: unknown;
        let isSettled = false;
        const script = document.createElement('script');

        const cleanup = () => {
          window.clearTimeout(timeout);
          script.remove();

          if (previousRegistry) {
            window.GoDaddyUiExtensions = previousRegistry;
          } else {
            delete window.GoDaddyUiExtensions;
          }
        };

        const settle = (callback: () => void) => {
          if (isSettled) {
            return;
          }
          isSettled = true;
          cleanup();
          callback();
        };

        const timeout = window.setTimeout(() => {
          settle(() =>
            reject(
              createRuntimeError(extension, {
                code: 'registration_timeout',
                message: 'UI extension did not register before the timeout.',
              })
            )
          );
        }, timeoutMs);

        window.GoDaddyUiExtensions = {
          register(contract: unknown) {
            registeredContract = contract;
          },
        };

        script.async = true;
        script.src = scriptUrl;
        script.crossOrigin = 'anonymous';
        script.onload = () => {
          settle(() => {
            if (!isDomExtensionContract(registeredContract)) {
              reject(
                createRuntimeError(extension, {
                  code: 'invalid_module_contract',
                  message:
                    'UI extension bundle must register a contract with a mount function.',
                })
              );
              return;
            }

            resolve(registeredContract);
          });
        };
        script.onerror = () => {
          settle(() =>
            reject(
              createRuntimeError(extension, {
                code: 'load_failed',
                message: 'Failed to load UI extension script.',
              })
            )
          );
        };

        document.head.appendChild(script);
      })
  );
}

export class DomBundleUiExtensionRuntime implements UiExtensionRuntime {
  private acceptsActions = false;
  private contract: DomExtensionContract | undefined;
  private extension: UiExtension | undefined;
  private hasMounted = false;
  private isDisposed = false;
  private isMounting = false;
  private actionSource: UiExtensionActionSource | undefined;
  private metadata: UiExtensionMetadata | undefined;
  private mountId = 0;
  private onActionRequest: UiExtensionRuntimeMountInput['onActionRequest'];
  private pendingActions = new Set<() => void>();
  private pendingUpdate: UiExtensionRuntimeUpdateInput | undefined;
  private timeoutMs: number;
  // Bundles already unmounted, so a mount's own cleanup never unmounts one again.
  private unmountedBundles = new WeakSet<DomExtensionContract>();

  constructor(options: { timeoutMs?: number } = {}) {
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async mount(input: UiExtensionRuntimeMountInput) {
    const { apiHost, container, context, extension, initialProps, onError } =
      input;
    this.clearRuntimeState();
    this.isDisposed = false;
    this.extension = extension;
    this.onActionRequest = input.onActionRequest;
    this.mountId += 1;
    const mountId = this.mountId;

    if (!container) {
      onError(
        createRuntimeError(extension, {
          code: 'mount_failed',
          message: 'UI extension DOM bundle runtime requires a container.',
        })
      );
      return;
    }

    this.metadata = getExtensionMetadata(extension);
    this.actionSource = Object.freeze({
      extension: Object.freeze(getExtensionMetadata(extension)),
    });

    const scriptUrlResult = getUiExtensionScriptUrl(extension, apiHost);
    if (!scriptUrlResult.success) {
      onError(scriptUrlResult.error);
      return;
    }

    let loaded: DomExtensionContract | undefined;
    try {
      const contract = await loadRegisteredContract(
        scriptUrlResult.url,
        extension,
        this.timeoutMs
      );

      if (mountId !== this.mountId) {
        // A newer mount started while this one loaded; it owns the runtime.
        return;
      }

      if (this.isDisposed) {
        this.clearRuntimeState();
        return;
      }

      loaded = contract;
      // A bundle may register the same contract object on every load.
      this.unmountedBundles.delete(contract);
      this.contract = contract;
      this.isMounting = true;
      this.acceptsActions = true;

      await withTimeout(
        Promise.resolve(
          contract.mount({
            container,
            context,
            initialProps,
            extension: this.metadata,
            requestAction: request =>
              this.requestAction(extension, mountId, request),
          })
        ),
        this.timeoutMs,
        () =>
          createRuntimeError(extension, {
            code: 'mount_timeout',
            message: 'UI extension mount timed out.',
          })
      );

      if (mountId !== this.mountId) {
        await this.unmountSuperseded(extension, contract);
        return;
      }

      this.isMounting = false;
      this.hasMounted = true;

      if (this.isDisposed) {
        await this.unmount();
        return;
      }

      const pendingUpdate = this.pendingUpdate;
      if (
        pendingUpdate &&
        (pendingUpdate.context !== context ||
          pendingUpdate.initialProps !== initialProps)
      ) {
        await this.update(pendingUpdate);
        if (mountId !== this.mountId) {
          await this.unmountSuperseded(extension, contract);
        }
      }
    } catch (cause) {
      if (mountId !== this.mountId) {
        // A newer mount owns the runtime now, its contract and its action
        // channel included, so a superseded mount's failure leaves them alone
        // and only cleans up its own bundle.
        await this.unmountSuperseded(extension, loaded);
        return;
      }
      this.isMounting = false;
      // The host is told the mount failed, so nothing the extension asks for
      // while it is cleaned up reaches the host.
      this.stopActions();
      await this.cleanupFailedMount(extension, loaded);

      if (mountId !== this.mountId) {
        // A newer mount started while this one cleaned up; the runtime is its.
        return;
      }

      if (this.isDisposed) {
        this.clearRuntimeState();
        return;
      }

      onError(
        isRuntimeError(cause)
          ? cause
          : createRuntimeError(extension, {
              code: 'mount_failed',
              message: 'Failed to mount UI extension.',
              cause,
            })
      );
      this.clearRuntimeState();
    }
  }

  async update(input: UiExtensionRuntimeUpdateInput) {
    this.pendingUpdate = input;

    if (
      this.isDisposed ||
      !this.contract?.update ||
      !this.extension ||
      !this.metadata ||
      !this.hasMounted
    ) {
      return;
    }

    // Read before the wait: a remount may replace them while the bundle updates.
    const extension = this.extension;
    try {
      await withTimeout(
        Promise.resolve(
          this.contract.update({
            context: input.context,
            initialProps: input.initialProps,
            extension: this.metadata,
          })
        ),
        this.timeoutMs,
        () =>
          createRuntimeError(extension, {
            code: 'update_failed',
            message: 'UI extension update timed out.',
          })
      );
    } catch (cause) {
      throw createRuntimeError(extension, {
        code: 'update_failed',
        message: 'Failed to update UI extension.',
        cause,
      });
    }
  }

  async unmount() {
    // A mount started while this unmount waits on the bundle owns the runtime
    // by the time it finishes, so only the mount this call ended is cleared.
    const mountId = this.mountId;
    this.isDisposed = true;
    this.stopActions();

    if (this.isMounting && !this.hasMounted) {
      return;
    }

    if (!this.hasMounted) {
      this.clearRuntimeState();
      return;
    }

    const { contract, extension } = this;
    if (
      !contract?.unmount ||
      !extension ||
      // Already unmounted, by an earlier call or a failed mount's cleanup.
      this.unmountedBundles.has(contract)
    ) {
      this.clearRuntimeState();
      return;
    }

    this.unmountedBundles.add(contract);
    try {
      await withTimeout(
        Promise.resolve(contract.unmount()),
        this.timeoutMs,
        () =>
          createRuntimeError(extension, {
            code: 'unmount_failed',
            message: 'UI extension unmount timed out.',
          })
      );
    } catch (cause) {
      throw createRuntimeError(extension, {
        code: 'unmount_failed',
        message: 'Failed to unmount UI extension.',
        cause,
      });
    } finally {
      if (mountId === this.mountId) {
        this.clearRuntimeState();
      }
    }
  }

  // Unmounts the bundle of a mount a newer one replaced, leaving the runtime's
  // state, which belongs to the newer mount, alone.
  private unmountSuperseded(
    extension: UiExtension,
    contract: DomExtensionContract | undefined
  ) {
    // Nothing to report: the host has already moved on to the newer mount.
    return this.unmountQuietly(
      extension,
      contract,
      'Superseded UI extension cleanup timed out.'
    );
  }

  private cleanupFailedMount(
    extension: UiExtension,
    contract: DomExtensionContract | undefined
  ) {
    // Failures are ignored so the original mount error is reported.
    return this.unmountQuietly(
      extension,
      contract,
      'UI extension cleanup timed out after mount failure.'
    );
  }

  // Unmounts a bundle the runtime is done with, unless the host's unmount
  // already did, and swallows what goes wrong.
  private async unmountQuietly(
    extension: UiExtension,
    contract: DomExtensionContract | undefined,
    timeoutMessage: string
  ) {
    if (!contract?.unmount || this.unmountedBundles.has(contract)) {
      return;
    }
    this.unmountedBundles.add(contract);

    try {
      await withTimeout(
        Promise.resolve().then(() => contract.unmount?.()),
        this.timeoutMs,
        () =>
          createRuntimeError(extension, {
            code: 'unmount_failed',
            message: timeoutMessage,
          })
      );
    } catch {
      // See the callers.
    }
  }

  private requestAction(
    extension: UiExtension,
    mountId: number,
    request: unknown
  ): Promise<unknown> {
    const rejection = (message: string) =>
      createRuntimeError(extension, { code: 'action_rejected', message });
    const isCurrent = () =>
      this.acceptsActions && !this.isDisposed && mountId === this.mountId;

    if (!isCurrent()) {
      return Promise.reject(rejection(NOT_MOUNTED));
    }

    if (typeof structuredClone !== 'function') {
      return Promise.reject(
        rejection('This browser cannot pass UI extension action values.')
      );
    }

    // A structured clone, read once: a getter, a proxy or a later change on the
    // extension's object can't alter what the host checked.
    const action = cloneActionRequest(request);
    if (action === 'invalid') {
      return Promise.reject(
        rejection('UI extension action requests need an action name.')
      );
    }
    if (action === 'uncloneable') {
      return Promise.reject(
        rejection('UI extension action input must be structured-cloneable.')
      );
    }

    const handler = this.onActionRequest;
    if (!handler) {
      return Promise.reject(rejection(NO_HANDLER));
    }

    // Taken from the host's record at mount and frozen, so neither the
    // extension nor a later change to that record can pass a request off as
    // another extension's.
    const source = this.actionSource;
    if (!source) {
      return Promise.reject(rejection(NOT_MOUNTED));
    }

    return new Promise((resolve, reject) => {
      const cancel = () => reject(rejection(NOT_MOUNTED));
      this.pendingActions.add(cancel);
      const settle = (answer: () => void) => {
        if (!this.pendingActions.delete(cancel)) {
          return;
        }
        if (!isCurrent()) {
          reject(rejection(NOT_MOUNTED));
          return;
        }
        answer();
      };

      new Promise(run => run(handler(action, source))).then(
        result =>
          settle(() => {
            try {
              resolve(structuredClone(result));
            } catch {
              reject(
                rejection(
                  'The host answered with a value that cannot be cloned.'
                )
              );
            }
          }),
        cause =>
          settle(() =>
            // The host's reason stays with the host; the extension learns only
            // that the action was rejected.
            reject(
              rejection(
                cause === NO_ACTION_HANDLER
                  ? NO_HANDLER
                  : 'The host rejected the action.'
              )
            )
          )
      );
    });
  }

  private stopActions() {
    this.acceptsActions = false;
    const pending = [...this.pendingActions];
    this.pendingActions.clear();
    for (const cancel of pending) {
      cancel();
    }
  }

  private clearRuntimeState() {
    this.stopActions();
    this.contract = undefined;
    this.extension = undefined;
    this.hasMounted = false;
    this.isMounting = false;
    this.actionSource = undefined;
    this.metadata = undefined;
    this.onActionRequest = undefined;
    this.pendingUpdate = undefined;
  }
}

function cloneActionRequest(
  value: unknown
): UiExtensionActionRequest | 'invalid' | 'uncloneable' {
  if (!value || typeof value !== 'object') {
    return 'invalid';
  }
  let action: unknown;
  try {
    action = (value as UiExtensionActionRequest).action;
  } catch {
    return 'invalid';
  }
  // A blank name, or one with spaces around it, would never match a host's
  // action exactly.
  if (
    typeof action !== 'string' ||
    action.length === 0 ||
    action !== action.trim()
  ) {
    return 'invalid';
  }
  let input: unknown;
  try {
    input = (value as UiExtensionActionRequest).input;
    input = input === undefined ? undefined : structuredClone(input);
  } catch {
    return 'uncloneable';
  }
  return input === undefined ? { action } : { action, input };
}

function isRuntimeError(value: unknown): value is UiExtensionRuntimeError {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'code' in value &&
      'runtimeType' in value &&
      'extensionId' in value
  );
}
