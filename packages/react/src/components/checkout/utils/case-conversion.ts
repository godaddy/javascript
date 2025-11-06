import type { CSSVariables } from '@/godaddy-provider';

/**
 * Convert kebab-case string to camelCase
 * @example kebabToCamel('font-sans') // 'fontSans'
 */
export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert camelCase string to kebab-case
 * @example camelToKebab('fontSans') // 'font-sans'
 */
export function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

/**
 * Convert kebab-case CSS variables object to camelCase for GraphQL
 * @param variables - Object with kebab-case keys
 * @returns Object with camelCase keys
 * @example
 * convertCSSVariablesToCamelCase({ 'font-sans': 'Arial', 'secondary-background': '#fff' })
 * // { fontSans: 'Arial', secondaryBackground: '#fff' }
 */
export function convertCSSVariablesToCamelCase(
  variables: CSSVariables
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(variables)) {
    if (value !== undefined) {
      result[kebabToCamel(key)] = value;
    }
  }
  return result;
}

/**
 * Convert camelCase object keys to kebab-case (for GraphQL response to CSS variables)
 * @param obj - Object with camelCase keys
 * @returns Object with kebab-case keys typed as CSSVariables
 * @example
 * convertCamelCaseToKebabCase({ fontSans: 'Arial', secondaryBackground: '#fff' })
 * // { 'font-sans': 'Arial', 'secondary-background': '#fff' }
 */
export function convertCamelCaseToKebabCase(
  obj: Record<string, string>
): CSSVariables {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[camelToKebab(key)] = value;
    }
  }
  return result as CSSVariables;
}
