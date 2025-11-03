'use client';
import { useEffect } from 'react';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { convertCamelCaseToKebabCase } from '@/components/checkout/utils/case-conversion';
// hooks/use-variables.ts
import {
  type CSSVariables,
  type GoDaddyVariables,
  useGoDaddyContext,
} from '@/godaddy-provider';

/**
 * Hook that applies CSS variables from the GoDaddy context to the document
 * Priority: overrideVariables > session.appearance > context.appearance
 * @param {GoDaddyVariables} [overrideVariables] - Optional variables that override all other variables
 */
export function useVariables(overrideVariables?: GoDaddyVariables) {
  const { appearance } = useGoDaddyContext();
  const { session } = useCheckoutContext();

  // Get variables from both sources
  let sessionVariables: CSSVariables | undefined;
  if (session?.appearance?.variables) {
    // Session variables come from GraphQL in camelCase, convert to kebab-case
    sessionVariables = convertCamelCaseToKebabCase(
      session.appearance.variables as Record<string, string>
    );
  }

  // Context variables are already in kebab-case
  const contextVariables = appearance?.variables;

  useEffect(() => {
    if (!sessionVariables && !contextVariables && !overrideVariables) return;

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
      if ('checkout' in overrideVariables) {
        overrideCssVars = overrideVariables.checkout;
      } else {
        overrideCssVars = overrideVariables as CSSVariables;
      }
    }

    // Merge the variables, with priority: override > session > context
    const mergedVars: CSSVariables = {
      ...contextCssVars,
      ...sessionVariables,
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
  }, [sessionVariables, contextVariables, overrideVariables]);
}
