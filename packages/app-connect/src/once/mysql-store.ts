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

/**
 * The part of mysql2 the store uses: `query(sql, values)` resolving to
 * mysql2's `[result, fields]` tuple. Pass a `mysql2/promise` Pool. Don't pass
 * a connection the app also uses for transactions: the store's writes must
 * commit on their own, or other instances can't see the claims, and the
 * table's `CREATE TABLE IF NOT EXISTS` would commit the app's open transaction.
 * Rows must come back as objects (the mysql2 default, not `rowsAsArray`).
 * The server must be MySQL 8 or later; the table uses `utf8mb4_0900_bin`,
 * which MariaDB doesn't have. Keep the connection charset utf8mb4 (the mysql2
 * default): with `utf8`/utf8mb3 and a non-strict `sql_mode`, MySQL cuts a key
 * at its first character outside the BMP, and two keys can share a row.
 */
export interface SqlQueryRunner {
  query(sql: string, values?: unknown[]): Promise<unknown>;
}

export interface MysqlOnceStoreOptions {
  /** The table name. Defaults to `app_connect_once`. */
  table?: string;
  /**
   * Create the table on first use with `CREATE TABLE IF NOT EXISTS`. Defaults
   * to true. Turn it off when migrations create it from `onceTableDdl()`. When
   * the database user may not create tables, the store carries on as if a
   * migration had made it.
   */
  createTable?: boolean;
  /**
   * Unix milliseconds. Injected so tests control time. Leases are judged by
   * the caller's clock, so instances' clocks should agree to well inside a lease.
   */
  now?: () => number;
}

export const DEFAULT_ONCE_TABLE = 'app_connect_once';

/** A claim that took longer than this to write has its lease renewed. */
const LEASE_RENEW_AFTER_MS = 1000;

const TABLE_NAME = /^[A-Za-z_][A-Za-z0-9_]{0,63}$/;

function checkTable(table: unknown): string {
  if (typeof table !== 'string' || !TABLE_NAME.test(table)) {
    throw new TypeError(
      `Invalid table name "${String(table)}": use letters, digits and underscores, at most 64 characters`,
    );
  }
  return table;
}

/**
 * The DDL for the once-only table (MySQL 8). The key is compared byte for
 * byte (`utf8mb4_0900_bin`, which also doesn't pad), so keys that differ only
 * in case, accents or trailing spaces stay apart. Rows hold the key, the claim
 * and the outcome, never the work's data. Rows are kept; the `updated_at`
 * index makes pruning old ones cheap. A pruned key can run again, so prune
 * only rows older than the longest time a sender may redeliver or retry the
 * same key. Prune finished rows and claims whose lease has passed, in small
 * batches so claims aren't kept waiting, for example
 * `DELETE FROM app_connect_once WHERE updated_at < ? AND (state <> 'claimed' OR lease_until < ?) LIMIT 1000`.
 * The table is InnoDB with dynamic rows: the claims rely on its row locks, and
 * the 255-character key needs its longer index limit.
 */
export function onceTableDdl(table?: string | null): string {
  // The same default as the store, so a migration and a store given the same
  // config value use the same table.
  return `CREATE TABLE IF NOT EXISTS \`${checkTable(table ?? DEFAULT_ONCE_TABLE)}\` (
  once_key VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_bin NOT NULL PRIMARY KEY,
  state VARCHAR(16) NOT NULL,
  claim_token CHAR(36) NULL,
  lease_until BIGINT NOT NULL,
  reason VARCHAR(255) CHARACTER SET utf8mb4 NULL,
  updated_at BIGINT NOT NULL,
  KEY updated_at (updated_at)
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC`;
}

function errorFields(error: unknown): { code?: unknown; errno?: unknown } {
  return typeof error === 'object' && error !== null
    ? (error as { code?: unknown; errno?: unknown })
    : {};
}

function isDuplicateKey(error: unknown): boolean {
  const { code, errno } = errorFields(error);
  return code === 'ER_DUP_ENTRY' || errno === 1062;
}

/**
 * A deadlock or lock wait on a claim statement: another caller is inserting,
 * releasing or pruning the same rows right now, so the key is busy. A deadlock comes back
 * at once; a lock wait only after the server's `innodb_lock_wait_timeout`.
 */
function isLockConflict(error: unknown): boolean {
  const { code, errno } = errorFields(error);
  return (
    code === 'ER_LOCK_DEADLOCK' ||
    errno === 1213 ||
    code === 'ER_LOCK_WAIT_TIMEOUT' ||
    errno === 1205
  );
}

function isLockWait(error: unknown): boolean {
  const { code, errno } = errorFields(error);
  return code === 'ER_LOCK_WAIT_TIMEOUT' || errno === 1205;
}

function isDeadlock(error: unknown): boolean {
  const { code, errno } = errorFields(error);
  return code === 'ER_LOCK_DEADLOCK' || errno === 1213;
}

/**
 * Runs a statement again when InnoDB picked it as a deadlock victim (with a
 * prune, say). The victim's statement was rolled back, so running it again is
 * safe. A lock wait isn't retried: it has already waited the server's timeout.
 */
async function retryDeadlock<R>(run: () => Promise<R>): Promise<R> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await run();
    } catch (error: unknown) {
      if (attempt >= 3 || !isDeadlock(error)) {
        throw error;
      }
    }
  }
}

/** The database user may not create tables (CREATE command denied). */
function isCreateDenied(error: unknown): boolean {
  const { code, errno } = errorFields(error);
  return code === 'ER_TABLEACCESS_DENIED_ERROR' || errno === 1142;
}

/** The first element of mysql2's `[result, fields]` tuple. */
function resultOf(response: unknown): unknown {
  if (!Array.isArray(response)) {
    throw new TypeError(
      'The SQL runner must resolve to a mysql2 [result, fields] tuple',
    );
  }
  return response[0];
}

function affectedRows(response: unknown): number {
  const result = resultOf(response) as { affectedRows?: unknown } | undefined;
  return typeof result?.affectedRows === 'number' ? result.affectedRows : 0;
}

function insertCounted(response: unknown): boolean {
  if (!Array.isArray(response)) {
    return false;
  }
  return (
    (response[0] as { affectedRows?: unknown } | undefined)?.affectedRows === 1
  );
}

function firstRow(
  response: unknown,
): { state: string; reason?: unknown } | undefined {
  const rows = resultOf(response);
  if (!Array.isArray(rows)) {
    throw new TypeError('The SQL runner must answer a SELECT with rows');
  }
  const row: unknown = rows[0];
  if (row === undefined) {
    return undefined;
  }
  const state = (row as { state?: unknown } | null)?.state;
  if (typeof state !== 'string') {
    // rowsAsArray or nestTables: reading it as in_flight would never end.
    throw new TypeError(
      'The SQL runner must return rows as objects keyed by column name',
    );
  }
  return { state, reason: (row as { reason?: unknown }).reason };
}

/**
 * A `OnceStore` in a MySQL 8 database, shared by every instance of the app.
 *
 * A claim is a conditional insert keyed by the once key, so it holds across
 * processes. A claim that was never completed can be taken over once its
 * lease has passed, so a crash delays the work instead of losing it. Each
 * claim carries a token, so only the caller that holds it can record its
 * outcome or release it.
 */
export function createMysqlOnceStore(
  sql: SqlQueryRunner,
  options: MysqlOnceStoreOptions = {},
): OnceStore {
  const tableName = checkTable(options.table ?? DEFAULT_ONCE_TABLE);
  const table = `\`${tableName}\``;
  const ddl = onceTableDdl(tableName);
  const now = options.now ?? Date.now;
  const createTable = options.createTable ?? true;
  let schemaReady: Promise<void> | null = null;

  function ensureSchema(): Promise<void> {
    if (!createTable) {
      return Promise.resolve();
    }
    if (!schemaReady) {
      schemaReady = (async () => {
        try {
          await sql.query(ddl, []);
        } catch (error: unknown) {
          // A least-privilege user: the table comes from a migration. If it
          // doesn't exist, the first statement on it says so.
          if (!isCreateDenied(error)) {
            throw error;
          }
        }
      })().catch((error: unknown) => {
        // Try again on the next call instead of remembering the failure.
        schemaReady = null;
        throw error;
      });
    }
    return schemaReady;
  }

  /**
   * A statement that waited on a lock (behind a prune, say) used up part of the
   * lease it wrote. Renew the lease from now, so the caller gets all of it, or
   * answer in_flight if another caller took the key over in the meantime.
   */
  async function withFullLease(
    key: string,
    token: string,
    at: number,
    leaseMs: number,
  ): Promise<OnceClaim> {
    const after = now();
    // Renew once the wait used a real share of the lease, short leases included.
    if (after - at < Math.min(LEASE_RENEW_AFTER_MS, leaseMs / 4)) {
      return { status: 'claimed', token };
    }
    let renewed: unknown;
    try {
      renewed = await retryDeadlock(() =>
        sql.query(
          `UPDATE ${table} SET lease_until = ?, updated_at = ?
            WHERE once_key = ? AND state = 'claimed' AND claim_token = ?`,
          [after + leaseMs, after, key, token],
        ),
      );
    } catch (error: unknown) {
      // Don't leave the key held under a token nobody will use: give it back,
      // so a retry can claim it, then report the failure (a lock conflict
      // reads as in_flight). After a lock wait the row is still locked, so a
      // DELETE would only wait out the timeout again; the key then stays held
      // until its lease passes.
      // If the DELETE fails too, the key is held until its lease passes.
      if (!isLockWait(error)) {
        await retryDeadlock(() =>
          sql.query(
            `DELETE FROM ${table} WHERE once_key = ? AND state = 'claimed' AND claim_token = ?`,
            [key, token],
          ),
        ).catch(() => undefined);
      }
      throw error;
    }
    return affectedRows(renewed) === 1
      ? { status: 'claimed', token }
      : { status: 'in_flight' };
  }

  /** One claim attempt; null when the key's row vanished mid-attempt. */
  async function tryClaim(
    key: string,
    leaseMs: number,
  ): Promise<OnceClaim | null> {
    const at = now();
    const token = randomUUID();
    let inserted = false;
    try {
      const response = await sql.query(
        `INSERT INTO ${table} (once_key, state, claim_token, lease_until, updated_at) VALUES (?, 'claimed', ?, ?, ?)`,
        [key, token, at + leaseMs, at],
      );
      if (!insertCounted(response)) {
        // Checked before the work runs, not after it in complete(). Take back
        // the row it may have written, so the key isn't held by nobody.
        await sql
          .query(
            `DELETE FROM ${table} WHERE once_key = ? AND claim_token = ?`,
            [key, token],
          )
          .catch(() => undefined);
        throw new TypeError(
          'The SQL runner must resolve to a mysql2 [result, fields] tuple with affectedRows',
        );
      }
      inserted = true;
    } catch (error: unknown) {
      if (!isDuplicateKey(error)) {
        throw error;
      }
    }
    if (inserted) {
      return withFullLease(key, token, at, leaseMs);
    }
    // The key is known. Take it over only if its earlier claim has expired.
    const takeover = await sql.query(
      `UPDATE ${table} SET claim_token = ?, lease_until = ?, updated_at = ?
        WHERE once_key = ? AND state = 'claimed' AND lease_until < ?`,
      [token, at + leaseMs, at, key, at],
    );
    if (affectedRows(takeover) === 1) {
      return withFullLease(key, token, at, leaseMs);
    }
    const row = firstRow(
      await sql.query(`SELECT state, reason FROM ${table} WHERE once_key = ?`, [
        key,
      ]),
    );
    if (row?.state === 'done') {
      return { status: 'done' };
    }
    if (row?.state === 'refused') {
      return {
        status: 'refused',
        reason: typeof row.reason === 'string' ? row.reason : undefined,
      };
    }
    // Held by another caller, or (no row) released between the statements, so
    // the key is free: the caller tries the insert once more.
    return row === undefined ? null : { status: 'in_flight' };
  }

  return {
    async claim(key: string, leaseMs: number): Promise<OnceClaim> {
      checkClaim(key, leaseMs);
      await ensureSchema();
      try {
        // A deadlock victim was rolled back, so the whole claim runs again.
        const first = await retryDeadlock(() => tryClaim(key, leaseMs));
        return (
          first ??
          (await retryDeadlock(() => tryClaim(key, leaseMs))) ?? {
            status: 'in_flight',
          }
        );
      } catch (error: unknown) {
        // A lock wait, or a deadlock that keeps coming back, on any of the
        // claim's statements (with a release, a takeover or a prune of the
        // same rows) means the key is busy.
        if (isLockConflict(error)) {
          return { status: 'in_flight' };
        }
        throw error;
      }
    },

    async complete(
      key: string,
      token: string,
      outcome: OnceOutcome,
    ): Promise<void> {
      checkOutcome(outcome);
      await ensureSchema();
      const reason =
        outcome.status === 'refused'
          ? (trimReason(outcome.reason) ?? null)
          : null;
      const result = await retryDeadlock(() =>
        sql.query(
          `UPDATE ${table} SET state = ?, reason = ?, claim_token = NULL, updated_at = ?
            WHERE once_key = ? AND state = 'claimed' AND claim_token = ?`,
          [outcome.status, reason, now(), key, token],
        ),
      );
      if (affectedRows(result) !== 1) {
        throw new OnceClaimLostError(key);
      }
    },

    async release(key: string, token: string): Promise<void> {
      await ensureSchema();
      await retryDeadlock(() =>
        sql.query(
          `DELETE FROM ${table} WHERE once_key = ? AND state = 'claimed' AND claim_token = ?`,
          [key, token],
        ),
      );
    },
  };
}
