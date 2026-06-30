import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGoDaddyContext } from '@/godaddy-provider';
import { useEnabledStoreUiExtensions } from './hooks';
import { Target } from './target';
import type {
  EnabledStoreUiExtensionApp,
  EnabledUiExtensionApp,
  UiExtension,
} from './types';
import { groupAppsByUiExtensionTarget } from './utils';

vi.mock('@/godaddy-provider', () => ({
  useGoDaddyContext: vi.fn(),
}));

vi.mock('./hooks', () => ({
  useEnabledStoreUiExtensions: vi.fn(),
}));

const mockUseGoDaddyContext = vi.mocked(useGoDaddyContext);
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
    mockUseGoDaddyContext.mockReturnValue({
      debug: false,
      t: {} as ReturnType<typeof useGoDaddyContext>['t'],
    });
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

  it('does not render debug JSON when GoDaddyProvider debug is enabled', () => {
    mockUseGoDaddyContext.mockReturnValue({
      debug: true,
      t: {} as ReturnType<typeof useGoDaddyContext>['t'],
    });
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
      <Target apps={apps} id='some.target' storeId='store-123' />
    );

    expect(output).toContain('data-gd-ui-extension-container="true"');
    expect(output).toContain('extension-1');
    expect(output).not.toContain('uiExtensions');
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

  it('does not render hook errors to shoppers', () => {
    mockHookResult({ error: new Error('Failed to load extensions') });

    const output = renderToStaticMarkup(
      <Target id='some.target' storeId='store-123' />
    );

    expect(output).not.toContain('Failed to load extensions');
  });
});

describe('groupAppsByUiExtensionTarget', () => {
  it('groups each app once per target', () => {
    const apps: EnabledUiExtensionApp[] = [
      {
        id: 'app-1',
        name: 'App 1',
        release: {
          id: 'release-1',
          version: '1.0.0',
          uiExtensions: [
            {
              id: 'extension-1',
              type: 'CHECKOUT',
              target: 'some.target',
            },
            {
              id: 'extension-2',
              type: 'CHECKOUT',
              target: 'some.target',
            },
          ],
        },
      },
    ];

    const grouped = groupAppsByUiExtensionTarget(apps);

    expect(grouped['some.target']).toHaveLength(1);
    expect(grouped['some.target']?.[0]?.uiExtensions).toHaveLength(2);
  });
});
