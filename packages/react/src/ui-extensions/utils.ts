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

    for (const extension of app.uiExtensions) {
      if (!extension.target) continue;

      const uiExtensions = app.uiExtensions.filter(
        uiExtension => uiExtension.target === extension.target
      );

      grouped[extension.target] ??= [];
      grouped[extension.target].push({
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
