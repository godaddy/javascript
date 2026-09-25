// @vitest-environment node
import { readFile } from 'node:fs/promises';
import postcss, { type Container, type Document } from 'postcss';
import tailwindV3 from 'tailwindcss-v3';
import { expect, it } from 'vitest';

it('ships CSS that scopes every document selector to a commerce surface', async () => {
  const css = postcss.parse(await readFile(new URL('../dist/styles.css', import.meta.url), 'utf8'));
  const selectors: string[] = [];
  css.walkRules((rule) => {
    let parent: Container | Document | undefined = rule.parent;
    while (parent) {
      if (
        parent.type === 'rule' ||
        (parent.type === 'atrule' && 'name' in parent && /keyframes$/.test(String(parent.name)))
      )
        return;
      parent = parent.parent;
    }
    selectors.push(...rule.selectors);
  });
  expect(selectors.length).toBeGreaterThan(100);
  expect(selectors.filter((selector) => !selector.startsWith('.commerce-'))).toEqual([]);
  expect(selectors).toContain('.commerce-storefront .min-h-11');
  expect(selectors).toContain('.commerce-storefront .grid-cols-1');
  expect(css.toString()).toContain('var(--commerce-accent, #171717)');
});

it('ships a client package with framework peers external and no server dependencies', async () => {
  const js = await readFile(new URL('../dist/index.js', import.meta.url), 'utf8');
  expect(js).not.toMatch(/node:(?:fs|crypto)|GODADDY_OAUTH_CLIENT_SECRET|@godaddy\/commerce-server/);
  expect(js).toContain('react/jsx-runtime');
  expect(js).toContain('from "react"');
  expect(js).toContain('from "@tanstack/react-query"');
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  expect(pkg.files).not.toContain('src');
  expect(pkg.sideEffects).toContain('**/*.css');
  expect(pkg.exports['./styles.css']).toBe('./dist/styles.css');
});

// Vite processes dependency CSS separately through the host's PostCSS plugins.
// No @tailwind directives or scanned package classes should be needed in the host.
it('passes shipped CSS through Tailwind v3 without losing package styles', async () => {
  const css = await readFile(new URL('../dist/styles.css', import.meta.url), 'utf8');
  const result = await postcss([tailwindV3({ content: [{ raw: '<main>Host application</main>' }] })]).process(
    css,
    {
      from: 'node_modules/@godaddy/commerce-storefront/dist/styles.css',
    },
  );
  expect(result.css).not.toMatch(/@(?:layer|tailwind|apply|theme|source)\b/);
  expect(result.css).toContain('.commerce-storefront .grid-cols-1');
  expect(result.css).toContain('var(--commerce-accent, #171717)');
  expect(result.css).toContain('@media');
  expect(result.css).toContain('@keyframes pulse');
  const resetIndex = css.search(/\.commerce-storefront :where\(button,\s*input,\s*select\)/);
  expect(resetIndex).toBeGreaterThanOrEqual(0);
  expect(resetIndex).toBeLessThan(css.indexOf('.commerce-storefront .grid-cols-1'));
  const rules = (value: string): string[] => {
    const declarations: string[] = [];
    postcss.parse(value).walkDecls((declaration) => {
      declarations.push(declaration.toString());
    });
    return declarations;
  };
  expect(rules(result.css)).toEqual(rules(css));
});
