/**
 * Managed CDN runtime, loaded with `<script defer src=".../v1/commerce.js">`.
 *
 * Registers the elements, exposes the library as `window.GddyCommerce`,
 * applies `window.gddyCommerceConfig` when the page set one, then announces
 * `gddy:ready`. Pages that prefer to configure later listen for that event
 * and call `window.GddyCommerce.configureCommerce(config)` themselves.
 *
 * This entry is not part of the npm package. `pnpm build:cdn` bundles it with
 * its own React so a storefront needs nothing beyond the script tag.
 */
import './elements';
import * as library from './index';
import type { CommerceConfig } from './types';

/** Build-time constants; see tsdown.cdn.config.ts. */
declare const __GDDY_VERSION__: string | undefined;
declare const __GDDY_COMMIT__: string | undefined;

export interface GddyCommerceRelease {
  version: string;
  commit: string;
}

export type GddyCommerceRuntime = typeof library & {
  release: GddyCommerceRelease;
};

declare global {
  interface Window {
    GddyCommerce?: GddyCommerceRuntime;
    gddyCommerceConfig?: CommerceConfig;
  }
}

/** Replaced after the build with the hashed stylesheet emitted next to this file. */
const STYLESHEET = '__GDDY_STYLESHEET__';

export const release: GddyCommerceRelease = {
  version: typeof __GDDY_VERSION__ === 'string' ? __GDDY_VERSION__ : 'dev',
  commit: typeof __GDDY_COMMIT__ === 'string' ? __GDDY_COMMIT__ : 'local',
};

function installStyles(): void {
  const href = new URL(STYLESHEET, import.meta.url).href;
  for (const link of document.querySelectorAll('link[rel=stylesheet]')) {
    if ((link as HTMLLinkElement).href === href) return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.append(link);
}

function announce(type: string, detail: unknown): void {
  window.dispatchEvent(new CustomEvent(type, { detail }));
}

export function boot(): GddyCommerceRuntime {
  const runtime: GddyCommerceRuntime = Object.freeze({ ...library, release });
  window.GddyCommerce = runtime;
  installStyles();
  const config = window.gddyCommerceConfig;
  if (config) {
    try {
      library.configureCommerce(config);
    } catch (error) {
      announce('gddy:error', { error });
    }
  }
  announce('gddy:ready', { release });
  return runtime;
}

boot();
