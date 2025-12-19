import React from 'react';

interface GoDaddyContextValue {
  apiHost?: string;
  accessToken?: string;
}

const GoDaddyContext = React.createContext<GoDaddyContextValue>({});

export const useGoDaddyContext = () => React.useContext(GoDaddyContext);

export interface GoDaddyProviderProps {
  apiHost?: string;
  accessToken?: string;
  children: React.ReactNode;
}

export function GoDaddyProvider({
  apiHost,
  accessToken,
  children,
}: GoDaddyProviderProps) {
  const value = React.useMemo(
    () => ({ apiHost, accessToken }),
    [apiHost, accessToken]
  );

  return (
    <GoDaddyContext.Provider value={value}>{children}</GoDaddyContext.Provider>
  );
}
