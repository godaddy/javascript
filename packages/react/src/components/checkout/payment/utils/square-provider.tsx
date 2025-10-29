import React, { createContext, type ReactNode, useContext, useState } from 'react';
import type { SquarePaymentMethod } from '@/components/checkout/payment/payment-methods/credit-card/square';

type SquareContextType = {
  card: SquarePaymentMethod | null;
  setCard: (card: SquarePaymentMethod | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
};

const SquareContext = createContext<SquareContextType | undefined>(undefined);

export const SquareProvider = ({ children }: { children: ReactNode }) => {
  const [card, setCard] = useState<SquarePaymentMethod | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  return <SquareContext.Provider value={{ card, setCard, isLoading, setIsLoading }}>{children}</SquareContext.Provider>;
};

export const useSquare = () => {
  const context = useContext(SquareContext);
  if (!context) {
    throw new Error('useSquare must be used within a SquareProvider');
  }
  return context;
};
