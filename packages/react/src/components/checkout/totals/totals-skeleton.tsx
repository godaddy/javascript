import { Skeleton } from '@/components/ui/skeleton';

export function TotalLineItemSkeleton({ title }: { title?: string }) {
  return (
    <div className='flex justify-between space-x-4 text-sm'>
      <div>{title ? <span>{title}</span> : <Skeleton className='w-12' />}</div>
      <div className='text-right'>
        <div>
          <Skeleton className='w-12' />
        </div>
      </div>
    </div>
  );
}

export function TotalsSkeleton() {
  return (
    <div className='space-y-4 mb-4'>
      {Array.from({ length: 4 }).map((_, index) => (
        <TotalLineItemSkeleton key={index} />
      ))}
      <div className='border-t border-border pt-4 flex justify-between space-x-4'>
        <div>
          <Skeleton className='w-12' />
        </div>
        <div className='text-right'>
          <div>
            <Skeleton className='w-12' />
          </div>
        </div>
      </div>
    </div>
  );
}
