'use client';

import { GoDaddyProvider } from '@godaddy/react';
import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <GoDaddyProvider
      queryClient={queryClient}
      appearance={{
        variables: { primary: '#ff0000', 'primary-foreground': '#FFFFFF' },
      }}
    >
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </GoDaddyProvider>
  );
}
