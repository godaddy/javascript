import { describe, expect, it } from 'vitest';
import {
  type SqlQueryRunner,
  createMysqlOnceStore,
  onceTableDdl,
} from './mysql-store';
import { onceStoreContract } from './store-contract.test-helper';

type Row = {
  state: string;
  claim_token: string | null;
  lease_until: number;
  reason: string | null;
};

/**
 * Runs the store's statements against an in-memory table with MySQL's
 * semantics for the cases the store depends on: a duplicate primary key fails
 * with ER_DUP_ENTRY, UPDATE and DELETE report how many rows matched, and every
 * answer is mysql2's [result, fields] tuple. The real database is covered by
 * mysql-store.mysql.test.ts.
 */
function fakeMysql(table = 'app_connect_once') {
  const rows = new Map<string, Row>();
  const statements: string[] = [];
  const header = (affectedRows: number) => [{ affectedRows }, undefined];
  const runner: SqlQueryRunner = {
    async query(sql: string, values: unknown[] = []) {
      const text = sql.replace(/\s+/g, ' ').replace(/`/g, '').trim();
      statements.push(text);
      if (text.startsWith(`CREATE TABLE IF NOT EXISTS ${table} `)) {
        return header(0);
      }
      if (text.startsWith(`INSERT INTO ${table} `)) {
        const [key, token, leaseUntil] = values as [string, string, number];
        if (rows.has(key)) {
          throw Object.assign(new Error('Duplicate entry'), {
            code: 'ER_DUP_ENTRY',
            errno: 1062,
          });
        }
        rows.set(key, {
          state: 'claimed',
          claim_token: token,
          lease_until: leaseUntil,
          reason: null,
        });
        return header(1);
      }
      if (text.startsWith(`UPDATE ${table} SET claim_token`)) {
        const [token, leaseUntil, , key, at] = values as [
          string,
          number,
          number,
          string,
          number,
        ];
        const row = rows.get(key);
        if (!row || row.state !== 'claimed' || row.lease_until >= at) {
          return header(0);
        }
        Object.assign(row, { claim_token: token, lease_until: leaseUntil });
        return header(1);
      }
      if (text.startsWith(`UPDATE ${table} SET lease_until`)) {
        const [leaseUntil, , key, token] = values as [
          number,
          number,
          string,
          string,
        ];
        const row = rows.get(key);
        if (!row || row.state !== 'claimed' || row.claim_token !== token) {
          return header(0);
        }
        row.lease_until = leaseUntil;
        return header(1);
      }
      if (text.startsWith(`UPDATE ${table} SET state`)) {
        const [state, reason, , key, token] = values as [
          string,
          string | null,
          number,
          string,
          string,
        ];
        const row = rows.get(key);
        if (!row || row.state !== 'claimed' || row.claim_token !== token) {
          return header(0);
        }
        Object.assign(row, { state, reason, claim_token: null });
        return header(1);
      }
      if (text.startsWith('SELECT state, reason')) {
        const row = rows.get(values[0] as string);
        return [row ? [{ state: row.state, reason: row.reason }] : [], []];
      }
      if (text.startsWith(`DELETE FROM ${table} `)) {
        const [key, token] = values as [string, string];
        const row = rows.get(key);
        if (row?.state === 'claimed' && row.claim_token === token) {
          rows.delete(key);
          return header(1);
        }
        return header(0);
      }
      throw new Error(`unexpected statement: ${text}`);
    },
  };
  return { runner, rows, statements };
}

describe('MySQL once store (statement fake)', () => {
  onceStoreContract((now) => createMysqlOnceStore(fakeMysql().runner, { now }));

  it('creates its table once, and again after a failure', async () => {
    const db = fakeMysql();
    let failures = 1;
    const flaky: SqlQueryRunner = {
      async query(sql, values) {
        if (sql.startsWith('CREATE TABLE') && failures > 0) {
          failures -= 1;
          throw new Error('connection reset');
        }
        return db.runner.query(sql, values);
      },
    };
    const store = createMysqlOnceStore(flaky);
    await expect(store.claim('a', 1_000)).rejects.toThrow('connection reset');
    await store.claim('a', 1_000);
    await store.claim('b', 1_000);
    expect(
      db.statements.filter((statement) => statement.startsWith('CREATE TABLE')),
    ).toHaveLength(1);
  });

  it('leaves the table to migrations when createTable is false', async () => {
    const db = fakeMysql('gpa_once');
    const store = createMysqlOnceStore(db.runner, {
      table: 'gpa_once',
      createTable: false,
    });
    await store.claim('a', 1_000);
    expect(
      db.statements.some((statement) => statement.startsWith('CREATE TABLE')),
    ).toBe(false);
    expect(db.rows.has('a')).toBe(true);
  });

  it('rethrows an insert error that is not a duplicate key or lock conflict', async () => {
    const store = createMysqlOnceStore({
      async query(sql) {
        if (sql.startsWith('INSERT')) throw new Error('connection reset');
        return [{ affectedRows: 0 }, undefined];
      },
    });
    await expect(store.claim('a', 1_000)).rejects.toThrow('connection reset');
  });

  it('refuses a runner that does not answer like mysql2', async () => {
    const store = createMysqlOnceStore(
      { query: async () => ({ affectedRows: 1 }) },
      { createTable: false },
    );
    // Before the work runs, at the claim.
    await expect(store.claim('a', 1_000)).rejects.toThrow('[result, fields]');
    const statements: string[] = [];
    const noCount = createMysqlOnceStore(
      {
        async query(sql) {
          statements.push(sql);
          return [{}, undefined];
        },
      },
      { createTable: false },
    );
    await expect(noCount.claim('a', 1_000)).rejects.toThrow('affectedRows');
    // The row the insert may have written is taken back.
    expect(statements.at(-1)).toMatch(/^DELETE FROM/);
  });

  it('runs complete and release again when picked as a deadlock victim', async () => {
    const db = fakeMysql();
    let deadlocks = 0;
    const store = createMysqlOnceStore({
      async query(sql, values) {
        if (/^(UPDATE \S+ SET state|DELETE)/.test(sql) && deadlocks % 2 === 0) {
          deadlocks += 1;
          throw Object.assign(new Error('deadlock'), { errno: 1213 });
        }
        if (/^(UPDATE \S+ SET state|DELETE)/.test(sql)) deadlocks += 1;
        return db.runner.query(sql, values);
      },
    });
    const first = await store.claim('a', 60_000);
    if (first.status !== 'claimed') throw new Error('not claimed');
    await store.complete('a', first.token, { status: 'done' });
    expect(await store.claim('a', 60_000)).toEqual({ status: 'done' });
    const second = await store.claim('b', 60_000);
    if (second.status !== 'claimed') throw new Error('not claimed');
    await store.release('b', second.token);
    expect((await store.claim('b', 60_000)).status).toBe('claimed');
    expect(deadlocks).toBe(4);
  });

  it('renews the lease when the claim waited on a lock', async () => {
    const db = fakeMysql();
    const clock = { now: 1_000 };
    const store = createMysqlOnceStore(
      {
        async query(sql, values) {
          const result = await db.runner.query(sql, values);
          // The insert waited 40s behind a prune.
          if (sql.startsWith('INSERT')) clock.now += 40_000;
          return result;
        },
      },
      { now: () => clock.now },
    );
    const claim = await store.claim('a', 30_000);
    expect(claim.status).toBe('claimed');
    expect(db.rows.get('a')?.lease_until).toBe(41_000 + 30_000);
  });

  it('answers in_flight when the key was taken over while the claim waited', async () => {
    const db = fakeMysql();
    const store = createMysqlOnceStore(
      {
        async query(sql, values) {
          const result = await db.runner.query(sql, values);
          if (sql.startsWith('INSERT')) {
            const row = db.rows.get('a');
            if (row) row.claim_token = 'someone-else';
          }
          return result;
        },
      },
      {
        now: (() => {
          let calls = 0;
          return () => (calls++ === 0 ? 1_000 : 50_000);
        })(),
      },
    );
    expect(await store.claim('a', 30_000)).toEqual({ status: 'in_flight' });
  });

  it('gives the key back when renewing the lease fails', async () => {
    const db = fakeMysql();
    const clock = { now: 1_000 };
    const store = createMysqlOnceStore(
      {
        async query(sql, values) {
          if (sql.startsWith('UPDATE') && sql.includes('SET lease_until')) {
            throw Object.assign(new Error('deadlock'), { errno: 1213 });
          }
          const result = await db.runner.query(sql, values);
          if (sql.startsWith('INSERT')) clock.now += 40_000;
          return result;
        },
      },
      { now: () => clock.now },
    );
    expect(await store.claim('a', 30_000)).toEqual({ status: 'in_flight' });
    // Not held by a token nobody uses: the next claim gets it.
    expect(db.rows.has('a')).toBe(false);
  });

  it('renews a short lease after a wait that used a real share of it', async () => {
    const db = fakeMysql();
    const clock = { now: 1_000 };
    const store = createMysqlOnceStore(
      {
        async query(sql, values) {
          const result = await db.runner.query(sql, values);
          if (sql.startsWith('INSERT')) clock.now += 900;
          return result;
        },
      },
      { now: () => clock.now },
    );
    expect((await store.claim('a', 1_500)).status).toBe('claimed');
    expect(db.rows.get('a')?.lease_until).toBe(1_900 + 1_500);
  });

  it('claims a key released between its insert and its takeover', async () => {
    const db = fakeMysql();
    db.rows.set('a', {
      state: 'claimed',
      claim_token: 'holder',
      lease_until: Number.MAX_SAFE_INTEGER,
      reason: null,
    });
    let inserts = 0;
    const claim = createMysqlOnceStore(
      {
        async query(sql, values) {
          if (sql.startsWith('INSERT')) inserts += 1;
          try {
            return await db.runner.query(sql, values);
          } finally {
            // The holder releases right after this caller's insert collided.
            if (sql.startsWith('INSERT') && inserts === 1) db.rows.delete('a');
          }
        },
      },
      { createTable: false },
    ).claim('a', 60_000);
    await expect(claim).resolves.toMatchObject({ status: 'claimed' });
    expect(inserts).toBe(2);
  });

  it('runs the claim again when its insert is a deadlock victim', async () => {
    const db = fakeMysql();
    let deadlocks = 1;
    const store = createMysqlOnceStore(
      {
        async query(sql, values) {
          if (sql.startsWith('INSERT') && deadlocks > 0) {
            deadlocks -= 1;
            throw Object.assign(new Error('deadlock'), { errno: 1213 });
          }
          return db.runner.query(sql, values);
        },
      },
      { createTable: false },
    );
    expect((await store.claim('a', 60_000)).status).toBe('claimed');
  });

  it('leaves the row alone after a lock wait on the renewal', async () => {
    const db = fakeMysql();
    const clock = { now: 1_000 };
    const statements: string[] = [];
    const store = createMysqlOnceStore(
      {
        async query(sql, values) {
          statements.push(sql);
          if (sql.includes('SET lease_until')) {
            throw Object.assign(new Error('lock wait'), { errno: 1205 });
          }
          const result = await db.runner.query(sql, values);
          if (sql.startsWith('INSERT')) clock.now += 40_000;
          return result;
        },
      },
      { now: () => clock.now, createTable: false },
    );
    expect(await store.claim('a', 30_000)).toEqual({ status: 'in_flight' });
    expect(statements.some((sql) => sql.startsWith('DELETE'))).toBe(false);
  });

  it('gives up on a deadlock that keeps coming back', async () => {
    let attempts = 0;
    const store = createMysqlOnceStore(
      {
        async query() {
          attempts += 1;
          throw Object.assign(new Error('deadlock'), { errno: 1213 });
        },
      },
      { createTable: false },
    );
    await expect(
      store.complete('a', 'token', { status: 'done' }),
    ).rejects.toThrow('deadlock');
    expect(attempts).toBe(3);
  });

  it('answers in_flight when the takeover or the read hits a lock conflict', async () => {
    for (const failing of ['UPDATE', 'SELECT']) {
      const store = createMysqlOnceStore(
        {
          async query(sql) {
            if (sql.startsWith('INSERT')) {
              throw Object.assign(new Error('dup'), { errno: 1062 });
            }
            if (sql.startsWith(failing)) {
              throw Object.assign(new Error('deadlock'), {
                code: 'ER_LOCK_DEADLOCK',
              });
            }
            return [{ affectedRows: 0 }, undefined];
          },
        },
        { createTable: false },
      );
      expect(await store.claim('a', 1_000)).toEqual({ status: 'in_flight' });
    }
  });

  it('answers in_flight when the claim insert hits a lock conflict', async () => {
    for (const errno of [1213, 1205]) {
      const store = createMysqlOnceStore(
        {
          async query(sql) {
            if (sql.startsWith('INSERT')) {
              throw Object.assign(new Error('lock'), { errno });
            }
            return [{ affectedRows: 0 }, undefined];
          },
        },
        { createTable: false },
      );
      expect(await store.claim('a', 1_000)).toEqual({ status: 'in_flight' });
    }
  });

  it('carries on when the database user may not create tables', async () => {
    const db = fakeMysql();
    let creates = 0;
    const store = createMysqlOnceStore({
      async query(sql, values) {
        if (sql.startsWith('CREATE TABLE')) {
          creates += 1;
          throw Object.assign(new Error('CREATE command denied'), {
            code: 'ER_TABLEACCESS_DENIED_ERROR',
            errno: 1142,
          });
        }
        return db.runner.query(sql, values);
      },
    });
    expect((await store.claim('a', 1_000)).status).toBe('claimed');
    expect((await store.claim('b', 1_000)).status).toBe('claimed');
    expect(creates).toBe(1);
  });

  it('refuses rows that are not objects keyed by column name', async () => {
    const store = createMysqlOnceStore(
      {
        async query(sql) {
          if (sql.startsWith('INSERT')) {
            throw Object.assign(new Error('dup'), { errno: 1062 });
          }
          if (sql.startsWith('SELECT')) return [[['done', null]], []];
          return [{ affectedRows: 0 }, undefined];
        },
      },
      { createTable: false },
    );
    await expect(store.claim('a', 1_000)).rejects.toThrow('objects');
  });

  it('quotes the table name, so a reserved word works', () => {
    expect(onceTableDdl('order')).toContain(
      'CREATE TABLE IF NOT EXISTS `order` (',
    );
  });
  it('refuses a table name that is not a plain identifier', () => {
    for (const table of ['', 'once; DROP TABLE x', 'a-b', 'x'.repeat(65)]) {
      expect(() => createMysqlOnceStore(fakeMysql().runner, { table })).toThrow(
        TypeError,
      );
      expect(() => onceTableDdl(table)).toThrow(TypeError);
    }
    // null means the default table, for the DDL as for the store.
    expect(onceTableDdl(null)).toContain('`app_connect_once`');
    expect(() => onceTableDdl(42 as unknown as string)).toThrow(TypeError);
  });

  it('ships DDL that compares keys byte for byte', () => {
    const ddl = onceTableDdl();
    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS `app_connect_once`');
    expect(ddl).toContain(
      'once_key VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_bin NOT NULL PRIMARY KEY',
    );
  });
});
