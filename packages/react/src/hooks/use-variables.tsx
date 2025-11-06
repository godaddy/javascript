'use client';
import { useEffect } from 'react';
import { convertCamelCaseToKebabCase } from '@/components/checkout/utils/case-conversion';
// hooks/use-variables.ts
import {
  type CSSVariables,
  type GoDaddyVariables,
  useGoDaddyContext,
} from '@/godaddy-provider';

/**
 * Checks if a variables object is already in kebab-case format by checking for hyphens
 */
function isKebabCase(obj: Record<string, unknown>): boolean {
  return Object.keys(obj).some(key => key.includes('-'));
}

/**
 * Hook that applies CSS variables from the GoDaddy context to the document
 * Priority: overrideVariables > context.appearance
 * @param {GoDaddyVariables} [overrideVariables] - Optional variables that override context variables (can be camelCase or kebab-case)
 */
export function useVariables(overrideVariables?: GoDaddyVariables) {
  const { appearance } = useGoDaddyContext();

  // Context variables are already in kebab-case
  const contextVariables = appearance?.variables;

  useEffect(() => {
    if (!contextVariables && !overrideVariables) return;

    // Extract CSS variables from context (lowest priority)
    let contextCssVars: CSSVariables | undefined;
    if (contextVariables) {
      if ('checkout' in contextVariables) {
        contextCssVars = contextVariables.checkout;
      } else {
        contextCssVars = contextVariables as CSSVariables;
      }
    }

    // Extract CSS variables from overrides (highest priority)
    let overrideCssVars: CSSVariables | undefined;
    if (overrideVariables) {
      let rawVars: Record<string, string>;

      // Extract the raw variables object
      if ('checkout' in overrideVariables) {
        rawVars = overrideVariables.checkout as Record<string, string>;
      } else {
        rawVars = overrideVariables as Record<string, string>;
      }

      // Convert to kebab-case only if NOT already in kebab-case
      // (session.appearance.variables are camelCase, props.appearance.variables are kebab-case)
      if (isKebabCase(rawVars)) {
        overrideCssVars = rawVars as CSSVariables;
      } else {
        overrideCssVars = convertCamelCaseToKebabCase(rawVars);
      }
    }

    // Merge the variables, with priority: override > context
    const mergedVars: CSSVariables = {
      ...contextCssVars,
      ...overrideCssVars,
    };

    // Reset any previously set CSS variables
    const rootStyle = document.documentElement.style;

    // Apply the CSS variables to the document
    for (const [key, value] of Object.entries(mergedVars)) {
      if (value != null) {
        rootStyle.setProperty(`--gd-${key}`, value.toString());
      }
    }

    // Cleanup function
    return () => {
      // Remove all custom CSS variables that we might have set
      for (const key of Object.keys(mergedVars)) {
        rootStyle.removeProperty(`--gd-${key}`);
      }
    };
  }, [contextVariables, overrideVariables]);
}
