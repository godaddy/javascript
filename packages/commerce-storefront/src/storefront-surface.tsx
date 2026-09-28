import type { ReactElement, ReactNode } from 'react';
import { useCommerce } from './commerce-provider';

export function StorefrontSurface({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}): ReactElement {
  const { theme } = useCommerce();
  return (
    <div className={`commerce-storefront ${className}`} style={theme}>
      {children}
    </div>
  );
}

export function CommerceStatus(): ReactElement | null {
  const { connection, connectionError, retryConnection } = useCommerce();
  if (connection === 'ready') return null;
  return (
    <StorefrontSurface>
      {connection === 'loading' ? (
        <p role='status'>Connecting to the store…</p>
      ) : (
        <div role='alert'>
          <p>{connectionError}</p>
          <button type='button' className='min-h-11 underline' onClick={retryConnection}>
            Retry connection
          </button>
        </div>
      )}
    </StorefrontSurface>
  );
}
