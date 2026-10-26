import type { ReactElement, ReactNode } from 'react';
import { errorActionClass, errorNoticeClass } from './class-names';
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
      {connection === 'unbound' ? (
        <p role='status' className='text-sm text-commerce-muted'>
          Connect a store to show products.
        </p>
      ) : connection === 'loading' || connection === 'connecting' ? (
        <p role='status' className='text-sm text-commerce-muted'>
          Connecting to the store…
        </p>
      ) : (
        <div role='alert' className={errorNoticeClass}>
          <p>{connectionError}</p>
          <button type='button' className={errorActionClass} onClick={retryConnection}>
            Retry connection
          </button>
        </div>
      )}
    </StorefrontSurface>
  );
}
