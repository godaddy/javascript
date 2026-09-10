import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'tsdown';

// Self-contained browser build for the managed CDN. Not published to npm; the
// checkout repository builds it from a git ref and uploads `cdn/` under /v1/.
const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8')
) as { version: string };

/** The commit of this repository being built. GDDY_COMMIT overrides git. */
function commit(): string {
  if (process.env.GDDY_COMMIT) return process.env.GDDY_COMMIT;
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'unknown';
  }
}

export default defineConfig({
  entry: { runtime: 'src/cdn.ts' },
  outDir: 'cdn',
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  dts: false,
  clean: true,
  minify: true,
  sourcemap: true,
  hash: false,
  // Bundle React, Radix, and @godaddy/react: the page installs nothing.
  noExternal: () => true,
  define: {
    'process.env.NODE_ENV': '"production"',
    __GDDY_VERSION__: JSON.stringify(pkg.version),
    __GDDY_COMMIT__: JSON.stringify(commit()),
  },
  outputOptions: {
    // Everything the build emits is content-hashed and immutable, so an open
    // page keeps the release it loaded. scripts/cdn-finish.mjs then writes the
    // small classic-script loader, commerce.js, that imports the runtime.
    entryFileNames: 'chunks/[name]-[hash].js',
    chunkFileNames: 'chunks/[name]-[hash].js',
    assetFileNames: 'chunks/[name]-[hash][extname]',
  },
});
