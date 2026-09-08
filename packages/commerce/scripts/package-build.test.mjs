// @vitest-environment node
import { readFile, access } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { scopeCheckoutCss } from './scope-checkout-css.mjs';

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
    expect(css).toContain('.gddy-checkout-scope');
    expect(css).toContain('.gddy-drawer');
  });

  it('contains checkout resets and utility selectors while retaining animations', () => {
    const css = scopeCheckoutCss('@layer base { :root, :host { --gd-primary: black } h1, .flex { display: flex } } @keyframes spin { to { transform: rotate(360deg) } }');
    expect(css).toContain('.gddy-checkout-scope { --gd-primary: black }');
    expect(css).toContain(':where(.gddy-checkout-scope) h1');
    expect(css).toContain(':where(.gddy-checkout-scope) .flex');
    expect(css).toContain('to { transform: rotate(360deg) }');
    expect(css).not.toContain('.gddy-checkout-scope) to');
  });
});
