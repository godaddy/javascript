import React from 'react';
import { useGoDaddyContext, LinkComponentProps } from '@/godaddy-provider';

/**
 * Default Link implementation that falls back to a regular anchor tag
 * if no custom Link component is provided via GoDaddyProvider
 */
const DefaultLink = React.forwardRef<
  HTMLAnchorElement,
  LinkComponentProps
>(({ href, children, ...props }, ref) => {
  return (
    <a ref={ref} href={href} {...props}>
      {children}
    </a>
  );
});
DefaultLink.displayName = 'DefaultLink';

/**
 * RouterLink component that uses the Link component from GoDaddyProvider context
 * or falls back to a default anchor implementation
 */
export const RouterLink = React.forwardRef<
  HTMLAnchorElement,
  LinkComponentProps
>((props, ref) => {
  const { Link } = useGoDaddyContext();
  const LinkComponent = Link || DefaultLink;

  return <LinkComponent ref={ref} {...props} />;
});
RouterLink.displayName = 'RouterLink';
