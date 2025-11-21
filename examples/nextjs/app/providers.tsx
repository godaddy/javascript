'use client';

import { GoDaddyProvider } from '@godaddy/react';
import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import Link from 'next/link';
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
      apiHost={process.env.NEXT_PUBLIC_GODADDY_API_HOST}
      storeId={process.env.NEXT_PUBLIC_GODADDY_STORE_ID}
      clientId={process.env.NEXT_PUBLIC_GODADDY_CLIENT_ID}
      channelId={process.env.NEXT_PUBLIC_GODADDY_CHANNEL_ID}
      Link={Link}
      appearance={{
        variables: { primary: '#ff0000', 'primary-foreground': '#FFFFFF' },
      }}
    >
      {children}
      <ReactQueryDevtools client={queryClient} initialIsOpen={false} />
    </GoDaddyProvider>
  );
}
