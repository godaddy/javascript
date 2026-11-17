import type { ReactElement, ReactNode } from 'react';
import { errorActionClass, errorNoticeClass } from './class-names';
import { useCommerce, useMessage } from './commerce-provider';

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
  const text = useMessage();
  if (connection === 'ready') return null;
  return (
    <StorefrontSurface>
      {connection === 'unbound' ? (
        <p role='status' className='text-sm text-commerce-muted'>
          {text('connectPrompt')}
        </p>
      ) : connection === 'loading' || connection === 'connecting' ? (
        <p role='status' className='text-sm text-commerce-muted'>
          {text('connecting')}
        </p>
      ) : (
        <div role='alert' className={errorNoticeClass}>
          <p>{connectionError}</p>
          <button type='button' className={errorActionClass} onClick={retryConnection}>
            {text('retryConnection')}
          </button>
        </div>
      )}
    </StorefrontSurface>
  );
}
