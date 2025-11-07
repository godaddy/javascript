'use client';

import { CartLineItems, CartTotals } from '@godaddy/react';

export default function CartPage() {
  const items = [
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
    currency: 'USD',
    itemCount: 3,
    total: 27.97,
    tip: 0,
    taxes: 0,
    enableDiscounts: false,
    enableTaxes: true,
    isTaxLoading: false,
  };

  return (
    <div className='container mx-auto px-4 py-8 max-w-6xl'>
      <h1 className='text-2xl font-bold mb-6'>Cart</h1>
      <div className='grid grid-cols-1 gap-8'>
        <div>
          <div className='bg-white rounded-lg shadow p-6'>
            <h2 className='text-lg font-semibold mb-4'>Your Items</h2>
            <CartLineItems items={items} />
          </div>
        </div>
        <div>
          <div className='bg-white rounded-lg shadow p-6 sticky top-4'>
            <h2 className='text-lg font-semibold mb-4'>Order Summary</h2>
            <CartTotals {...totals} />
          </div>
        </div>
      </div>
    </div>
  );
}
