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
 * What a save left for the return leg to find.
 *
 * - `saved`: this tip, and nothing else, can be read back.
 * - `lost`: nothing can be read back, so recovery finds no tip at all.
 * - `shadowed`: a store still holds an earlier attempt's tip, which recovery can
 *   return in place of this one — from a tab this save's `sessionStorage` write
 *   never reached, so a store that took the write does not rule it out.
 */
export type RedirectTipSaveResult = 'saved' | 'lost' | 'shadowed';

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
 * Whether `key` holds exactly `payload` in this store. A store that cannot be
 * read counts as not holding it, which is how the getter treats it too.
 */
function holdsPayload(store: Storage, key: string, payload: string): boolean {
  try {
    return store.getItem(key) === payload;
  } catch {
    return false;
  }
}

/**
 * Drop this session's entry from a store that would not take the new one, and
 * report whether it is gone. What it leaves behind otherwise is an earlier
 * attempt's tip, which the getter would answer with in place of the new one.
 */
function discardEntry(store: Storage, key: string): boolean {
  try {
    store.removeItem(key);
  } catch {
    // Storage can become unwritable between the read and the remove.
  }

  try {
    return store.getItem(key) === null;
  } catch {
    // An entry in a store the getter cannot read is one it never hands back.
    return true;
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
 * @returns what recovery will find. Anything but `saved` means
 * `getRedirectTipAmount` cannot be trusted to return this tip after the redirect;
 * `shadowed` means it can return a different one, which no tip amount makes safe
 * to redirect with.
 */
export function setRedirectTipAmount(
  sessionId: string,
  tipAmount: number
): RedirectTipSaveResult {
  if (!sessionId) {
    return 'lost';
  }

  const key = keyFor(sessionId);
  const payload = JSON.stringify({
    tipAmount,
    savedAt: Date.now(),
  } satisfies StoredRedirectTip);
  let saved = false;
  let shadowed = false;

  for (const store of getStores()) {
    try {
      pruneExpired(store);
      store.setItem(key, payload);
    } catch {
      // Storage can be unavailable (private browsing, disabled storage) or full.
    }

    // Read back rather than trusting setItem: with storage blocked, Safari
    // accepts the write and then hands back null, and a quota failure can evict
    // the entry immediately after it is accepted.
    if (holdsPayload(store, key, payload)) {
      saved = true;
      continue;
    }

    // Every store holding this tip or nothing is what makes the getter's answer
    // this tip, whichever store and tab it reads in.
    if (!discardEntry(store, key)) {
      shadowed = true;
    }
  }

  // Reported ahead of a store that did take the write: the tab the gateway
  // returns to may be one that reads the shadow instead.
  if (shadowed) {
    return 'shadowed';
  }

  return saved ? 'saved' : 'lost';
}

/**
 * Read the tip saved for `sessionId`.
 *
 * The first store holding a usable entry answers. That is the last tip saved only
 * because `setRedirectTipAmount` leaves no other behind: this document was loaded
 * by the gateway and cannot tell two entries apart itself.
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
