import type { UiExtension } from '../types';
import { getUiExtensionScriptUrl } from './script-url';
import type {
  DomExtensionContract,
  UiExtensionMetadata,
  UiExtensionRuntime,
  UiExtensionRuntimeError,
  UiExtensionRuntimeMountInput,
  UiExtensionRuntimeUpdateInput,
} from './types';

const DEFAULT_TIMEOUT_MS = 5000;

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

function getExtensionMetadata(extension: UiExtension): UiExtensionMetadata {
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
  private contract: DomExtensionContract | undefined;
  private extension: UiExtension | undefined;
  private hasMounted = false;
  private isDisposed = false;
  private isMounting = false;
  private metadata: UiExtensionMetadata | undefined;
  private pendingUpdate: UiExtensionRuntimeUpdateInput | undefined;
  private timeoutMs: number;

  constructor(options: { timeoutMs?: number } = {}) {
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async mount(input: UiExtensionRuntimeMountInput) {
    const { apiHost, container, context, extension, initialProps, onError } =
      input;
    this.clearRuntimeState();
    this.isDisposed = false;
    this.extension = extension;

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

    const scriptUrlResult = getUiExtensionScriptUrl(extension, apiHost);
    if (!scriptUrlResult.success) {
      onError(scriptUrlResult.error);
      return;
    }

    try {
      const contract = await loadRegisteredContract(
        scriptUrlResult.url,
        extension,
        this.timeoutMs
      );

      if (this.isDisposed) {
        this.clearRuntimeState();
        return;
      }

      this.contract = contract;
      this.isMounting = true;

      await withTimeout(
        Promise.resolve(
          contract.mount({
            container,
            context,
            initialProps,
            extension: this.metadata,
          })
        ),
        this.timeoutMs,
        () =>
          createRuntimeError(extension, {
            code: 'mount_timeout',
            message: 'UI extension mount timed out.',
          })
      );

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
      }
    } catch (cause) {
      this.isMounting = false;
      await this.cleanupFailedMount();

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
          createRuntimeError(this.extension as UiExtension, {
            code: 'update_failed',
            message: 'UI extension update timed out.',
          })
      );
    } catch (cause) {
      throw createRuntimeError(this.extension, {
        code: 'update_failed',
        message: 'Failed to update UI extension.',
        cause,
      });
    }
  }

  async unmount() {
    this.isDisposed = true;

    if (this.isMounting && !this.hasMounted) {
      return;
    }

    if (!this.hasMounted) {
      this.clearRuntimeState();
      return;
    }

    if (!this.contract?.unmount || !this.extension) {
      this.clearRuntimeState();
      return;
    }

    try {
      await withTimeout(
        Promise.resolve(this.contract.unmount()),
        this.timeoutMs,
        () =>
          createRuntimeError(this.extension as UiExtension, {
            code: 'unmount_failed',
            message: 'UI extension unmount timed out.',
          })
      );
    } catch (cause) {
      throw createRuntimeError(this.extension, {
        code: 'unmount_failed',
        message: 'Failed to unmount UI extension.',
        cause,
      });
    } finally {
      this.clearRuntimeState();
    }
  }

  private async cleanupFailedMount() {
    if (!this.contract?.unmount || !this.extension) {
      return;
    }

    try {
      await withTimeout(
        Promise.resolve(this.contract.unmount()),
        this.timeoutMs,
        () =>
          createRuntimeError(this.extension as UiExtension, {
            code: 'unmount_failed',
            message: 'UI extension cleanup timed out after mount failure.',
          })
      );
    } catch {
      // Ignore cleanup failures so the original mount error is reported.
    }
  }

  private clearRuntimeState() {
    this.contract = undefined;
    this.extension = undefined;
    this.hasMounted = false;
    this.isMounting = false;
    this.metadata = undefined;
    this.pendingUpdate = undefined;
  }
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
