import type {
  EnabledStoreUiExtensionApp,
  EnabledUiExtensionApp,
} from './types';
import { withReleaseUiExtensions } from './types';

export function groupAppsByUiExtensionTarget(
  apps?: EnabledUiExtensionApp[] | null
) {
  const grouped: Record<string, EnabledStoreUiExtensionApp[]> = {};

  for (const enabledApp of apps || []) {
    const app = withReleaseUiExtensions(enabledApp);
    const uiExtensionsByTarget = new Map<string, typeof app.uiExtensions>();

    for (const extension of app.uiExtensions) {
      if (!extension.target) continue;

      uiExtensionsByTarget.set(extension.target, [
        ...(uiExtensionsByTarget.get(extension.target) || []),
        extension,
      ]);
    }

    for (const [target, uiExtensions] of uiExtensionsByTarget) {
      grouped[target] ??= [];
      grouped[target].push({
        ...app,
        release: app.release
          ? {
              ...app.release,
              uiExtensions,
            }
          : app.release,
        uiExtensions,
      });
    }
  }

  return grouped;
}
