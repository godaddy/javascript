'use client';

import type React from 'react';
import {
  createContext,
  type ReactNode,
  useContext,
  useRef,
  useState,
} from 'react';

interface PayPalCardFieldsRef {
  submit: () => Promise<void>;
  isEligible: () => boolean;
}

interface PayPalProviderContextValue {
  cardFieldsRef: React.MutableRefObject<PayPalCardFieldsRef | null>;
  isCardFieldsReady: boolean;
  setIsCardFieldsReady: (ready: boolean) => void;
  cardFieldsError: string | null;
  setCardFieldsError: (error: string | null) => void;
  fieldValidationErrors: Record<string, string>;
  setFieldValidationErrors: (errors: Record<string, string>) => void;
}

const PayPalProviderContext = createContext<PayPalProviderContextValue | null>(
  null
);

interface PayPalProviderProps {
  children: ReactNode;
}

export function PayPalProvider({ children }: PayPalProviderProps) {
  const cardFieldsRef = useRef<PayPalCardFieldsRef | null>(null);
  const [isCardFieldsReady, setIsCardFieldsReady] = useState(false);
  const [cardFieldsError, setCardFieldsError] = useState<string | null>(null);
  const [fieldValidationErrors, setFieldValidationErrors] = useState<
    Record<string, string>
  >({});

  const value = {
    cardFieldsRef,
    isCardFieldsReady,
    setIsCardFieldsReady,
    cardFieldsError,
    setCardFieldsError,
    fieldValidationErrors,
    setFieldValidationErrors,
  };

  return (
    <PayPalProviderContext.Provider value={value}>
      {children}
    </PayPalProviderContext.Provider>
  );
}

export function usePayPalProvider() {
  const context = useContext(PayPalProviderContext);
  if (!context) {
    throw new Error('usePayPalProvider must be used within a PayPalProvider');
  }
  return context;
}
