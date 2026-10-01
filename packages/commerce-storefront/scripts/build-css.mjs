import { execFileSync } from 'node:child_process';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import postcss from 'postcss';
import { fileURLToPath } from 'node:url';

// Resolve the v4 CLI explicitly: the v3 compatibility-test dependency has the same binary name.
const cliPackageUrl = import.meta.resolve('@tailwindcss/cli/package.json');
const cliPackage = JSON.parse(await readFile(new URL(cliPackageUrl), 'utf8'));
const cliPath = fileURLToPath(new URL(cliPackage.bin.tailwindcss, cliPackageUrl));
execFileSync(process.execPath, [cliPath, '-i', 'src/styles.css', '-o', 'dist/raw.css'], { stdio: 'inherit' });
const css = postcss.parse(await readFile('dist/raw.css', 'utf8'));
css.walkRules((rule) => {
  // Nested selectors inherit their parent's scope. Keyframes are identifiers, not document selectors.
  let parent = rule.parent;
  while (parent) {
    if (parent.type === 'rule' || (parent.type === 'atrule' && /keyframes$/.test(parent.name))) return;
    parent = parent.parent;
  }
  rule.selectors = rule.selectors.map((selector) => {
    if (selector.startsWith('.commerce-')) return selector;
    if (selector === ':root' || selector === ':host') return '.commerce-storefront';
    return `.commerce-storefront ${selector}`;
  });
});
// Tailwind v3 interprets dependency @layer blocks as source directives. Publish
// ordinary CSS, ordered by the declared cascade layers (not their source order).
// In particular, base resets must precede utilities even when emitted later.
const layerRules = css.nodes.filter((node) => node.type === 'atrule' && node.name === 'layer');
const layers = new Map();
for (const rule of layerRules) {
  for (const name of rule.params.split(',').map((name) => name.trim())) {
    if (!layers.has(name)) layers.set(name, []);
  }
  if (rule.nodes) layers.get(rule.params).push(...rule.nodes);
}
layerRules[0]?.before([...layers.values()].flat());
for (const rule of layerRules) rule.remove();
css.walkAtRules('layer', () => {
  throw new Error('Unexpected nested CSS layer in compiled storefront styles');
});
await writeFile('dist/styles.css', css.toString());
await unlink('dist/raw.css');
