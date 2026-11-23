import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UiExtension } from '../types';
import { UiExtensionRuntimeHost } from './runtime-host';
import type { DomExtensionMountInput, UiExtensionContext } from './types';

const extension: UiExtension = {
  id: 'extension-1',
  applicationId: 'app-1',
  releaseId: 'release-1',
  type: 'checkout',
  target: 'checkout.test-target',
};

const context: UiExtensionContext = { target: 'checkout.test-target' };

async function loadFakeBundle() {
  let mountInput: DomExtensionMountInput | undefined;
  const mount = vi.fn((input: DomExtensionMountInput) => {
    mountInput = input;
  });

  await act(async () => {
    await Promise.resolve();
  });
  const scripts = document.querySelectorAll('script');
  const script = scripts[scripts.length - 1] as HTMLScriptElement;
  window.GoDaddyUiExtensions?.register({ mount });

  await act(async () => {
    script.dispatchEvent(new Event('load'));
    await Promise.resolve();
  });

  if (!mountInput?.requestAction) {
    throw new Error('mount input has no requestAction');
  }

  return { mount, requestAction: mountInput.requestAction };
}

describe('UiExtensionRuntimeHost', () => {
  afterEach(() => {
    document.head.innerHTML = '';
    delete window.GoDaddyUiExtensions;
  });

  it('sends action requests to the current handler without remounting', async () => {
    const first = vi.fn().mockResolvedValue('first');
    const second = vi.fn().mockResolvedValue('second');
    const { rerender } = render(
      <UiExtensionRuntimeHost
        context={context}
        extension={extension}
        onActionRequest={first}
      />
    );
    const { mount, requestAction } = await loadFakeBundle();

    await expect(requestAction({ action: 'settings.open' })).resolves.toBe(
      'first'
    );

    rerender(
      <UiExtensionRuntimeHost
        context={context}
        extension={extension}
        onActionRequest={second}
      />
    );

    await expect(requestAction({ action: 'settings.open' })).resolves.toBe(
      'second'
    );
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledWith(
      { action: 'settings.open' },
      { extension: expect.objectContaining({ id: 'extension-1' }) }
    );
    expect(mount).toHaveBeenCalledTimes(1);
  });

  it('rejects action requests when no handler is passed', async () => {
    render(<UiExtensionRuntimeHost context={context} extension={extension} />);
    const { requestAction } = await loadFakeBundle();

    await expect(
      requestAction({ action: 'settings.open' })
    ).rejects.toMatchObject({
      code: 'action_rejected',
      extensionId: 'extension-1',
      message: 'The host does not handle UI extension actions.',
    });
  });
});
