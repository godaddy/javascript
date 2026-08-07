import * as React from 'react';

import { cn } from '@/lib/utils';

export interface TextareaProps extends React.ComponentProps<'textarea'> {
  autoResize?: boolean;
  hasError?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ autoResize = false, className, hasError, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[60px] w-full rounded-md border border-border bg-transparent px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          autoResize && 'field-sizing-content resize-none overflow-hidden',
          hasError && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
