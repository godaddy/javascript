import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UiExtension } from '../types';
import { DomBundleUiExtensionRuntime } from './dom-bundle-runtime';
import type {
  DomExtensionContract,
  DomExtensionMountInput,
  UiExtensionActionRequest,
  UiExtensionRuntimeError,
  UiExtensionRuntimeMountInput,
} from './types';

function createExtension(overrides: Partial<UiExtension> = {}): UiExtension {
  return {
    id: 'extension-1',
    applicationId: 'app-1',
    releaseId: 'release-1',
    cdnUrl: 'https://malicious.example.com',
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
    expect(script.src).toBe(
      'https://cdn.ui-extensions.commerce.godaddy.com/apps/targets/checkout.test-target/app-1/release-1/index.js'
    );
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

  it('calls unmount when mount fails after invoking the contract', async () => {
    const runtime = new DomBundleUiExtensionRuntime();
    const unmount = vi.fn();
    const errors: UiExtensionRuntimeError[] = [];
    const mountPromise = runtime.mount({
      extension: createExtension(),
      context: { target: 'checkout.test-target' },
      container: document.createElement('div'),
      onError: error => errors.push(error),
    });

    const script = await getLastScript();
    window.GoDaddyUiExtensions?.register({
      mount() {
        throw new Error('mount failed');
      },
      unmount,
    });
    script.dispatchEvent(new Event('load'));
    await mountPromise;

    expect(errors).toHaveLength(1);
    expect(errors[0]?.code).toBe('mount_failed');
    expect(unmount).toHaveBeenCalled();
  });

  it('does not mount when unmounted before the script loads', async () => {
    const runtime = new DomBundleUiExtensionRuntime();
    const mount = vi.fn();
    const errors: UiExtensionRuntimeError[] = [];
    const mountPromise = runtime.mount({
      extension: createExtension(),
      context: { target: 'checkout.test-target' },
      container: document.createElement('div'),
      onError: error => errors.push(error),
    });

    const script = await getLastScript();
    await runtime.unmount();
    window.GoDaddyUiExtensions?.register({ mount });
    script.dispatchEvent(new Event('load'));
    await mountPromise;

    expect(errors).toEqual([]);
    expect(mount).not.toHaveBeenCalled();
  });

  async function mountWithContract(
    contract: (
      capture: (input: DomExtensionMountInput) => void
    ) => DomExtensionContract,
    onActionRequest?: UiExtensionRuntimeMountInput['onActionRequest']
  ) {
    const runtime = new DomBundleUiExtensionRuntime({ timeoutMs: 50 });
    let mountInput: DomExtensionMountInput | undefined;
    const mountPromise = runtime.mount({
      extension: createExtension(),
      context: { target: 'checkout.test-target' },
      container: document.createElement('div'),
      onError: () => undefined,
      onActionRequest,
    });

    const script = await getLastScript();
    window.GoDaddyUiExtensions?.register(
      contract(input => {
        mountInput = input;
      })
    );
    script.dispatchEvent(new Event('load'));
    await mountPromise;

    if (!mountInput?.requestAction) {
      throw new Error('mount input has no requestAction');
    }

    return { runtime, mountInput, requestAction: mountInput.requestAction };
  }

  function mountWithActions(
    onActionRequest?: UiExtensionRuntimeMountInput['onActionRequest']
  ) {
    return mountWithContract(
      capture => ({
        mount: capture,
      }),
      onActionRequest
    );
  }

  const extensionMetadata = {
    id: 'extension-1',
    applicationId: 'app-1',
    releaseId: 'release-1',
    target: 'checkout.test-target',
  };

  it('passes action requests to the host handler with the extension that sent them', async () => {
    const onActionRequest = vi.fn().mockResolvedValue({ saved: true });
    const { requestAction } = await mountWithActions(onActionRequest);

    await expect(
      requestAction({ action: 'settings.open', input: { section: 'tax' } })
    ).resolves.toEqual({ saved: true });
    expect(onActionRequest).toHaveBeenCalledWith(
      { action: 'settings.open', input: { section: 'tax' } },
      { extension: extensionMetadata }
    );
  });

  it('names the extension from the host record, whatever the bundle changes', async () => {
    const onActionRequest = vi.fn().mockResolvedValue(undefined);
    const { mountInput, requestAction } =
      await mountWithActions(onActionRequest);

    mountInput.extension.id = 'trusted-extension';
    mountInput.extension.applicationId = 'trusted-app';
    await requestAction({ action: 'settings.open' });

    const [, source] = onActionRequest.mock.calls[0] ?? [];
    expect(source).toEqual({ extension: extensionMetadata });
    expect(Object.isFrozen(source.extension)).toBe(true);
  });

  it('passes the host a clone of the request, read once', async () => {
    const onActionRequest = vi.fn().mockResolvedValue(undefined);
    const { requestAction } = await mountWithActions(onActionRequest);
    let reads = 0;
    const input = { amount: 1 };
    const request = {
      get action() {
        reads += 1;
        return reads === 1 ? 'settings.open' : 'payments.refund';
      },
      input,
      extra: 'ignored',
    };

    const pending = requestAction(request);
    input.amount = 10000;
    await pending;

    // Counted before the assertions below, which read the getter themselves.
    expect(reads).toBe(1);
    const [received] = onActionRequest.mock.calls[0] ?? [];
    expect(received).toEqual({ action: 'settings.open', input: { amount: 1 } });
    expect(received).not.toBe(request);
  });

  it('rejects a request whose input cannot be cloned, without calling the host', async () => {
    const onActionRequest = vi.fn();
    const { requestAction } = await mountWithActions(onActionRequest);

    await expect(
      requestAction({ action: 'settings.open', input: { run: () => 1 } })
    ).rejects.toMatchObject({ code: 'action_rejected' });
    expect(onActionRequest).not.toHaveBeenCalled();
  });

  it('gives the extension a clone of the host result', async () => {
    const hostState = { rate: 7 };
    const { requestAction } = await mountWithActions(() =>
      Promise.resolve(hostState)
    );

    const result = (await requestAction({ action: 'settings.get' })) as {
      rate: number;
    };
    result.rate = 0;

    expect(result).not.toBe(hostState);
    expect(hostState.rate).toBe(7);
  });

  it('rejects with action_rejected when the host result cannot be cloned', async () => {
    const { requestAction } = await mountWithActions(() =>
      Promise.resolve({ format: () => 'x' })
    );

    await expect(
      requestAction({ action: 'settings.get' })
    ).rejects.toMatchObject({ code: 'action_rejected' });
  });

  it('rejects with action_rejected when the host handler rejects, without its reason', async () => {
    const { requestAction } = await mountWithActions(() =>
      Promise.reject({
        code: 'action_rejected',
        runtimeType: 'dom-bundle',
        extensionId: 'other-extension',
        message: 'internal detail',
        cause: 'secret',
      })
    );

    const rejection = await requestAction({ action: 'settings.open' }).catch(
      (error: unknown) => error
    );
    expect(rejection).toMatchObject({
      code: 'action_rejected',
      message: 'The host rejected the action.',
      extensionId: 'extension-1',
    });
    expect(rejection).not.toHaveProperty('cause');
  });

  it('rejects action requests when the host has no handler', async () => {
    const { requestAction } = await mountWithActions();

    await expect(
      requestAction({ action: 'settings.open' })
    ).rejects.toMatchObject({
      code: 'action_rejected',
      runtimeType: 'dom-bundle',
      extensionId: 'extension-1',
    });
  });

  it('rejects action requests without an action name', async () => {
    const onActionRequest = vi.fn();
    const { requestAction } = await mountWithActions(onActionRequest);

    await expect(
      requestAction({ action: '' } as UiExtensionActionRequest)
    ).rejects.toMatchObject({ code: 'action_rejected' });
    await expect(requestAction({ action: '   ' })).rejects.toMatchObject({
      code: 'action_rejected',
    });
    await expect(
      requestAction({ action: ' settings.open ' })
    ).rejects.toMatchObject({ code: 'action_rejected' });
    expect(onActionRequest).not.toHaveBeenCalled();
  });

  it('rejects action requests after unmount', async () => {
    const onActionRequest = vi.fn();
    const { runtime, requestAction } = await mountWithActions(onActionRequest);

    await runtime.unmount();

    await expect(
      requestAction({ action: 'settings.open' })
    ).rejects.toMatchObject({ code: 'action_rejected' });
    expect(onActionRequest).not.toHaveBeenCalled();
  });

  it('rejects a request still waiting on the host when the extension unmounts', async () => {
    const { runtime, requestAction } = await mountWithActions(
      () => new Promise(() => undefined)
    );

    const pending = requestAction({ action: 'settings.open' });
    await runtime.unmount();

    await expect(pending).rejects.toMatchObject({
      code: 'action_rejected',
      message: 'UI extension is no longer mounted.',
    });
  });

  it('keeps requests from a failed mount away from the host', async () => {
    const onActionRequest = vi.fn().mockResolvedValue(undefined);
    let duringCleanup: Promise<unknown> | undefined;
    let requestAction: DomExtensionMountInput['requestAction'];
    const runtime = new DomBundleUiExtensionRuntime({ timeoutMs: 50 });
    const mountPromise = runtime.mount({
      extension: createExtension(),
      context: { target: 'checkout.test-target' },
      container: document.createElement('div'),
      onError: () => undefined,
      onActionRequest,
    });
    const script = await getLastScript();
    window.GoDaddyUiExtensions?.register({
      mount(input: DomExtensionMountInput) {
        requestAction = input.requestAction;
        throw new Error('bundle broke');
      },
      unmount() {
        duringCleanup = requestAction?.({ action: 'settings.save' });
      },
    });
    script.dispatchEvent(new Event('load'));
    await mountPromise;

    await expect(duringCleanup).rejects.toMatchObject({
      code: 'action_rejected',
    });
    expect(onActionRequest).not.toHaveBeenCalled();
  });

  it('reports a request whose action cannot be read as missing its name', async () => {
    const onActionRequest = vi.fn();
    const { requestAction } = await mountWithActions(onActionRequest);
    const request = {
      get action(): string {
        throw new Error('no');
      },
    };

    await expect(requestAction(request)).rejects.toMatchObject({
      message: 'UI extension action requests need an action name.',
    });
    expect(onActionRequest).not.toHaveBeenCalled();
  });

  it('keeps the source taken at mount when the host record changes later', async () => {
    const onActionRequest = vi.fn().mockResolvedValue(undefined);
    const extension = createExtension();
    const runtime = new DomBundleUiExtensionRuntime();
    let requestAction: DomExtensionMountInput['requestAction'];
    const mountPromise = runtime.mount({
      extension,
      context: { target: 'checkout.test-target' },
      container: document.createElement('div'),
      onError: () => undefined,
      onActionRequest,
    });
    const script = await getLastScript();
    window.GoDaddyUiExtensions?.register({
      mount(input: DomExtensionMountInput) {
        requestAction = input.requestAction;
      },
    });
    script.dispatchEvent(new Event('load'));
    await mountPromise;

    extension.id = 'trusted-extension';
    await requestAction?.({ action: 'settings.open' });

    expect(onActionRequest.mock.calls[0]?.[1]).toEqual({
      extension: extensionMetadata,
    });
  });

  it('hands the runtime to a newer mount and unmounts the older bundle', async () => {
    const runtime = new DomBundleUiExtensionRuntime();
    const container = document.createElement('div');
    const onActionRequest = vi.fn().mockResolvedValue(undefined);
    const mountInput = (id: string) => ({
      extension: createExtension({ id }),
      context: { target: 'checkout.test-target' },
      container,
      onError: () => undefined,
      onActionRequest,
    });
    const olderUnmount = vi.fn();
    const newerUnmount = vi.fn();
    let finishOlderMount: (() => void) | undefined;
    let olderRequestAction: DomExtensionMountInput['requestAction'];

    const older = runtime.mount(mountInput('extension-old'));
    const olderScript = await getLastScript();
    window.GoDaddyUiExtensions?.register({
      mount: input =>
        new Promise<void>(resolve => {
          olderRequestAction = input.requestAction;
          finishOlderMount = resolve;
        }),
      unmount: olderUnmount,
    });
    olderScript.dispatchEvent(new Event('load'));
    await vi.waitFor(() => expect(finishOlderMount).toBeDefined());

    const newer = runtime.mount(mountInput('extension-new'));
    await expect(
      olderRequestAction?.({ action: 'settings.open' })
    ).rejects.toMatchObject({ code: 'action_rejected' });
    finishOlderMount?.();
    await older;
    expect(olderUnmount).toHaveBeenCalledTimes(1);
    expect(onActionRequest).not.toHaveBeenCalled();

    await vi.waitFor(() =>
      expect(document.querySelector('script')).not.toBeNull()
    );
    const newerScript = await getLastScript();
    window.GoDaddyUiExtensions?.register({
      mount: vi.fn(),
      unmount: newerUnmount,
    });
    newerScript.dispatchEvent(new Event('load'));
    await newer;

    await runtime.unmount();
    expect(newerUnmount).toHaveBeenCalledTimes(1);
    expect(olderUnmount).toHaveBeenCalledTimes(1);
  });

  async function mountNewer(
    runtime: DomBundleUiExtensionRuntime,
    input: UiExtensionRuntimeMountInput
  ) {
    let requestAction: DomExtensionMountInput['requestAction'];
    const mounted = runtime.mount(input);
    await vi.waitFor(() =>
      expect(document.querySelector('script')).not.toBeNull()
    );
    const script = await getLastScript();
    window.GoDaddyUiExtensions?.register({
      mount: mountInput => {
        requestAction = mountInput.requestAction;
      },
    });
    script.dispatchEvent(new Event('load'));
    await mounted;
    return requestAction;
  }

  it('leaves a newer mount alone when a failed mount finishes cleaning up', async () => {
    const runtime = new DomBundleUiExtensionRuntime();
    const container = document.createElement('div');
    const olderErrors: UiExtensionRuntimeError[] = [];
    const onActionRequest = vi.fn().mockResolvedValue({ saved: true });
    let finishOlderCleanup: (() => void) | undefined;

    const older = runtime.mount({
      extension: createExtension({ id: 'extension-old' }),
      context: { target: 'checkout.test-target' },
      container,
      onError: error => olderErrors.push(error),
    });
    const olderScript = await getLastScript();
    window.GoDaddyUiExtensions?.register({
      mount() {
        throw new Error('mount failed');
      },
      unmount: () =>
        new Promise<void>(resolve => {
          finishOlderCleanup = resolve;
        }),
    });
    olderScript.dispatchEvent(new Event('load'));
    await vi.waitFor(() => expect(finishOlderCleanup).toBeDefined());

    const newer = mountNewer(runtime, {
      extension: createExtension({ id: 'extension-new' }),
      context: { target: 'checkout.test-target' },
      container,
      onError: () => undefined,
      onActionRequest,
    });
    finishOlderCleanup?.();
    await older;
    const requestAction = await newer;

    expect(olderErrors).toEqual([]);
    await expect(requestAction?.({ action: 'settings.open' })).resolves.toEqual(
      { saved: true }
    );
  });

  it('keeps a newer mount when an earlier unmount finishes after it starts', async () => {
    const onActionRequest = vi.fn().mockResolvedValue({ saved: true });
    let finishUnmount: (() => void) | undefined;
    const { runtime } = await mountWithContract(capture => ({
      mount: capture,
      unmount: () =>
        new Promise<void>(resolve => {
          finishUnmount = resolve;
        }),
    }));

    const unmounted = runtime.unmount();
    const newer = mountNewer(runtime, {
      extension: createExtension({ id: 'extension-new' }),
      context: { target: 'checkout.test-target' },
      container: document.createElement('div'),
      onError: () => undefined,
      onActionRequest,
    });
    finishUnmount?.();
    await unmounted;
    const requestAction = await newer;

    await expect(requestAction?.({ action: 'settings.open' })).resolves.toEqual(
      { saved: true }
    );
  });

  it('unmounts a bundle replaced while it applies a queued update', async () => {
    const runtime = new DomBundleUiExtensionRuntime();
    const container = document.createElement('div');
    const olderUnmount = vi.fn();
    let finishOlderMount: (() => void) | undefined;
    let finishOlderUpdate: (() => void) | undefined;

    const older = runtime.mount({
      extension: createExtension({ id: 'extension-old' }),
      context: { target: 'checkout.test-target' },
      container,
      onError: () => undefined,
    });
    const olderScript = await getLastScript();
    window.GoDaddyUiExtensions?.register({
      mount: () =>
        new Promise<void>(resolve => {
          finishOlderMount = resolve;
        }),
      update: () =>
        new Promise<void>(resolve => {
          finishOlderUpdate = resolve;
        }),
      unmount: olderUnmount,
    });
    olderScript.dispatchEvent(new Event('load'));
    await vi.waitFor(() => expect(finishOlderMount).toBeDefined());
    await runtime.update({
      context: { target: 'checkout.test-target', orderId: 'order-1' },
    });
    finishOlderMount?.();
    await vi.waitFor(() => expect(finishOlderUpdate).toBeDefined());

    const newer = mountNewer(runtime, {
      extension: createExtension({ id: 'extension-new' }),
      context: { target: 'checkout.test-target' },
      container,
      onError: () => undefined,
    });
    finishOlderUpdate?.();
    await older;
    await newer;

    expect(olderUnmount).toHaveBeenCalledTimes(1);
  });

  it('unmounts the bundle once when the host unmounts during a queued update that fails', async () => {
    const runtime = new DomBundleUiExtensionRuntime();
    const unmount = vi.fn();
    const errors: UiExtensionRuntimeError[] = [];
    let finishMount: (() => void) | undefined;
    let failUpdate: (() => void) | undefined;

    const mounted = runtime.mount({
      extension: createExtension(),
      context: { target: 'checkout.test-target' },
      container: document.createElement('div'),
      onError: error => errors.push(error),
    });
    const script = await getLastScript();
    window.GoDaddyUiExtensions?.register({
      mount: () =>
        new Promise<void>(resolve => {
          finishMount = resolve;
        }),
      update: () =>
        new Promise<void>((_, reject) => {
          failUpdate = () => reject(new Error('update failed'));
        }),
      unmount,
    });
    script.dispatchEvent(new Event('load'));
    await vi.waitFor(() => expect(finishMount).toBeDefined());
    await runtime.update({
      context: { target: 'checkout.test-target', orderId: 'order-1' },
    });
    finishMount?.();
    await vi.waitFor(() => expect(failUpdate).toBeDefined());

    await runtime.unmount();
    failUpdate?.();
    await mounted;

    expect(unmount).toHaveBeenCalledTimes(1);
    expect(errors).toEqual([]);
  });

  it('unmounts the bundle once when the host unmounts while a failed update cleans up', async () => {
    const runtime = new DomBundleUiExtensionRuntime();
    let finishCleanup: (() => void) | undefined;
    const unmount = vi.fn(
      () =>
        new Promise<void>(resolve => {
          finishCleanup = resolve;
        })
    );
    const mounted = runtime.mount({
      extension: createExtension(),
      context: { target: 'checkout.test-target' },
      container: document.createElement('div'),
      onError: () => undefined,
    });
    const script = await getLastScript();
    let finishMount: (() => void) | undefined;
    window.GoDaddyUiExtensions?.register({
      mount: () =>
        new Promise<void>(resolve => {
          finishMount = resolve;
        }),
      update: () => Promise.reject(new Error('update failed')),
      unmount,
    });
    script.dispatchEvent(new Event('load'));
    await vi.waitFor(() => expect(finishMount).toBeDefined());
    await runtime.update({
      context: { target: 'checkout.test-target', orderId: 'order-1' },
    });
    finishMount?.();
    await vi.waitFor(() => expect(finishCleanup).toBeDefined());

    await runtime.unmount();
    await runtime.unmount();
    finishCleanup?.();
    await mounted;

    expect(unmount).toHaveBeenCalledTimes(1);
  });

  it('applies queued updates after mount finishes', async () => {
    const runtime = new DomBundleUiExtensionRuntime();
    const update = vi.fn();
    const mountPromise = runtime.mount({
      extension: createExtension(),
      context: { target: 'checkout.test-target' },
      initialProps: { orderId: 'initial-order' },
      container: document.createElement('div'),
      onError: () => undefined,
    });

    const script = await getLastScript();
    await runtime.update({
      context: { target: 'checkout.test-target', orderId: 'updated-order' },
      initialProps: { orderId: 'updated-order' },
    });
    window.GoDaddyUiExtensions?.register({
      mount: vi.fn(),
      update,
    });
    script.dispatchEvent(new Event('load'));
    await mountPromise;

    expect(update).toHaveBeenCalledWith({
      context: { target: 'checkout.test-target', orderId: 'updated-order' },
      initialProps: { orderId: 'updated-order' },
      extension: {
        id: 'extension-1',
        applicationId: 'app-1',
        releaseId: 'release-1',
        target: 'checkout.test-target',
      },
    });
  });
});
