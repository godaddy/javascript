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

const DEFAULT_TIMEOUT_MS = 3000;

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
  private metadata: UiExtensionMetadata | undefined;
  private timeoutMs: number;

  constructor(options: { timeoutMs?: number } = {}) {
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async mount(input: UiExtensionRuntimeMountInput) {
    const { container, context, extension, initialProps, onError } = input;
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

    const scriptUrlResult = getUiExtensionScriptUrl(extension);
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
      this.contract = contract;

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
    } catch (cause) {
      onError(
        isRuntimeError(cause)
          ? cause
          : createRuntimeError(extension, {
              code: 'mount_failed',
              message: 'Failed to mount UI extension.',
              cause,
            })
      );
    }
  }

  async update({ context, initialProps }: UiExtensionRuntimeUpdateInput) {
    if (!this.contract?.update || !this.extension || !this.metadata) {
      return;
    }

    try {
      await Promise.resolve(
        this.contract.update({
          context,
          initialProps,
          extension: this.metadata,
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
    if (!this.contract?.unmount || !this.extension) {
      return;
    }

    try {
      await Promise.resolve(this.contract.unmount());
    } catch (cause) {
      throw createRuntimeError(this.extension, {
        code: 'unmount_failed',
        message: 'Failed to unmount UI extension.',
        cause,
      });
    } finally {
      this.contract = undefined;
      this.extension = undefined;
      this.metadata = undefined;
    }
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
