'use client';

import type { Product } from '@/components/checkout/line-items/line-items';
import { CartLineItems } from '@/components/storefront/cart-line-items';
import { CartTotals } from '@/components/storefront/cart-totals';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useGoDaddyContext } from '@/godaddy-provider';

interface CartProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Cart({ open, onOpenChange }: CartProps) {
  // Mock data
  const items: Product[] = [
    {
      id: 'LineItem_2y0l7o6Oi4BW6fpSiKPX1hhBccU',
      name: 'Box of cookies',
      image:
        'https://isteam.dev-wsimg.com/ip/2f2e05ec-de6f-4a89-90f2-038c749655b0/cookies.webp',
      quantity: 2,
      originalPrice: 10.99,
      price: 10.99,
      notes: [],
    },
    {
      id: 'LineItem_2y0l9FykA04qp2pC6y3YZ0TbZFD',
      name: 'Cupcakes',
      image:
        'https://isteam.dev-wsimg.com/ip/2f2e05ec-de6f-4a89-90f2-038c749655b0/cupcakes.webp/:/rs=w:600,h:600',
      quantity: 1,
      originalPrice: 5.99,
      price: 5.99,
      notes: [],
    },
  ];

  const totals = {
    subtotal: 27.97,
    discount: 0,
    shipping: 0,
    currencyCode: 'USD',
    itemCount: 3,
    total: 27.97,
    tip: 0,
    taxes: 0,
    enableDiscounts: false,
    enableTaxes: true,
    isTaxLoading: false,
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full sm:max-w-lg overflow-y-auto'>
        <SheetHeader>
          <SheetTitle>Shopping Cart</SheetTitle>
        </SheetHeader>
        <div className='mt-8 space-y-6'>
          <CartLineItems items={items} currencyCode={totals.currencyCode} />
          <CartTotals {...totals} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
