import { CircleAlert } from 'lucide-react';
import { useGoDaddyContext } from '@/godaddy-provider';

export function DiscountErrorList({ checkoutErrors }: { checkoutErrors?: string[] }) {
  const { t } = useGoDaddyContext();

  if (!checkoutErrors?.length) return null;

  return (
    <div className='mb-4 rounded-md border border-destructive bg-destructive/10 p-4 mt-3'>
      <div className='flex items-start'>
        <CircleAlert className='text-destructive w-5 h-5 mr-3' />
        <ul className='text-destructive-foreground list-disc pl-5'>
          {checkoutErrors?.map(code => (
            <li key={code} className='text-sm'>
              {t.apiErrors?.[code as keyof typeof t.apiErrors] || code}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
