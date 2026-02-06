import React, {
  createContext,
  type ReactNode,
  useContext,
  useState,
} from 'react';

type MercadoPagoInstance = {
  bricks: () => any;
};

type MercadoPagoContextType = {
  mpInstance: MercadoPagoInstance | null;
  setMpInstance: (instance: MercadoPagoInstance | null) => void;
  bricksBuilder: any;
  setBricksBuilder: (builder: any) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
};

const MercadoPagoContext = createContext<MercadoPagoContextType | undefined>(
  undefined
);

export const MercadoPagoProvider = ({ children }: { children: ReactNode }) => {
  const [mpInstance, setMpInstance] = useState<MercadoPagoInstance | null>(
    null
  );
  const [bricksBuilder, setBricksBuilder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  return (
    <MercadoPagoContext.Provider
      value={{
        mpInstance,
        setMpInstance,
        bricksBuilder,
        setBricksBuilder,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </MercadoPagoContext.Provider>
  );
};

export const useMercadoPago = () => {
  const context = useContext(MercadoPagoContext);
  if (!context) {
    throw new Error(
      'useMercadoPago must be used within a MercadoPagoProvider'
    );
  }
  return context;
};
