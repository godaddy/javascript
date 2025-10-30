import * as React from 'react';

import { useCheckoutContext } from '@/components/checkout/checkout';
import { cn } from '@/lib/utils';

export interface InputProps extends React.ComponentProps<'input'> {
  hasError?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, key, hasError, ...props }, ref) => {
    const { elements } = useCheckoutContext();
    const inputElement = elements?.input;

    return (
      <input
        type={type}
        className={cn(
          'flex h-12 w-full rounded-md border border-border bg-input px-3 py-2 text-base transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:[box-shadow:0px_0px_0px_2px_var(--ring)_inset] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          hasError && 'border-destructive focus-visible:ring-destructive',
          className,
          inputElement
        )}
        key={key}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
