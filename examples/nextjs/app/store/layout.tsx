'use client';

import { Cart } from '@godaddy/react';
import { ShoppingCart } from 'lucide-react';
import { createContext, useContext, useState } from 'react';
import { checkoutWithOrder } from './actions';

interface CartContextType {
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const handleCheckout = async (orderId: string) => {
    setIsCheckingOut(true);
    try {
      await checkoutWithOrder(orderId);
    } catch (_error) {
      setIsCheckingOut(false);
    }
  };

  return (
    <CartContext.Provider value={{ openCart, closeCart }}>
      <section className='relative max-w-6xl mx-auto'>
        {/* Cart toggle button */}
        <button
          onClick={openCart}
          className='fixed top-4 right-4 z-40 bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors'
          aria-label='Open shopping cart'
        >
          <ShoppingCart className='h-6 w-6' />
        </button>

        {children}

        <Cart
          open={isCartOpen}
          onOpenChange={setIsCartOpen}
          onCheckout={handleCheckout}
          isCheckingOut={isCheckingOut}
        />
      </section>
    </CartContext.Provider>
  );
}

export { CartContext };
