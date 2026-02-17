import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';

type MercadoPagoInstance = {
  bricks: () => any;
};

type MercadoPagoContextType = {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  handleBrickSubmit: (() => Promise<void>) | null;
  setHandleBrickSubmit: (handler: (() => Promise<void>) | null) => void;
};

const MercadoPagoContext = createContext<MercadoPagoContextType | undefined>(
  undefined
);

export const MercadoPagoProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [handleBrickSubmit, setHandleBrickSubmit] = useState<(() => Promise<void>) | null>(null);

  const setIsLoadingCallback = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const setHandleBrickSubmitCallback = useCallback((handler: (() => Promise<void>) | null) => {
    setHandleBrickSubmit(() => handler);
  }, []);

  return (
    <MercadoPagoContext.Provider
      value={{
        isLoading,
        setIsLoading: setIsLoadingCallback,
        handleBrickSubmit,
        setHandleBrickSubmit: setHandleBrickSubmitCallback,
      }}
    >
      {children}
    </MercadoPagoContext.Provider>
  );
};

export const useMercadoPago = () => {
  const context = useContext(MercadoPagoContext);
  if (!context) {
    throw new Error('useMercadoPago must be used within a MercadoPagoProvider');
  }
  return context;
};
