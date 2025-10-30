import { cn } from '@/lib/utils';

export function CheckoutSectionHeader({
  title,
  description,
  className,
  classNames,
}: React.PropsWithChildren<{
  title?: string;
  description?: string;
  className?: string;
  classNames?: {
    title?: string;
    description?: string;
  };
}>) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className='space-y-1'>
        {title ? (
          <h3 className={cn('font-semibold', classNames?.title)}>{title}</h3>
        ) : null}
        {description ? (
          <p className={cn('text-sm text-gray-500', classNames?.description)}>
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
