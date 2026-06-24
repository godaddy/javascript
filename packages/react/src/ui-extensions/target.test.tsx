import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEnabledStoreUiExtensions } from './hooks';
import { Target } from './target';
import type { EnabledStoreUiExtensionApp, UiExtension } from './types';

vi.mock('./hooks', () => ({
  useEnabledStoreUiExtensions: vi.fn(),
}));

const mockUseEnabledStoreUiExtensions = vi.mocked(useEnabledStoreUiExtensions);

function mockHookResult(overrides = {}) {
  mockUseEnabledStoreUiExtensions.mockReturnValue({
    data: [],
    error: null,
    isLoading: false,
    ...overrides,
  } as unknown as ReturnType<typeof useEnabledStoreUiExtensions>);
}

describe('Target', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHookResult();
  });

  it('does not require token and keeps orderId out of extension discovery', () => {
    renderToStaticMarkup(
      <Target id='some.target' orderId='order-123' storeId='store-123' />
    );

    expect(mockUseEnabledStoreUiExtensions).toHaveBeenCalledWith({
      target: 'some.target',
      storeId: 'store-123',
      enabled: true,
    });
  });

  it('uses provided apps and disables network discovery', () => {
    const matchingExtension: UiExtension = {
      id: 'extension-1',
      type: 'CHECKOUT',
      target: 'some.target',
    };
    const otherExtension: UiExtension = {
      id: 'extension-2',
      type: 'CHECKOUT',
      target: 'other.target',
    };
    const apps: EnabledStoreUiExtensionApp[] = [
      {
        id: 'app-1',
        name: 'app-1',
        release: null,
        uiExtensions: [matchingExtension, otherExtension],
      },
    ];

    const output = renderToStaticMarkup(
      <Target apps={apps} id='some.target' storeId='store-123' />
    );

    expect(mockUseEnabledStoreUiExtensions).toHaveBeenCalledWith({
      target: 'some.target',
      storeId: 'store-123',
      enabled: false,
    });
    expect(output).toContain('data-gd-ui-extension-container="true"');
    expect(output).toContain('extension-1');
    expect(output).not.toContain('extension-2');
  });

  it('renders provided apps as debug JSON when requested', () => {
    const matchingExtension: UiExtension = {
      id: 'extension-1',
      type: 'CHECKOUT',
      target: 'some.target',
    };
    const apps: EnabledStoreUiExtensionApp[] = [
      {
        id: 'app-1',
        name: 'app-1',
        release: null,
        uiExtensions: [matchingExtension],
      },
    ];

    const output = renderToStaticMarkup(
      <Target apps={apps} id='some.target' runtime='debug' storeId='store-123' />
    );

    expect(output).toContain('uiExtensions');
    expect(output).toContain('extension-1');
  });

  it('renders public API response extensions', () => {
    const extension: UiExtension = {
      id: 'extension-1',
      name: 'Extension 1',
      type: 'CHECKOUT',
      target: 'some.target',
    };
    mockHookResult({ data: [extension] });

    const output = renderToStaticMarkup(
      <Target id='some.target' storeId='store-123' />
    );

    expect(output).toContain('data-gd-ui-extension-container="true"');
    expect(output).toContain('extension-1');
  });

  it('renders hook errors', () => {
    mockHookResult({ error: new Error('Failed to load extensions') });

    const output = renderToStaticMarkup(
      <Target id='some.target' storeId='store-123' />
    );

    expect(output).toContain('Failed to load extensions');
  });
});
