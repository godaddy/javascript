'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AuthMode, CheckoutSession, JwtAuthState } from '@/types';
import * as ClientAPI from '@/lib/godaddy/godaddy.client';

interface CheckoutAuthContextValue {
  authState: JwtAuthState;
  session: CheckoutSession | undefined;
  refreshToken: () => Promise<void>;
}

const CheckoutAuthContext = createContext<CheckoutAuthContextValue | null>(
  null
);

export function useCheckoutAuth(): CheckoutAuthContextValue {
  const context = useContext(CheckoutAuthContext);
  if (!context) {
    throw new Error(
      'useCheckoutAuth must be used within CheckoutAuthProvider'
    );
  }
  return context;
}

interface CheckoutAuthProviderProps {
  children: ReactNode;
  session?: CheckoutSession;
  authMode?: AuthMode;
}

export function CheckoutAuthProvider({
  children,
  session: initialSession,
  authMode = 'auto',
}: CheckoutAuthProviderProps) {
  const [authState, setAuthState] = useState<JwtAuthState>({
    mode: 'legacy',
  });
  const [session, setSession] = useState<CheckoutSession | undefined>(
    initialSession
  );
  const refreshTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const latestJwtRef = useRef<string | null>(null);
  const latestSessionIdRef = useRef<string | null>(null);

  const extractFragmentToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash.slice(1);
    if (!hash) return null;
    
    for (const part of hash.split('&')) {
      if (part.startsWith('token=')) {
        const t = part.split('=')[1];
        return t?.startsWith('tok_') ? t : null;
      }
      if (part.startsWith('tok_')) return part;
    }
    return null;
  };

  const extractSessionIdFromUrl = (): string | null => {
    if (typeof window === 'undefined') return null;
    const parts = window.location.pathname.split('/').filter(Boolean);
    const id = parts[parts.length - 1];
    return id?.startsWith('sess_') ? id : null;
  };

  const scheduleRefresh = (expiresAt: number) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    const now = Date.now() / 1000;
    const refreshAt = expiresAt - 60;
    const delay = Math.max(0, refreshAt - now) * 1000;

    refreshTimerRef.current = window.setTimeout(() => {
      void refreshToken();
    }, delay);
  };

  const refreshToken = async () => {
    const jwt = latestJwtRef.current;
    if (!jwt) return;

    try {
      const result = (await ClientAPI.refreshCheckoutToken(jwt)) as {
        jwt: string;
        expiresIn: number;
        expiresAt: string;
        sessionId: string;
      };

      const expiresAt = new Date(result.expiresAt).getTime() / 1000;

      if (!mountedRef.current) return;

      setAuthState({
        jwt: result.jwt,
        expiresAt,
        sessionId: result.sessionId,
        mode: 'jwt',
      });

      latestJwtRef.current = result.jwt;
      latestSessionIdRef.current = result.sessionId;

      scheduleRefresh(expiresAt);

      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(
            `checkout_jwt_${result.sessionId}`,
            JSON.stringify({
              jwt: result.jwt,
              expiresAt,
            })
          );
        }
      } catch {
        // Ignore storage errors
      }
    } catch (error) {
      console.error('Failed to refresh checkout token:', error);
      const keyId = latestSessionIdRef.current;
      try {
        if (keyId && typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem(`checkout_jwt_${keyId}`);
        }
      } catch {
        // Ignore storage errors
      }
      if (mountedRef.current) {
        setAuthState({ mode: 'legacy' });
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    const initializeAuth = async () => {
      if (authMode === 'legacy') {
        if (mountedRef.current) setAuthState({ mode: 'legacy' });
        return;
      }

      const urlSessionId = extractSessionIdFromUrl();
      const propsSessionId = session?.id;
      const sessionIdForJwt = urlSessionId || propsSessionId;
      const fragmentToken = extractFragmentToken();

      if (propsSessionId && urlSessionId && propsSessionId !== urlSessionId) {
        console.warn(
          'SessionId mismatch between props and URL; using URL sessionId for JWT exchange'
        );
      }

      if (fragmentToken && sessionIdForJwt) {
        try {
          const result = (await ClientAPI.exchangeCheckoutToken(
            sessionIdForJwt,
            fragmentToken
          )) as {
            jwt: string;
            expiresIn: number;
            expiresAt: string;
            sessionId: string;
          };

          const expiresAt = new Date(result.expiresAt).getTime() / 1000;

          if (!mountedRef.current) return;

          setAuthState({
            jwt: result.jwt,
            expiresAt,
            sessionId: result.sessionId,
            mode: 'jwt',
          });

          latestJwtRef.current = result.jwt;
          latestSessionIdRef.current = result.sessionId;

          scheduleRefresh(expiresAt);

          try {
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem(
                `checkout_jwt_${result.sessionId}`,
                JSON.stringify({
                  jwt: result.jwt,
                  expiresAt,
                })
              );
            }
          } catch {
            // Ignore storage errors
          }

          if (typeof window !== 'undefined') {
            window.history.replaceState(
              null,
              '',
              window.location.pathname + window.location.search
            );
          }

          if (!session) {
            const sessionData = await ClientAPI.getCheckoutSession(result.jwt);
            if (mountedRef.current && sessionData?.checkoutSession) {
              setSession(sessionData.checkoutSession as CheckoutSession);
            }
          }
          return;
        } catch (error) {
          console.error('Failed to exchange checkout token:', error);
          try {
            if (sessionIdForJwt && typeof sessionStorage !== 'undefined') {
              sessionStorage.removeItem(`checkout_jwt_${sessionIdForJwt}`);
            }
          } catch {
            // Ignore storage errors
          }
          if (mountedRef.current) {
            setAuthState({ mode: 'legacy' });
          }
          return;
        }
      }

      if (sessionIdForJwt && typeof sessionStorage !== 'undefined') {
        const stored = sessionStorage.getItem(`checkout_jwt_${sessionIdForJwt}`);
        if (stored) {
          try {
            const storedAuth: { jwt: string; expiresAt: number } =
              JSON.parse(stored);
            const now = Date.now() / 1000;
            if (storedAuth.expiresAt > now) {
              if (mountedRef.current) {
                setAuthState({
                  jwt: storedAuth.jwt,
                  expiresAt: storedAuth.expiresAt,
                  sessionId: sessionIdForJwt,
                  mode: 'jwt',
                });

                latestJwtRef.current = storedAuth.jwt;
                latestSessionIdRef.current = sessionIdForJwt;

                scheduleRefresh(storedAuth.expiresAt);

                if (!session) {
                  const sessionData = await ClientAPI.getCheckoutSession(storedAuth.jwt);
                  if (mountedRef.current && sessionData?.checkoutSession) {
                    setSession(sessionData.checkoutSession as CheckoutSession);
                  }
                }
              }
              return;
            }
          } catch {
            try {
              sessionStorage.removeItem(`checkout_jwt_${sessionIdForJwt}`);
            } catch {
              // Ignore storage errors
            }
          }
        }
      }

      if (authMode === 'jwt') {
        console.warn('JWT mode requested but no token available');
      }
      if (mountedRef.current) {
        setAuthState({ mode: 'legacy' });
      }
    };

    void initializeAuth();

    return () => {
      mountedRef.current = false;
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [session?.id, authMode]);

  const contextValue = useMemo(
    () => ({
      authState,
      session,
      refreshToken,
    }),
    [authState, session]
  );

  return (
    <CheckoutAuthContext.Provider value={contextValue}>
      {children}
    </CheckoutAuthContext.Provider>
  );
}
