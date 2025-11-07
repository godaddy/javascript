'use client';

import { GoDaddyProvider } from '@godaddy/react';
import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
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
    <NuqsAdapter>
      <GoDaddyProvider
        queryClient={queryClient}
        appearance={{
          variables: { primary: '#ff0000', 'primary-foreground': '#FFFFFF' },
        }}
      >
        {children}
        <ReactQueryDevtools client={queryClient} initialIsOpen={false} />
      </GoDaddyProvider>
    </NuqsAdapter>
  );
}
