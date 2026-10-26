// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

// Wrappers are transparent, so the package never knows the background behind a part: the host page may be light or
// dark. These tests keep every color in a pair that is legible wherever it lands (see class-names.ts).
const source: Array<{ file: string; classes: string }> = readdirSync(join(process.cwd(), 'src'))
  .filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$|^test-/.test(file))
  .flatMap((file) =>
    [...readFileSync(join(process.cwd(), 'src', file), 'utf8').matchAll(/'([^'\n]*)'|`([^`]*)`/g)].map(
      (match) => ({
        file,
        classes: match[1] ?? match[2],
      }),
    ),
  );

/** Tokens without variants such as `hover:` or `disabled:`. */
const tokens = (classes: string): string[] =>
  classes.split(/\s+/).map((token) => token.split(':').pop() ?? '');

// The neutral scale mixes `--commerce-text` into `--commerce-surface`, so it only reads on that surface.
const surfaceColor = /^(?:text|border|divide|bg|outline)-(?:white|neutral-[1-9]00)$/;
// Placed over an element that already paints the surface.
const insideSurface: string[] = [
  'pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600', // the select's arrow
];

it('paints the surface wherever it uses a surface-derived color', () => {
  const unpaired = source.filter(({ classes }) => {
    const list = tokens(classes);
    if (!list.some((token) => surfaceColor.test(token)) || insideSurface.includes(classes)) return false;
    return !(list.includes('bg-white') && list.includes('text-neutral-900'));
  });
  expect(unpaired).toEqual([]);
});

// Status colors are dark text, unreadable on a dark host page unless they bring their own light background.
const statusText = /^text-(?:red|amber)-\d+$/;
// Rendered inside an `errorNoticeClass` box.
const insideNotice: RegExp = /^mt-1 min-h-11 font-medium text-red-800 underline/;

it('gives status text its own background', () => {
  const unpaired = source.filter(({ classes }) => {
    const list = tokens(classes);
    if (!list.some((token) => statusText.test(token)) || insideNotice.test(classes)) return false;
    return !list.some((token) => /^bg-(?:red|amber)-50$/.test(token));
  });
  expect(unpaired).toEqual([]);
});

it('fills the accent only with its on-accent text', () => {
  const unpaired = source.filter(({ classes }) => {
    const list = tokens(classes);
    return list.includes('bg-commerce-accent') && !list.includes('text-commerce-on-accent');
  });
  expect(unpaired).toEqual([]);
});
