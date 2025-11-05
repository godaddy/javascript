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
 * Hook that applies CSS variables from the GoDaddy context to the document
 * Priority: overrideVariables > context.appearance
 * @param {GoDaddyVariables} [overrideVariables] - Optional variables that override context variables
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
      // Override variables come from session.appearance.variables which are in camelCase
      // Convert them to kebab-case
      if ('checkout' in overrideVariables) {
        overrideCssVars = convertCamelCaseToKebabCase(
          overrideVariables.checkout as Record<string, string>
        );
      } else {
        overrideCssVars = convertCamelCaseToKebabCase(
          overrideVariables as Record<string, string>
        );
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
      if (value !== undefined) {
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
