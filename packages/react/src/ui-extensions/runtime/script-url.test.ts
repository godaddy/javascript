import { describe, expect, it } from 'vitest';
import type { UiExtension } from '../types';
import {
  getUiExtensionCdnBaseUrl,
  getUiExtensionScriptUrl,
} from './script-url';

function createExtension(overrides: Partial<UiExtension> = {}): UiExtension {
  return {
    id: 'extension-1',
    applicationId: 'app id',
    releaseId: 'release/id',
    cdnUrl: 'https://malicious.example.com/',
    type: 'checkout',
    target: 'checkout.test-target',
    ...overrides,
  };
}

describe('getUiExtensionScriptUrl', () => {
  it('builds deterministic production script URL from apiHost and encodes path segments', () => {
    const result = getUiExtensionScriptUrl(
      createExtension(),
      'api.godaddy.com'
    );

    expect(result).toEqual({
      success: true,
      url: 'https://cdn.ui-extensions.commerce.godaddy.com/apps/targets/checkout.test-target/app%20id/release%2Fid/index.js',
    });
  });

  it('ignores the extension cdnUrl response field', () => {
    const result = getUiExtensionScriptUrl(
      createExtension({ cdnUrl: 'https://evil.example.com' }),
      'api.example.com'
    );

    expect(result).toEqual({
      success: true,
      url: 'https://cdn.ui-extensions.commerce.example.com/apps/targets/checkout.test-target/app%20id/release%2Fid/index.js',
    });
  });

  it('returns structured error when required fields are missing', () => {
    const result = getUiExtensionScriptUrl(
      createExtension({ applicationId: null })
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('missing_required_field');
      expect(result.error.message).toBe(
        'UI extension requires target, applicationId, and releaseId to load.'
      );
      expect(result.error.extensionId).toBe('extension-1');
    }
  });
});

describe('getUiExtensionCdnBaseUrl', () => {
  it.each([
    [undefined, 'https://cdn.ui-extensions.commerce.godaddy.com'],
    ['api.godaddy.com', 'https://cdn.ui-extensions.commerce.godaddy.com'],
    ['api.example.com', 'https://cdn.ui-extensions.commerce.example.com'],
    [
      'https://api.example.com/',
      'https://cdn.ui-extensions.commerce.example.com',
    ],
  ])('replaces the api host prefix for %s', (apiHost, expectedCdnBaseUrl) => {
    expect(getUiExtensionCdnBaseUrl(apiHost)).toBe(expectedCdnBaseUrl);
  });
});
