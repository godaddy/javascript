'use client';

import { enUs } from '@godaddy/localizations';
import {
  QueryClient,
  QueryClientProvider,
  type QueryClientProviderProps,
} from '@tanstack/react-query';
import React from 'react';
import { convertCamelCaseToKebabCase } from '@/components/checkout/utils/case-conversion';
import { themes, useTheme } from '@/hooks/use-theme.tsx';
import { useVariables } from '@/hooks/use-variables.tsx';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });
}

// For backwards compatibility - only use in client-side code
export const queryClient = createQueryClient();

export type GoDaddyTheme = 'base' | 'orange' | 'purple';

export interface CSSVariables {
  'font-sans'?: string;
  'font-serif'?: string;
  'font-mono'?: string;
  'default-font-family'?: string;
  background?: string;
  'secondary-background'?: string;
  foreground?: string;
  card?: string;
  'card-foreground'?: string;
  popover?: string;
  'popover-foreground'?: string;
  primary?: string;
  'primary-foreground'?: string;
  secondary?: string;
  'secondary-foreground'?: string;
  muted?: string;
  'muted-foreground'?: string;
  accent?: string;
  'accent-foreground'?: string;
  destructive?: string;
  'destructive-foreground'?: string;
  border?: string;
  input?: string;
  ring?: string;
  radius?: string;
}

export type GoDaddyVariables =
  | CSSVariables
  | {
      checkout: CSSVariables;
    };

export interface GoDaddyAppearance {
  theme?: GoDaddyTheme;
  variables?: GoDaddyVariables;
}

interface GoDaddyContextValue {
  t: typeof enUs;
  appearance?: GoDaddyAppearance;
  debug?: boolean;
  apiHost?: string;
  clientId?: string;
  storeId?: string;
  channelId?: string;
  locale?: string;
  Link?: React.ComponentType<LinkComponentProps>;
  accessToken?: string;
}

export interface LinkComponentProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

const godaddyContext = React.createContext<GoDaddyContextValue>({
  t: enUs,
  debug: false,
});

export const useGoDaddyContext = () => React.useContext(godaddyContext);

export interface GoDaddyProviderProps {
  localization?: typeof enUs;
  appearance?: GoDaddyAppearance;
  debug?: boolean;
  /**
   * API host for checkout GraphQL requests.
   * Defaults to production (https://checkout.commerce.api.godaddy.com).
   *
   * Internal devs can set to:
   * - "http://localhost:3000" for local development
   */
  apiHost?: string;
  clientId?: string;
  storeId?: string;
  channelId?: string;
  locale?: string;
  /**
   * OAuth access token for authenticated GoDaddy API requests.
   * Obtained by exchanging the auth_idp cookie via the server-side
   * `exchangeIdpToken` function.
   */
  accessToken?: string;

  queryClient?: QueryClient;
  Link?: React.ComponentType<LinkComponentProps>;
  children: QueryClientProviderProps['children'];
}

export function GoDaddyProvider({
  localization = enUs,
  appearance,
  debug,
  apiHost,
  clientId,
  storeId,
  channelId,
  locale = 'en-US',
  accessToken,
  queryClient: providedQueryClient,
  Link,
  children,
}: GoDaddyProviderProps) {
  // Create a new QueryClient per component instance for SSR safety
  const [clientInstance] = React.useState(
    () => providedQueryClient ?? createQueryClient()
  );
  // Apply the 'gd-' prefix to CSS variables
  const processedAppearance = React.useMemo(() => {
    if (!appearance?.variables) return appearance;

    const processedVariables =
      'checkout' in appearance.variables
        ? { checkout: appearance.variables.checkout }
        : appearance.variables;

    return {
      ...appearance,
      variables: processedVariables,
    };
  }, [appearance]);

  const inlineStyles = React.useMemo(() => {
    if (!processedAppearance?.variables) return '';

    const rawVars =
      'checkout' in processedAppearance.variables
        ? processedAppearance.variables.checkout
        : processedAppearance.variables;

    // Check if variables need kebab-case conversion
    const needsConversion = !Object.keys(rawVars).some(key =>
      key.includes('-')
    );
    const vars = needsConversion
      ? convertCamelCaseToKebabCase(rawVars as Record<string, string>)
      : rawVars;

    const sanitizeCSSValue = (value: string): string => {
      return value
        .replace(/[<>{}]/g, '') // Remove characters that could close tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/data:/gi, '') // Remove data: protocol
        .replace(/vbscript:/gi, '') // Remove vbscript: protocol
        .replace(/expression\(/gi, ''); // Remove IE expression()
    };

    const cssVars = Object.entries(vars)
      .filter(([_, value]) => value != null)
      .map(([key, value]) => {
        const sanitizedValue = sanitizeCSSValue(String(value));
        return `--gd-${key}: ${sanitizedValue};`;
      })
      .join(' ');

    return cssVars ? `:root { ${cssVars} }` : '';
  }, [processedAppearance]);

  // Generate inline script to apply theme class before hydration
  const themeScript = React.useMemo(() => {
    const theme = processedAppearance?.theme;
    if (!theme || theme === 'base') return null;

    const themeValues = Object.values(themes).map(t => t.value);
    const themeClass = themes[theme]?.value;

    if (!themeClass) return null;

    // Script that runs synchronously before React hydration
    // Using JSON.stringify to prevent any injection attacks
    return `
      (function() {
        var themeClasses = ${JSON.stringify(themeValues)};
        var root = document.documentElement;
        themeClasses.forEach(function(t) { root.classList.remove(t); });
        root.classList.add(${JSON.stringify(themeClass)});
      })();
    `;
  }, [processedAppearance?.theme]);

  useVariables(processedAppearance?.variables);
  useTheme(processedAppearance?.theme);

  return (
    <godaddyContext.Provider
      value={{
        t: localization,
        appearance: processedAppearance,
        debug,
        apiHost,
        clientId,
        storeId,
        channelId,
        locale,
        Link,
        accessToken,
      }}
    >
      {inlineStyles && (
        <style
          dangerouslySetInnerHTML={{ __html: inlineStyles }}
          data-godaddy-vars
        />
      )}
      {themeScript && (
        <script
          dangerouslySetInnerHTML={{ __html: themeScript }}
          data-godaddy-theme
        />
      )}
      <QueryClientProvider client={clientInstance}>
        {children}
      </QueryClientProvider>
    </godaddyContext.Provider>
  );
}
