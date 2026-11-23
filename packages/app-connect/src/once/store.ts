/**
 * What a store says about a key when a caller tries to claim it.
 * - `claimed`: this caller now holds the key until it completes or releases it,
 *   or until the lease passes.
 * - `done` / `refused`: the work for the key already finished with that outcome.
 * - `in_flight`: another caller holds an unexpired claim.
 */
export type OnceClaim =
  | { status: 'claimed'; token: string }
  | { status: 'done' }
  | { status: 'refused'; reason?: string }
  | { status: 'in_flight' };

/** The final outcome recorded for a key. */
export type OnceOutcome =
  | { status: 'done' }
  | { status: 'refused'; reason?: string };

/**
 * Where `once` keeps its claims. Every adapter has the same semantics:
 * - `claim` is atomic across every process that shares the store. A new key is
 *   claimed. A claimed key whose lease has passed is taken over, so a crash
 *   delays the work instead of losing it. Any other claimed key is `in_flight`.
 * - `complete` records the outcome for good, and only for the caller holding
 *   the claim (`token`). It throws when that caller no longer holds it.
 * - `release` forgets the caller's claim, so a retry can run the work again.
 *   It does nothing when that caller no longer holds the claim.
 */
export interface OnceStore {
  claim(key: string, leaseMs: number): Promise<OnceClaim>;
  complete(key: string, token: string, outcome: OnceOutcome): Promise<void>;
  release(key: string, token: string): Promise<void>;
}

/**
 * Thrown by a store's `complete` when the caller no longer holds the claim,
 * for example because its lease passed and another caller took the key over.
 */
export class OnceClaimLostError extends Error {
  readonly key: string;

  constructor(key: string) {
    // The key is on `.key`, not in the message, in case it names a shopper.
    super('The claim is no longer held, so its outcome was not recorded');
    this.name = 'OnceClaimLostError';
    this.key = key;
  }
}

/** A lone surrogate: a string that is not well-formed UTF-16. */
const LONE_SURROGATE =
  /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
const LONE_SURROGATES = new RegExp(LONE_SURROGATE.source, 'g');

/**
 * True when the string encodes to UTF-8 unchanged. A lone surrogate becomes
 * U+FFFD on the way to a database, so two different strings could collide.
 */
export function isWellFormed(value: string): boolean {
  return !LONE_SURROGATE.test(value);
}

/** The longest key a store accepts, in characters. */
export const MAX_KEY_LENGTH = 255;

/** The longest refusal reason a store keeps, in characters; longer reasons are cut. */
export const MAX_REASON_LENGTH = 255;

/**
 * Checks a key and lease before a claim. `once` calls it, and so do the
 * built-in stores' `claim`, so one called directly can't be left with a key
 * that never frees up or a key the database would cut short. A custom store
 * called only through `once` gets the same checks.
 */
export function checkClaim(key: string, leaseMs: number): void {
  if (typeof key !== 'string' || key.length === 0) {
    throw new TypeError('once: the key must be a non-empty string');
  }
  if (!isWellFormed(key)) {
    throw new TypeError(
      'once: the key must be well-formed text (no lone surrogates)',
    );
  }
  if (Array.from(key).length > MAX_KEY_LENGTH) {
    throw new TypeError(
      `once: the key must be at most ${MAX_KEY_LENGTH} characters; derive a shorter one with deriveId`,
    );
  }
  if (!Number.isSafeInteger(leaseMs) || leaseMs <= 0) {
    throw new TypeError('once: leaseMs must be a positive whole number');
  }
}

/**
 * Checks an outcome before a store records it, so untyped code can't write a
 * state that no later claim understands.
 */
export function checkOutcome(outcome: OnceOutcome): void {
  const status = (outcome as { status?: unknown } | null)?.status;
  if (status !== 'done' && status !== 'refused') {
    throw new TypeError(
      `once: an outcome must be done or refused, not "${String(status)}"`,
    );
  }
}

export function trimReason(reason: string | undefined): string | undefined {
  if (reason === undefined) {
    return undefined;
  }
  // Lone surrogates become U+FFFD, as they would on the way to a database, so
  // every store reads the same reason back. Then cut by code point, so a
  // character outside the BMP is never split.
  const wellFormed = reason.replace(LONE_SURROGATES, '\u{FFFD}');
  const characters = Array.from(wellFormed);
  return characters.length > MAX_REASON_LENGTH
    ? characters.slice(0, MAX_REASON_LENGTH).join('')
    : wellFormed;
}
