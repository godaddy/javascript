// import { Badge } from "@/components/ui/badge";

import { Image } from 'lucide-react';
import { useGoDaddyContext } from '@/godaddy-provider';
import type { SKUProduct } from '@/types';
import { formatCurrency } from '@/components/checkout/utils/format-currency';

export interface Note {
  content: string | null;
  id: string | null;
}

export interface CostAdjustment {
  currencyCode?: string;
  value?: number;
}

export interface AddonValue {
  amountIncreased?: number;
  costAdjustment?: CostAdjustment;
  name?: string;
}

export interface SelectedAddon {
  attribute?: string;
  sku?: string;
  values?: AddonValue[];
}

export interface SelectedOption {
  attribute?: string;
  values?: string[];
}

export type ProductDiscount = {
  amount: {
    currencyCode: string;
    value: number;
  };
  code: string;
  name: string;
  ratePercentage: string | null;
};

export type Product = Partial<SKUProduct> & {
  image: string;
  quantity: number;
  originalPrice: number;
  price: number;
  notes?: Note[] | null;
  addons?: SelectedAddon[];
  selectedOptions?: SelectedOption[];
  discounts?: ProductDiscount[];
};

export interface DraftOrderLineItemsProps {
  items: Product[];
  currencyCode?: string;
}

export function DraftOrderLineItems({
  items,
  currencyCode = 'USD',
}: DraftOrderLineItemsProps) {
  const { t } = useGoDaddyContext();

  return (
    <div className='space-y-4 mb-4'>
      {items.map(item => (
        <div key={item.id} className='flex items-start space-x-4'>
          {item.image ? (
            <div className='relative'>
              <img
                src={item.image}
                alt={item.name}
                className='min-h-12 min-w-12 h-12 w-12 border border-border rounded-lg object-cover'
              />
            </div>
          ) : (
            <div className='relative bg-muted flex items-center justify-center min-h-12 min-w-12 h-12 w-12 border border-border rounded-lg object-cover'>
              <Image
                className='h-5 w-5 text-muted-foreground'
                name='image-placeholder'
              />
            </div>
          )}
          <div className='flex-1 space-y-1'>
            <div className='flex items-start justify-between'>
              <div className='flex flex-col gap-0.5'>
                <span className='gap-1'>
                  <span className='text-sm mr-1'>{item.name}</span>
                  {item?.selectedOptions?.length ? (
                    <span className='text-xs'>
                      (
                      {item.selectedOptions
                        .flatMap(option => option.values || [])
                        .join(' / ')}
                      )
                    </span>
                  ) : null}
                </span>
                <span className='text-xs grid'>
                  {item?.addons?.map((addon: SelectedAddon, index: number) => (
                    <span key={`addon-${index}`} className='text-xs'>
                      <span>{addon.attribute}: </span>
                      {addon.values?.map(value => (
                        <span
                          className='text-muted-foreground'
                          key={`addon-${value.name}`}
                        >
                          {value.name}
                        </span>
                      ))}
                    </span>
                  ))}
                  {item.notes?.length ? (
                    <>
                      <span className='font-bold'>{t.lineItems.note}</span>
                      {item.notes?.map(note => (
                        <span key={`note-${note.id}`}>{note.content}</span>
                      ))}
                    </>
                  ) : null}
                </span>
                <span className='text-xs text-muted-foreground'>
                  {t.general.quantity}: {item.quantity}
                </span>
              </div>
              {item.originalPrice && item.quantity ? (
                <div className='text-right'>
                  <div>
                    <span className='text-sm'>
                      {formatCurrency({
                        amount: item.originalPrice * item.quantity,
                        currencyCode,
                        isInCents: true,
                      })}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
