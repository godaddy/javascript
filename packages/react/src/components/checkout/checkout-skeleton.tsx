import { LineItemSkeleton } from '@/components/checkout/line-items/line-item-skeleton';
import { TotalsSkeleton } from '@/components/checkout/totals/totals-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckoutSection } from './checkout-section';

function CheckoutSectionHeaderSkeleton() {
  return (
    <div className='mb-4'>
      <Skeleton className='h-6 w-32 mb-1' />
      <Skeleton className='h-4 w-48' />
    </div>
  );
}

export function CheckoutSkeleton({ direction }: { direction?: string }) {
  return (
    <div>
      <div
        className={`grid min-h-screen grid-cols-1 ${
          direction === 'rtl'
            ? "md:grid-cols-[1fr_minmax(min-content,_calc(50%_+_calc(calc(66rem_-_52rem)_/_2)))] [grid-template-areas:'left'_'right'] md:[grid-template-areas:'right_left']"
            : "md:grid-cols-[minmax(min-content,_calc(50%_+_calc(calc(66rem_-_52rem)_/_2)))_1fr] [grid-template-areas:'right'_'left'] md:[grid-template-areas:'left_right']"
        }`}
      >
        {/* Left column - Forms */}
        <div
          style={{
            gridArea: 'left',
          }}
          className={`flex ${direction === 'rtl' ? 'md:justify-start' : 'md:justify-end'} h-full bg-background border-r border-border sm:border-r-0 md:border-r`}
        >
          <div className='p-8 w-full md:max-w-[618px]'>
            <div className='grid gap-4'>
              <div
                className='grid gap-4'
                style={{
                  gridTemplateColumns: '1fr',
                  gridTemplateRows: 'repeat(4, auto)',
                  gridTemplateAreas: "'contact' 'delivery' 'payment'",
                }}
              >
                {/* Contact section skeleton */}
                <CheckoutSection style={{ gridArea: 'contact' }}>
                  <CheckoutSectionHeaderSkeleton />
                  <div className='space-y-4'>
                    <Skeleton className='h-10 w-full' />
                  </div>
                </CheckoutSection>

                {/* Delivery section skeleton */}
                <CheckoutSection style={{ gridArea: 'delivery' }}>
                  <CheckoutSectionHeaderSkeleton />
                  <div className='space-y-0'>
                    {[1, 2].map((i, index) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between space-x-2 bg-card border border-muted p-2 px-4 ${
                          index === 0 ? 'rounded-t-md' : ''
                        } ${index === 1 ? 'rounded-b-md' : ''} ${index !== 0 ? 'border-t-0' : ''}`}
                      >
                        <div className='flex items-center space-x-4'>
                          <Skeleton className='h-4 w-4 rounded-full' />
                          <div className='inline-flex flex-col'>
                            <Skeleton className='h-4 w-24' />
                            <Skeleton className='h-3 w-32 mt-1' />
                          </div>
                        </div>
                        <div className='flex items-center'>
                          <Skeleton className='h-6 w-6' />
                        </div>
                      </div>
                    ))}
                  </div>
                </CheckoutSection>

                {/* Payment section skeleton */}
                <CheckoutSection style={{ gridArea: 'payment' }}>
                  <CheckoutSectionHeaderSkeleton />
                  <div className='space-y-4'>
                    <Skeleton className='h-10 w-full' />
                    <div className='grid grid-cols-2 gap-4'>
                      <Skeleton className='h-10 w-full' />
                      <Skeleton className='h-10 w-full' />
                    </div>
                    <Skeleton className='h-10 w-full' />
                  </div>
                </CheckoutSection>
              </div>

              <div className='flex flex-col gap-2 mt-4'>
                <Skeleton className='h-12 w-full' />
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Order summary */}
        <div className='bg-secondary-background' style={{ gridArea: 'right' }}>
          <div
            className={`p-0 md:p-8 w-full md:max-w-xl md:sticky md:top-0 ${direction === 'rtl' ? 'md:ml-auto' : ''}`}
          >
            {/* Mobile view */}
            <div className='p-4 block md:hidden'>
              {/* Collapsible summary header for mobile */}
              <div className='flex items-center justify-between py-2 px-0'>
                <div className='flex items-center'>
                  <Skeleton className='h-6 w-32' />
                  <Skeleton className='h-4 w-4 ml-2' />
                </div>
                <Skeleton className='h-7 w-24' />
              </div>
              <TotalsSkeleton />
            </div>

            {/* Desktop view - always visible */}
            <div className='hidden md:block'>
              <LineItemSkeleton />
              <TotalsSkeleton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
