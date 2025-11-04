import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import type { CheckoutProps } from '@/components/checkout/checkout';
import { useGoDaddyContext } from '@/godaddy-provider';
import {
  exchangeCheckoutToken,
  getCheckoutSession,
  refreshCheckoutToken,
} from '@/lib/godaddy/godaddy';
import { getSessionIdFromPath, getUrlHash } from '@/lib/utils';
import { useSessionStorage } from './use-session-storage';

function decodeJwt(token: string): { exp: number } | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function useCheckoutSession(props?: CheckoutProps) {
  const { apiHost } = useGoDaddyContext();
  const [jwt, setJwt, removeJwt] = useSessionStorage(
    'godaddy-checkout-jwt',
    ''
  );
  const [storedSessionId, setStoredSessionId, removeStoredSessionId] =
    useSessionStorage('godaddy-checkout-session-id', '');
  const refreshTimerRef = useRef<number | null>(null);

  let sessionId: string;
  let sessionToken: string | null;

  if (props?.session) {
    sessionId = props?.session.id;
    sessionToken = props?.session.token;
  } else {
    sessionId =
      typeof window !== 'undefined'
        ? getSessionIdFromPath(window.location)
        : '';
    sessionToken =
      typeof window !== 'undefined' ? getUrlHash(window.location) : '';
  }

  const scheduleRefresh = useCallback(
    (currentJwt: string) => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      const decoded = decodeJwt(currentJwt);
      if (!decoded?.exp) return;

      const expiresAt = decoded.exp * 1000;
      const now = Date.now();
      const refreshIn = Math.max(0, expiresAt - now - 60000);

      refreshTimerRef.current = window.setTimeout(async () => {
        try {
          const result = await refreshCheckoutToken(currentJwt, apiHost);
          if (result?.jwt) {
            setJwt(result.jwt);
            scheduleRefresh(result.jwt);
          }
        } catch (_error) {
          removeJwt();
          removeStoredSessionId();
        }
      }, refreshIn);
    },
    [setJwt, removeJwt, removeStoredSessionId, apiHost]
  );

  useEffect(() => {
    if (!sessionId || !sessionToken) return;

    let cancelled = false;

    // If we have a JWT for a different session, clear it
    if (jwt && storedSessionId && storedSessionId !== sessionId) {
      removeJwt();
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    }

    // If we already have a JWT for this session, nothing to do
    if (jwt && storedSessionId === sessionId) return;

    (async () => {
      try {
        const result = await exchangeCheckoutToken({
          sessionId,
          token: sessionToken,
        }, apiHost);
        if (cancelled) return;
        if (!result?.jwt) return;

        setJwt(result.jwt);
        setStoredSessionId(sessionId);
        if (typeof window !== 'undefined') {
          window.history.replaceState(
            null,
            '',
            window.location.pathname + window.location.search
          );
        }
        scheduleRefresh(result.jwt);
      } catch (_error) {
        removeJwt();
        removeStoredSessionId();
      }
    })();

    return () => {
      cancelled = true;
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [
    sessionId,
    sessionToken,
    jwt,
    storedSessionId,
    setJwt,
    removeJwt,
    setStoredSessionId,
    removeStoredSessionId,
    scheduleRefresh,
    apiHost,
  ]);

  useEffect(() => {
    if (!jwt || storedSessionId !== sessionId) return;
    scheduleRefresh(jwt);
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [jwt, sessionId, storedSessionId, scheduleRefresh]);

  const checkoutSessionQuery = useQuery({
    queryKey: ['checkout-session', sessionId],
    queryFn: () => getCheckoutSession({ accessToken: jwt }, apiHost),
    enabled: !!jwt && storedSessionId === sessionId,
  });

  return { session: checkoutSessionQuery.data, jwt };
}
