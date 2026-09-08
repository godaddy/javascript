// @vitest-environment node
import { readFile, access } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('public package artifacts', () => {
  it('ships library entry points and styles without CDN release artifacts', async () => {
    const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
    expect(pkg.files).not.toContain('cdn');
    for (const entry of Object.values(pkg.exports)) {
      for (const file of typeof entry === 'string' ? [entry] : Object.values(entry)) {
        await access(new URL(`../${file}`, import.meta.url));
      }
    }
    const css = await readFile(new URL('../dist/index.css', import.meta.url), 'utf8');
    expect(css).not.toContain('.gddy-checkout-scope');
    expect(css).toContain('.gddy-drawer');
  });

});
