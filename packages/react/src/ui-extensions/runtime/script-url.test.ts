import { describe, expect, it } from 'vitest';
import type { UiExtension } from '../types';
import { getUiExtensionScriptUrl } from './script-url';

function createExtension(overrides: Partial<UiExtension> = {}): UiExtension {
  return {
    id: 'extension-1',
    applicationId: 'app id',
    releaseId: 'release/id',
    cdnUrl: 'https://cdn.example.com/',
    type: 'checkout',
    target: 'checkout.test-target',
    ...overrides,
  };
}

describe('getUiExtensionScriptUrl', () => {
  it('builds deterministic script URL and encodes path segments', () => {
    const result = getUiExtensionScriptUrl(createExtension());

    expect(result).toEqual({
      success: true,
      url: 'https://cdn.example.com/apps/targets/checkout.test-target/app%20id/release%2Fid/index.js',
    });
  });

  it('returns structured error when required fields are missing', () => {
    const result = getUiExtensionScriptUrl(
      createExtension({ applicationId: null })
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('missing_required_field');
      expect(result.error.extensionId).toBe('extension-1');
    }
  });
});
