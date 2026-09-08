import { readFile, writeFile } from 'node:fs/promises';
import postcss from 'postcss';

// Reuse the checkout stylesheet without applying its reset/utilities to the host page.
export function scopeCheckoutCss(css) {
  const root = postcss.parse(css);
  root.walkRules(rule => {
    for (let parent = rule.parent; parent; parent = parent.parent) {
      if (parent.type === 'rule' || (parent.type === 'atrule' && /keyframes$/i.test(parent.name))) return;
    }
    rule.selectors = rule.selectors.map(selector => {
      if (/^(:root|:host|html|body)(?=$|[\s:.[#])/.test(selector)) {
        return selector.replace(/^(:root|:host|html|body)/, '.gddy-checkout-scope');
      }
      return `:where(.gddy-checkout-scope) ${selector}`;
    });
  });
  return root.toString();
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  const css = await readFile(new URL('../../react/dist/index.css', import.meta.url), 'utf8');
  await writeFile(new URL('../src/checkout.generated.css', import.meta.url), scopeCheckoutCss(css));
}
