import {
  type OnceOutcome,
  type OnceStore,
  checkClaim,
  trimReason,
} from './store';

const REFUSED = Symbol.for('@godaddy/app-connect/once/refused');

/**
 * Throw from the work passed to `once` when the work was refused for good, for
 * example a vendor answered 422 for this exact input. The refusal is recorded,
 * so a retry of the same key is not run again.
 *
 * The reason is stored, so keep it a short code (`invalid_email`), never
 * vendor text or shopper data. It is cut to 255 characters.
 */
export class Refused extends Error {
  readonly reason: string;
  readonly [REFUSED] = true;

  constructor(reason: string, options?: { cause?: unknown }) {
    super(reason, options);
    this.name = 'Refused';
    this.reason = reason;
  }
}

/** A branded error from elsewhere may carry a reason that isn't a string. */
function reasonText(error: { reason?: unknown }): string {
  try {
    const reason = error.reason;
    return typeof reason === 'string' ? reason : String(reason ?? '');
  } catch {
    // A reason getter that throws, or an object with no usable toString:
    // still record the refusal.
    return '';
  }
}

function isRefused(error: unknown): error is Refused {
  // A brand, not only instanceof, so a second copy of this package still matches.
  try {
    return (
      error instanceof Refused ||
      (typeof error === 'object' &&
        error !== null &&
        (error as { [REFUSED]?: unknown })[REFUSED] === true)
    );
  } catch {
    // A revoked Proxy or a throwing getter: not a refusal, so the claim is
    // still released and the work's own error rethrown.
    return false;
  }
}

/**
 * Thrown by `once` when the work finished but its outcome could not be
 * recorded. Answer the delivery as failed, so it is retried. What the retry
 * finds depends on the cause:
 * - the store failed: the key stays claimed until its lease passes, then the
 *   work runs again;
 * - the claim was lost (`cause` is `OnceClaimLostError`): the lease passed and
 *   another caller took the key over, so it may already be done or running.
 *
 * `value` is what the work returned, when it finished without `Refused`. It
 * may hold vendor or shopper data, so it isn't enumerable: loggers that
 * serialize errors leave it out.
 */
export class OnceNotRecordedError extends Error {
  readonly key: string;
  readonly outcome: OnceOutcome;
  declare readonly value: unknown;

  constructor(
    key: string,
    outcome: OnceOutcome,
    cause: unknown,
    value?: unknown,
  ) {
    super(
      // The key is on `.key`, not in the message, in case it names a shopper.
      `The work finished (${outcome.status}) but its outcome was not recorded`,
      { cause },
    );
    this.name = 'OnceNotRecordedError';
    this.key = key;
    this.outcome = outcome;
    Object.defineProperty(this, 'value', { value, enumerable: false });
  }
}

/** What `once` did with the key. */
export type OnceResult<T = unknown> =
  /** The work ran now and finished. */
  | { status: 'done'; value: T }
  /** The work already finished earlier with this outcome, so it did not run. */
  | {
      status: 'duplicate';
      outcome: { status: 'done' } | { status: 'refused'; reason: string };
    }
  /** Another caller is running the work now, so it did not run. Retry later. */
  | { status: 'in_flight' }
  /** The work ran now and threw `Refused`; the refusal is recorded. */
  | { status: 'refused'; reason: string };

export interface OnceOptions {
  /**
   * How long a claim keeps the key from other callers, in milliseconds. Make
   * it longer than the work can take: once it passes, another caller may take
   * the key over and run the work again. Defaults to 5 minutes.
   */
  leaseMs?: number;
  /**
   * Called when the work threw and releasing its claim then failed too. The
   * work's error is still the one thrown; until the lease passes, retries of
   * the key answer `in_flight`. Pass your logger here to see why, wrapped so
   * it keeps its `this`: `(err, key) => logger.error({ err, key }, 'release failed')`.
   * An error from the callback itself is dropped.
   */
  onReleaseError?: (error: unknown, key: string) => void | Promise<void>;
}

export const DEFAULT_LEASE_MS = 5 * 60 * 1000;

/**
 * Records one outcome for `key` across every process that shares `store`, and
 * runs `fn` for it one caller at a time. Once an outcome is recorded, `fn` is
 * not run for that key again.
 *
 * - The key is claimed first. A key that already finished returns `duplicate`
 *   with its recorded outcome; a key another caller holds returns `in_flight`.
 * - When `fn` returns, the key is recorded as done and `done` is returned.
 * - When `fn` throws `Refused`, the refusal is recorded and `refused` is
 *   returned, so the same key is never tried again.
 * - When `fn` throws anything else, the claim is released and the error is
 *   rethrown, so a retry can run the work again.
 *
 * A claim whose lease passes (the process crashed, or the work ran long) is
 * taken over by the next caller, so `fn` can run more than once in that case:
 * make it safe to repeat, for example by sending a stable idempotency key built
 * with `deriveId`.
 *
 * @throws TypeError for a bad key or lease, or a store answering a claim
 *   status it doesn't know (before `fn` runs)
 * @throws whatever `store.claim` throws, such as a lost database connection
 *   (before `fn` runs)
 * @throws whatever `fn` throws other than `Refused`, after releasing the claim
 * @throws OnceNotRecordedError when `fn` finished but the outcome could not be recorded
 *
 * After any of these, this caller didn't record an outcome: answer the
 * delivery as failed so it's retried. The key may still be done, though: when
 * `OnceNotRecordedError`'s cause is `OnceClaimLostError`, another caller took
 * it over, and a lost database response can hide a write that committed. The
 * retry's `once` call tells you which.
 */
export async function once<T>(
  store: OnceStore,
  key: string,
  fn: () => Promise<T> | T,
  options: OnceOptions = {},
): Promise<OnceResult<T>> {
  const leaseMs = options.leaseMs ?? DEFAULT_LEASE_MS;
  checkClaim(key, leaseMs);

  const claim = await store.claim(key, leaseMs);
  if (claim.status === 'in_flight') {
    return { status: 'in_flight' };
  }
  if (claim.status === 'done') {
    return { status: 'duplicate', outcome: { status: 'done' } };
  }
  if (claim.status === 'refused') {
    return {
      status: 'duplicate',
      // The same shape as a fresh refusal: always a string.
      outcome: { status: 'refused', reason: claim.reason ?? '' },
    };
  }
  if (claim.status !== 'claimed' || typeof claim.token !== 'string') {
    // A custom store answering something else: never run the work on it.
    throw new TypeError(
      `once: the store answered an unknown claim status "${String((claim as { status?: unknown }).status)}"`,
    );
  }

  const record = async (
    outcome: OnceOutcome,
    value?: unknown,
  ): Promise<void> => {
    try {
      await store.complete(key, claim.token, outcome);
    } catch (error: unknown) {
      throw new OnceNotRecordedError(key, outcome, error, value);
    }
  };

  let value: T;
  try {
    value = await fn();
  } catch (error: unknown) {
    if (isRefused(error)) {
      // A branded error from elsewhere may carry a reason that isn't a string.
      const reason = trimReason(reasonText(error)) ?? '';
      await record({ status: 'refused', reason });
      return { status: 'refused', reason };
    }
    try {
      await store.release(key, claim.token);
    } catch (releaseError: unknown) {
      // The claim expires after its lease, so the work is retried even when
      // the release fails. The work's own error is the one worth throwing.
      // A failing callback, sync or async, must not hide the work's error.
      try {
        const reported: unknown = options.onReleaseError?.(releaseError, key);
        if (
          typeof (reported as { catch?: unknown } | undefined)?.catch ===
          'function'
        ) {
          (reported as Promise<unknown>).catch(() => undefined);
        }
      } catch {
        // Ignored, as above.
      }
    }
    throw error;
  }

  await record({ status: 'done' }, value);
  return { status: 'done', value };
}
