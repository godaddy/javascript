import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import postcss from 'postcss';

// Package CSS ships unlayered, and unlayered rules beat a host's layered utilities (Tailwind v4) whatever
// their specificity. So no package rule may set these properties on the element that receives a host class.
const hostProperties =
  /^(margin|padding|border-(width|style|top|right|bottom|left)|border$|color$|font-family$|display$|gap$|row-gap$|column-gap$|flex-(direction|wrap)$|justify-content$|align-items$|grid-template-(columns|rows)$|width$|max-width$)/;

/** Returns `selector property` for every shipped package rule that sets a host-owned property on `element`. */
export function packageRuleConflicts(): (element: Element) => string[] {
  const rules: Array<{ selector: string; properties: string[] }> = [];
  postcss.parse(readFileSync(join(process.cwd(), 'dist/styles.css'), 'utf8')).walkRules((rule) => {
    if (rule.parent?.type === 'rule') return;
    // Only direct declarations: nested rules such as space-y-* style children, not this element.
    const properties: string[] = [];
    rule.each((node) => {
      if (node.type === 'decl') properties.push(node.prop);
    });
    for (const selector of rule.selectors) if (!selector.includes('::')) rules.push({ selector, properties });
  });
  return (element) =>
    rules.flatMap(({ selector, properties }) => {
      let matches = false;
      try {
        matches = element.matches(selector);
      } catch {}
      return matches
        ? properties.filter((property) => hostProperties.test(property)).map((p) => `${selector} ${p}`)
        : [];
    });
}
