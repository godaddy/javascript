import React, { createContext, type ReactNode, useContext, useState } from 'react';
import type { TokenizeJs } from '@/components/checkout/payment/types';

type PoyntCollectContextType = {
  collect: TokenizeJs | null;
  setCollect: (collect: TokenizeJs | null) => void;
  isLoadingNonce: boolean;
  setIsLoadingNonce: (loading: boolean) => void;
};

const PoyntCollectContext = createContext<PoyntCollectContextType | undefined>(undefined);

export const PoyntCollectProvider = ({ children }: { children: ReactNode }) => {
  const [collect, setCollect] = useState<TokenizeJs | null>(null);
  const [isLoadingNonce, setIsLoadingNonce] = useState<boolean>(false);

  return (
    <PoyntCollectContext.Provider value={{ collect, setCollect, isLoadingNonce, setIsLoadingNonce }}>
      {children}
    </PoyntCollectContext.Provider>
  );
};

export const usePoyntCollect = () => {
  const context = useContext(PoyntCollectContext);
  if (!context) {
    throw new Error('usePoyntCollect must be used within a PoyntCollectProvider');
  }
  return context;
};
