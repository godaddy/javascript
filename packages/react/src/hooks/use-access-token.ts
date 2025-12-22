'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface AccessTokenState {
  accessToken: string | undefined;
  isLoading: boolean;
  error: Error | undefined;
  expiresAt: number | undefined;
}

export interface UseAccessTokenOptions {
  /**
   * Function that exchanges credentials for an access token.
   * This should call your backend API which then calls the GoDaddy OAuth endpoint.
   * The function should return { access_token, expires_in } on success.
   */
  exchangeToken: () => Promise<{
    access_token: string;
    expires_in: number;
  }>;
  /**
   * Whether to enable automatic token refresh before expiry.
   * Defaults to true.
   */
  autoRefresh?: boolean;
  /**
   * How many seconds before expiry to trigger a refresh.
   * Defaults to 60 seconds.
   */
  refreshBufferSeconds?: number;
  /**
   * Callback when token refresh fails. Use this to trigger re-authentication.
   */
  onRefreshError?: (error: Error) => void;
}

export interface UseAccessTokenResult extends AccessTokenState {
  /**
   * Manually refresh the access token.
   */
  refresh: () => Promise<void>;
  /**
   * Clear the current token state.
   */
  clear: () => void;
}

export function useAccessToken({
  exchangeToken,
  autoRefresh = true,
  refreshBufferSeconds = 60,
  onRefreshError,
}: UseAccessTokenOptions): UseAccessTokenResult {
  const [state, setState] = useState<AccessTokenState>({
    accessToken: undefined,
    isLoading: true,
    error: undefined,
    expiresAt: undefined,
  });

  const refreshTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const clear = useCallback(() => {
    clearRefreshTimer();
    setState({
      accessToken: undefined,
      isLoading: false,
      error: undefined,
      expiresAt: undefined,
    });
  }, [clearRefreshTimer]);

  const fetchToken = useCallback(async () => {
    try {
      const result = await exchangeToken();

      if (!mountedRef.current) return;

      const expiresAt = Date.now() + result.expires_in * 1000;

      setState({
        accessToken: result.access_token,
        isLoading: false,
        error: undefined,
        expiresAt,
      });

      return { accessToken: result.access_token, expiresAt };
    } catch (err) {
      if (!mountedRef.current) return;

      const error = err instanceof Error ? err : new Error(String(err));
      setState(prev => ({
        ...prev,
        isLoading: false,
        error,
      }));

      throw error;
    }
  }, [exchangeToken]);

  const scheduleRefresh = useCallback(
    (expiresAt: number) => {
      if (!autoRefresh) return;

      clearRefreshTimer();

      const now = Date.now();
      const timeUntilExpiry = expiresAt - now - refreshBufferSeconds * 1000;
      // Minimum 10s delay to prevent infinite loop with short-lived tokens
      const refreshIn = Math.max(10000, timeUntilExpiry);

      refreshTimerRef.current = window.setTimeout(async () => {
        try {
          const result = await fetchToken();
          if (result) {
            scheduleRefresh(result.expiresAt);
          }
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          onRefreshError?.(error);
        }
      }, refreshIn);
    },
    [autoRefresh, refreshBufferSeconds, clearRefreshTimer, fetchToken, onRefreshError]
  );

  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: undefined }));
    clearRefreshTimer();

    const result = await fetchToken();
    if (result) {
      scheduleRefresh(result.expiresAt);
    }
  }, [fetchToken, scheduleRefresh, clearRefreshTimer]);

  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      try {
        const result = await fetchToken();
        if (result) {
          scheduleRefresh(result.expiresAt);
        }
      } catch {
        // Error already set in state by fetchToken
      }
    })();

    return () => {
      mountedRef.current = false;
      clearRefreshTimer();
    };
  }, [fetchToken, scheduleRefresh, clearRefreshTimer]);

  return {
    ...state,
    refresh,
    clear,
  };
}
