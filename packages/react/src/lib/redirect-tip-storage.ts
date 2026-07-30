const REDIRECT_TIP_KEY = 'godaddy-checkout-redirect-tip';

type StoredRedirectTip = {
  sessionId: string;
  tipAmount: number;
};

/**
 * Save the tip a gateway redirect was authorized for.
 *
 * Redirect providers (CCAvenue) authorize on one page load and confirm on
 * another: the customer leaves for the gateway and comes back to a fresh
 * document where react-hook-form state no longer exists. The authorized amount
 * is tip-inclusive, so the tip has to outlive the page or the order is recorded
 * for less than the customer was charged.
 *
 * Session storage is where the checkout JWT already lives
 * (`godaddy-checkout-jwt`), and the return-side confirmation cannot run without
 * that token, so the tip is exactly as durable as the rest of the return flow.
 */
export function setRedirectTipAmount(
  sessionId: string,
  tipAmount: number
): void {
  if (typeof window === 'undefined' || !sessionId) {
    // SSR safety
    return;
  }

  try {
    window.sessionStorage.setItem(
      REDIRECT_TIP_KEY,
      JSON.stringify({ sessionId, tipAmount } satisfies StoredRedirectTip)
    );
  } catch {
    // Storage can be unavailable (private browsing, disabled storage).
  }
}

/**
 * Read the tip saved for `sessionId`.
 *
 * Returns null when nothing was saved, the saved tip belongs to a different
 * checkout session, or storage is unreadable.
 */
export function getRedirectTipAmount(sessionId: string): number | null {
  if (typeof window === 'undefined' || !sessionId) {
    // SSR safety
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(REDIRECT_TIP_KEY);
    if (!raw) {
      return null;
    }

    const stored = JSON.parse(raw) as Partial<StoredRedirectTip> | null;
    if (stored?.sessionId !== sessionId) {
      return null;
    }

    return typeof stored.tipAmount === 'number' ? stored.tipAmount : null;
  } catch {
    return null;
  }
}

/**
 * Remove the saved redirect tip.
 */
export function clearRedirectTipAmount(): void {
  if (typeof window === 'undefined') {
    // SSR safety
    return;
  }

  try {
    window.sessionStorage.removeItem(REDIRECT_TIP_KEY);
  } catch {
    // Storage can be unavailable (private browsing, disabled storage).
  }
}
