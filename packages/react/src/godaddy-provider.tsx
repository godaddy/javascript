import { enUs } from '@godaddy/localizations';
import {
  QueryClient,
  QueryClientProvider,
  type QueryClientProviderProps,
} from '@tanstack/react-query';
import React from 'react';

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
  queryClient?: QueryClient;
  children: QueryClientProviderProps['children'];
}

export function GoDaddyProvider({
  localization = enUs,
  appearance,
  debug,
  queryClient: providedQueryClient,
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

  return (
    <godaddyContext.Provider
      value={{ t: localization, appearance: processedAppearance, debug }}
    >
      <QueryClientProvider client={clientInstance}>
        {children}
      </QueryClientProvider>
    </godaddyContext.Provider>
  );
}
