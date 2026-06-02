import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { enUs } from '@godaddy/localizations';
import {
  clearOperations,
  createMockJwt,
  flushPromises,
  getOperations,
  renderCheckout,
  seedCheckoutSessionStorage,
  setCheckoutUrl,
  waitForCheckoutReady,
  waitForOperation,
} from './checkout-test-env';

function createMockJwtWithoutExp(payload: Record<string, unknown> = {}) {
  const encode = (value: Record<string, unknown>) =>
    btoa(JSON.stringify(value))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');

  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.signature`;
}

describe('Checkout JWT/session acquisition', () => {
  it('renders without a session prop, reads session id/token from URL, and exchanges the checkout token', async () => {
    const jwt = createMockJwt();
    setCheckoutUrl({
      pathname: '/checkout/checkout-session-1',
      hash: '#public-token-1',
    });

    renderCheckout({
      renderSessionProp: false,
      apiOverrides: { exchangeToken: jwt },
    });

    await waitForOperation('ExchangeCheckoutToken');
    await waitForCheckoutReady();

    expect(getOperations('ExchangeCheckoutToken')[0].input).toMatchObject({
      sessionId: 'checkout-session-1',
      token: 'public-token-1',
    });
    expect(window.location.hash).toBe('');
  });

  it('fetches the checkout session with the exchanged access token', async () => {
    const jwt = createMockJwt();
    setCheckoutUrl({
      pathname: '/checkout/checkout-session-1',
      hash: '#public-token-1',
    });

    renderCheckout({
      renderSessionProp: false,
      apiOverrides: { exchangeToken: jwt },
    });

    await waitForCheckoutReady();

    expect(getOperations('CheckoutSession').at(-1)?.input).toEqual({
      accessToken: jwt,
    });
  });

  it('uses a stored JWT for the current session and skips token exchange', async () => {
    const jwt = createMockJwt();
    setCheckoutUrl({ pathname: '/checkout/checkout-session-1' });
    seedCheckoutSessionStorage({ jwt, sessionId: 'checkout-session-1' });

    renderCheckout({ renderSessionProp: false });
    await waitForCheckoutReady();

    expect(getOperations('ExchangeCheckoutToken')).toHaveLength(0);
    expect(getOperations('CheckoutSession').at(-1)?.input).toEqual({
      accessToken: jwt,
    });
  });

  it('keeps using a stored JWT without exp and does not schedule a refresh', async () => {
    const jwtWithoutExp = createMockJwtWithoutExp({ sub: 'no-exp' });
    setCheckoutUrl({ pathname: '/checkout/checkout-session-1' });
    seedCheckoutSessionStorage({
      jwt: jwtWithoutExp,
      sessionId: 'checkout-session-1',
    });
    renderCheckout({ renderSessionProp: false });
    await waitForCheckoutReady();
    await flushPromises();

    expect(getOperations('ExchangeCheckoutToken')).toHaveLength(0);
    expect(getOperations('RefreshCheckoutToken')).toHaveLength(0);
    expect(getOperations('CheckoutSession').at(-1)?.input).toEqual({
      accessToken: jwtWithoutExp,
    });

    await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
    expect(getOperations('RefreshCheckoutToken')).toHaveLength(0);
  });

  it('prefers the stored JWT over a URL token when storage matches the current session', async () => {
    const storedJwt = createMockJwt({ source: 'storage' });
    const exchangedJwt = createMockJwt({ source: 'url' });
    setCheckoutUrl({
      pathname: '/checkout/checkout-session-1',
      hash: '#public-token-from-url',
    });
    seedCheckoutSessionStorage({
      jwt: storedJwt,
      sessionId: 'checkout-session-1',
    });

    renderCheckout({
      renderSessionProp: false,
      apiOverrides: { exchangeToken: exchangedJwt },
    });
    await waitForCheckoutReady();

    expect(getOperations('ExchangeCheckoutToken')).toHaveLength(0);
    expect(getOperations('CheckoutSession').at(-1)?.input).toEqual({
      accessToken: storedJwt,
    });
    // TODO(T-1301): Revisit if product requirements change to make the URL
    // checkout token override a same-session stored JWT.
    expect(window.location.hash).toBe('#public-token-from-url');
  });

  it('clears a stored JWT when it belongs to a different session id', async () => {
    const jwt = createMockJwt();
    setCheckoutUrl({ pathname: '/checkout/checkout-session-1' });
    seedCheckoutSessionStorage({ jwt, sessionId: 'old-session' });

    renderCheckout({ renderSessionProp: false });

    await waitFor(() => {
      expect(window.sessionStorage.getItem('godaddy-checkout-jwt')).toBeNull();
      expect(getOperations('ExchangeCheckoutToken')).toHaveLength(0);
    });
  });

  it('refreshes the checkout token before expiry', async () => {
    const jwt = createMockJwt({ exp: Math.floor(Date.now() / 1000) + 61 });
    const refreshedJwt = createMockJwt({
      exp: Math.floor(Date.now() / 1000) + 600,
      refreshed: true,
    });
    setCheckoutUrl({ pathname: '/checkout/checkout-session-1' });
    seedCheckoutSessionStorage({ jwt, sessionId: 'checkout-session-1' });

    renderCheckout({
      renderSessionProp: false,
      apiOverrides: { refreshToken: refreshedJwt },
    });
    await waitForCheckoutReady();

    await waitForOperation('RefreshCheckoutToken');

    expect(getOperations('RefreshCheckoutToken')[0].input).toEqual({
      accessToken: jwt,
    });
    expect(window.sessionStorage.getItem('godaddy-checkout-jwt')).toBe(
      JSON.stringify(refreshedJwt)
    );
  });

  it('clears storage when token refresh fails', async () => {
    const jwt = createMockJwt({ exp: Math.floor(Date.now() / 1000) + 61 });
    setCheckoutUrl({ pathname: '/checkout/checkout-session-1' });
    seedCheckoutSessionStorage({ jwt, sessionId: 'checkout-session-1' });

    renderCheckout({
      renderSessionProp: false,
      apiOverrides: {
        errors: { refreshCheckoutToken: 'refresh failed' },
      },
    });
    await waitForCheckoutReady();

    await waitForOperation('RefreshCheckoutToken');
    await waitFor(() => {
      expect(window.sessionStorage.getItem('godaddy-checkout-jwt')).toBeNull();
      expect(
        window.sessionStorage.getItem('godaddy-checkout-session-id')
      ).toBeNull();
    });
  });

  it('falls back to the legacy session prop when token exchange fails', async () => {
    renderCheckout({
      sessionOverrides: {
        enableShipping: false,
        enableLocalPickup: false,
        enableTaxCollection: false,
        enablePromotionCodes: false,
      },
      apiOverrides: {
        errors: { exchangeCheckoutToken: 'exchange failed' },
      },
    });

    await waitForOperation('ExchangeCheckoutToken');
    await waitForCheckoutReady();

    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('Payment')).toBeInTheDocument();
    await flushPromises();
  });

  it('shows checkout-session-not-found UI when exchange fails and no session prop exists', async () => {
    setCheckoutUrl({
      pathname: '/checkout/checkout-session-1',
      hash: '#public-token-1',
    });

    renderCheckout({
      renderSessionProp: false,
      apiOverrides: {
        errors: { exchangeCheckoutToken: 'exchange failed' },
      },
    });

    await waitFor(() => {
      expect(document.body).toHaveTextContent(
        enUs.apiErrors.CHECKOUT_SESSION_NOT_FOUND
      );
    });
  });
});
