const REDIRECT_TIP_KEY_PREFIX = 'godaddy-checkout-redirect-tip';

// A gateway round-trip takes minutes. An older entry belongs to a checkout the
// customer abandoned at the gateway, so it is ignored on read and swept up on
// the next write rather than accumulating in localStorage.
const REDIRECT_TIP_MAX_AGE_MS = 24 * 60 * 60 * 1000;

type StoredRedirectTip = {
  tipAmount: number;
  savedAt: number;
};

/**
 * Entries are keyed per checkout session so a later session started in the same
 * tab cannot overwrite a tip an earlier one is still waiting to confirm.
 */
function keyFor(sessionId: string): string {
  return `${REDIRECT_TIP_KEY_PREFIX}:${sessionId}`;
}

/**
 * The stores the tip is mirrored across.
 *
 * `sessionStorage` is scoped to a single tab, so a gateway that returns the
 * customer to a different one — routine in mobile in-app browsers — cannot see
 * it. `localStorage` survives that. Both are written and either can satisfy a
 * read, so losing the tip takes both being unavailable.
 */
function getStores(): Storage[] {
  if (typeof window === 'undefined') {
    // SSR safety
    return [];
  }

  const stores: Storage[] = [];
  for (const read of [() => window.sessionStorage, () => window.localStorage]) {
    try {
      const store = read();
      if (store) {
        stores.push(store);
      }
    } catch {
      // Touching the property itself throws when storage is blocked outright.
    }
  }

  return stores;
}

/**
 * Drop expired entries, and any this version cannot read, before writing a new
 * one. Keeps abandoned checkouts from accumulating in localStorage, which —
 * unlike sessionStorage — outlives the tab.
 */
function pruneExpired(store: Storage): void {
  const now = Date.now();
  const stale: string[] = [];

  for (let index = 0; index < store.length; index++) {
    const key = store.key(index);
    if (!key?.startsWith(`${REDIRECT_TIP_KEY_PREFIX}:`)) {
      continue;
    }

    try {
      const raw = store.getItem(key);
      const savedAt = raw
        ? (JSON.parse(raw) as Partial<StoredRedirectTip> | null)?.savedAt
        : undefined;
      if (
        typeof savedAt !== 'number' ||
        now - savedAt > REDIRECT_TIP_MAX_AGE_MS
      ) {
        stale.push(key);
      }
    } catch {
      // Unparsable, so it can never be read back either way.
      stale.push(key);
    }
  }

  for (const key of stale) {
    try {
      store.removeItem(key);
    } catch {
      // Storage can become unwritable between the read and the remove.
    }
  }
}

/**
 * Save the tip a gateway redirect was authorized for.
 *
 * Redirect providers (CCAvenue) authorize on one page load and confirm on
 * another: the customer leaves for the gateway and comes back to a fresh
 * document where react-hook-form state no longer exists. The gateway collects
 * the tip-inclusive amount, and `confirmCheckoutSession` records whatever tip
 * the client sends — the API defaults a missing `tipAmount` to `0` rather than
 * inheriting the authorized one. So if this value does not survive the
 * redirect, the order is recorded for less than the customer paid.
 *
 * @returns true when the tip was written somewhere it can be read back. A false
 * return means the tip cannot survive the redirect, so the caller must not send
 * the customer to a gateway that will charge it.
 */
export function setRedirectTipAmount(
  sessionId: string,
  tipAmount: number
): boolean {
  if (!sessionId) {
    return false;
  }

  const key = keyFor(sessionId);
  const payload = JSON.stringify({
    tipAmount,
    savedAt: Date.now(),
  } satisfies StoredRedirectTip);
  let saved = false;

  for (const store of getStores()) {
    try {
      pruneExpired(store);
      store.setItem(key, payload);
      // Read back rather than trusting setItem: with storage blocked, Safari
      // accepts the write and then hands back null, and a quota failure can
      // evict the entry immediately after it is accepted.
      if (store.getItem(key) === payload) {
        saved = true;
      }
    } catch {
      // Storage can be unavailable (private browsing, disabled storage) or full.
    }
  }

  return saved;
}

/**
 * Read the tip saved for `sessionId`.
 *
 * Returns null when nothing was saved for this session, the entry is too old to
 * belong to the redirect in progress, or every store is unreadable.
 */
export function getRedirectTipAmount(sessionId: string): number | null {
  if (!sessionId) {
    return null;
  }

  const key = keyFor(sessionId);

  for (const store of getStores()) {
    try {
      const raw = store.getItem(key);
      if (!raw) {
        continue;
      }

      const stored = JSON.parse(raw) as Partial<StoredRedirectTip> | null;
      if (typeof stored?.tipAmount !== 'number') {
        continue;
      }
      if (
        typeof stored.savedAt !== 'number' ||
        Date.now() - stored.savedAt > REDIRECT_TIP_MAX_AGE_MS
      ) {
        continue;
      }

      return stored.tipAmount;
    } catch {
      // Unreadable or unparsable — try the next store.
    }
  }

  return null;
}

/**
 * Remove the tip saved for `sessionId`.
 */
export function clearRedirectTipAmount(sessionId: string): void {
  if (!sessionId) {
    return;
  }

  for (const store of getStores()) {
    try {
      store.removeItem(keyFor(sessionId));
    } catch {
      // Storage can be unavailable (private browsing, disabled storage).
    }
  }
}
