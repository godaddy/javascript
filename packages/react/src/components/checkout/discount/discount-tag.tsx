import { Loader2, TagIcon, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface DiscountTagProps {
  discount: string;
  onRemove?: () => void;
  isRemoving?: boolean;
}

export function DiscountTag({
  discount,
  onRemove,
  isRemoving,
}: DiscountTagProps) {
  return (
    <div className='inline-flex items-center rounded-md border bg-secondary text-secondary-foreground text-xs'>
      <div className='flex items-center justify-center w-7 h-7 text-muted-foreground'>
        <TagIcon className='h-3 w-3' />
      </div>
      <span className='py-1 px-1 font-medium uppercase'>{discount}</span>
      {onRemove && (
        <Button
          variant='ghost'
          size='icon'
          className='cursor-pointer rounded-l-none h-7 w-7 p-0 bg-muted hover:bg-secondary/80 text-muted-foreground hover:text-muted-foreground/80'
          onClick={onRemove}
          disabled={isRemoving}
          aria-label={`Remove ${discount}`}
        >
          {isRemoving ? (
            <Loader2 className='h-3 w-3 animate-spin' />
          ) : (
            <X className='h-3 w-3' />
          )}
        </Button>
      )}
    </div>
  );
}
