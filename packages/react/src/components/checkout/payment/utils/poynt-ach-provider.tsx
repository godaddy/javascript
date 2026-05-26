import React, {
  createContext,
  type ReactNode,
  useContext,
  useState,
} from 'react';
import type { TokenizeJs } from '@/components/checkout/payment/types';

type PoyntACHCollectContextType = {
  collect: TokenizeJs | null;
  setCollect: (collect: TokenizeJs | null) => void;
  isLoadingNonce: boolean;
  setIsLoadingNonce: (loading: boolean) => void;
};

const PoyntACHCollectContext = createContext<
  PoyntACHCollectContextType | undefined
>(undefined);

export const PoyntACHCollectProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [collect, setCollect] = useState<TokenizeJs | null>(null);
  const [isLoadingNonce, setIsLoadingNonce] = useState<boolean>(false);

  return (
    <PoyntACHCollectContext.Provider
      value={{ collect, setCollect, isLoadingNonce, setIsLoadingNonce }}
    >
      {children}
    </PoyntACHCollectContext.Provider>
  );
};

export const usePoyntACHCollect = () => {
  const context = useContext(PoyntACHCollectContext);
  if (!context) {
    throw new Error(
      'usePoyntACHCollect must be used within a PoyntACHCollectProvider'
    );
  }
  return context;
};
