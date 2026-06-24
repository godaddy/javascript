import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UiExtension } from '../types';
import { DomBundleUiExtensionRuntime } from './dom-bundle-runtime';
import type { UiExtensionRuntimeError } from './types';

function createExtension(overrides: Partial<UiExtension> = {}): UiExtension {
  return {
    id: 'extension-1',
    applicationId: 'app-1',
    releaseId: 'release-1',
    cdnUrl: 'https://cdn.example.com',
    type: 'checkout',
    target: 'checkout.test-target',
    ...overrides,
  };
}

async function getLastScript() {
  await Promise.resolve();
  const scripts = document.querySelectorAll('script');
  return scripts[scripts.length - 1] as HTMLScriptElement;
}

describe('DomBundleUiExtensionRuntime', () => {
  afterEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete window.GoDaddyUiExtensions;
    vi.restoreAllMocks();
  });

  it('loads registered contract and mounts into container', async () => {
    const runtime = new DomBundleUiExtensionRuntime();
    const container = document.createElement('div');
    const errors: UiExtensionRuntimeError[] = [];
    const mountPromise = runtime.mount({
      extension: createExtension(),
      context: { target: 'checkout.test-target', storeId: 'store-1' },
      initialProps: { orderId: 'order-1' },
      container,
      onError: error => errors.push(error),
    });

    const script = await getLastScript();
    window.GoDaddyUiExtensions?.register({
      mount({ container: mountContainer, initialProps }) {
        mountContainer.textContent = String(initialProps?.orderId);
      },
    });
    script.dispatchEvent(new Event('load'));
    await mountPromise;

    expect(errors).toEqual([]);
    expect(container.textContent).toBe('order-1');
  });

  it('reports invalid contract errors', async () => {
    const runtime = new DomBundleUiExtensionRuntime();
    const errors: UiExtensionRuntimeError[] = [];
    const mountPromise = runtime.mount({
      extension: createExtension(),
      context: { target: 'checkout.test-target' },
      container: document.createElement('div'),
      onError: error => errors.push(error),
    });

    const script = await getLastScript();
    window.GoDaddyUiExtensions?.register({});
    script.dispatchEvent(new Event('load'));
    await mountPromise;

    expect(errors).toHaveLength(1);
    expect(errors[0]?.code).toBe('invalid_module_contract');
  });

  it('calls update and unmount on the registered contract', async () => {
    const runtime = new DomBundleUiExtensionRuntime();
    const container = document.createElement('div');
    const update = vi.fn();
    const unmount = vi.fn();
    const mountPromise = runtime.mount({
      extension: createExtension(),
      context: { target: 'checkout.test-target' },
      container,
      onError: () => undefined,
    });

    const script = await getLastScript();
    window.GoDaddyUiExtensions?.register({
      mount: vi.fn(),
      update,
      unmount,
    });
    script.dispatchEvent(new Event('load'));
    await mountPromise;

    await runtime.update({
      context: { target: 'checkout.test-target', orderId: 'order-1' },
      initialProps: { foo: 'bar' },
    });
    await runtime.unmount();

    expect(update).toHaveBeenCalledWith({
      context: { target: 'checkout.test-target', orderId: 'order-1' },
      initialProps: { foo: 'bar' },
      extension: {
        id: 'extension-1',
        applicationId: 'app-1',
        releaseId: 'release-1',
        target: 'checkout.test-target',
      },
    });
    expect(unmount).toHaveBeenCalled();
  });
});
