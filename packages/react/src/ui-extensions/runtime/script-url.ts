import type { UiExtension } from '../types';
import type { UiExtensionRuntimeError } from './types';

export type BuildUiExtensionScriptUrlResult =
  | { success: true; url: string }
  | { success: false; error: UiExtensionRuntimeError };

function encodePathSegment(value: string) {
  return encodeURIComponent(value);
}

export function getUiExtensionCdnBaseUrl(apiHost?: string) {
  const host = (apiHost || 'api.godaddy.com')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/$/, '');

  return `https://${host.replace(/^api\./i, 'cdn.ui-extensions.commerce.')}`;
}

export function getUiExtensionScriptUrl(
  extension: UiExtension,
  apiHost?: string
): BuildUiExtensionScriptUrlResult {
  const { applicationId, id, releaseId, target } = extension;

  if (!target || !applicationId || !releaseId) {
    return {
      success: false,
      error: {
        code: 'missing_required_field',
        message:
          'UI extension requires target, applicationId, and releaseId to load.',
        runtimeType: 'dom-bundle',
        extensionId: id,
        applicationId,
        releaseId,
        target,
      },
    };
  }

  try {
    const baseUrl = getUiExtensionCdnBaseUrl(apiHost);
    const url = [
      baseUrl,
      'apps',
      'targets',
      encodePathSegment(target),
      encodePathSegment(applicationId),
      encodePathSegment(releaseId),
      'index.js',
    ].join('/');

    return { success: true, url };
  } catch (cause) {
    return {
      success: false,
      error: {
        code: 'invalid_script_url',
        message: 'Failed to build UI extension script URL.',
        runtimeType: 'dom-bundle',
        extensionId: id,
        applicationId,
        releaseId,
        target,
        cause,
      },
    };
  }
}
