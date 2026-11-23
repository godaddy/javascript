import { randomUUID } from 'node:crypto';
import {
  type OnceClaim,
  OnceClaimLostError,
  type OnceOutcome,
  type OnceStore,
  checkClaim,
  checkOutcome,
  trimReason,
} from './store';

type Entry =
  | { state: 'claimed'; token: string; leaseUntil: number }
  | { state: 'done' }
  | { state: 'refused'; reason?: string };

export interface MemoryOnceStoreOptions {
  /** Unix milliseconds. Injected so tests control time. */
  now?: () => number;
}

/**
 * A `OnceStore` held in this process's memory. Claims hold only inside one
 * process, are lost on restart, and finished keys are never forgotten, so use
 * it for tests and local runs only. Use the MySQL store in an app.
 */
export function createMemoryOnceStore(
  options: MemoryOnceStoreOptions = {},
): OnceStore {
  const now = options.now ?? Date.now;
  const entries = new Map<string, Entry>();

  return {
    async claim(key: string, leaseMs: number): Promise<OnceClaim> {
      checkClaim(key, leaseMs);
      const at = now();
      const entry = entries.get(key);
      if (entry?.state === 'done') {
        return { status: 'done' };
      }
      if (entry?.state === 'refused') {
        return { status: 'refused', reason: entry.reason };
      }
      // A new key, or a claim whose lease has passed, is claimed.
      if (entry === undefined || entry.leaseUntil < at) {
        const token = randomUUID();
        entries.set(key, { state: 'claimed', token, leaseUntil: at + leaseMs });
        return { status: 'claimed', token };
      }
      return { status: 'in_flight' };
    },

    async complete(
      key: string,
      token: string,
      outcome: OnceOutcome,
    ): Promise<void> {
      checkOutcome(outcome);
      const entry = entries.get(key);
      if (entry?.state !== 'claimed' || entry.token !== token) {
        throw new OnceClaimLostError(key);
      }
      entries.set(
        key,
        outcome.status === 'done'
          ? { state: 'done' }
          : { state: 'refused', reason: trimReason(outcome.reason) },
      );
    },

    async release(key: string, token: string): Promise<void> {
      const entry = entries.get(key);
      if (entry?.state === 'claimed' && entry.token === token) {
        entries.delete(key);
      }
    },
  };
}
