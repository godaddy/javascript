'use client';
import { useEffect } from 'react';
// hooks/use-variables.ts
import {
  type CSSVariables,
  type GoDaddyVariables,
  useGoDaddyContext,
} from '@/godaddy-provider';

/**
 * Hook that applies CSS variables from the GoDaddy context to the document
 * @param {GoDaddyVariables} [overrideVariables] - Optional variables that override context variables
 */
export function useVariables(overrideVariables?: GoDaddyVariables) {
  const { appearance } = useGoDaddyContext();
  const contextVariables = appearance?.variables;

  useEffect(() => {
    if (!contextVariables && !overrideVariables) return;

    // Extract CSS variables from context
    let contextCssVars: CSSVariables | undefined;
    if (contextVariables) {
      if ('checkout' in contextVariables) {
        contextCssVars = contextVariables.checkout;
      } else {
        contextCssVars = contextVariables as CSSVariables;
      }
    }

    // Extract CSS variables from overrides
    let overrideCssVars: CSSVariables | undefined;
    if (overrideVariables) {
      if ('checkout' in overrideVariables) {
        overrideCssVars = overrideVariables.checkout;
      } else {
        overrideCssVars = overrideVariables as CSSVariables;
      }
    }

    // Merge the variables, with overrides taking precedence
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
