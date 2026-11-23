import { randomBytes } from 'node:crypto';
import { type Pool, createPool } from 'mysql2/promise';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createMysqlOnceStore, onceTableDdl } from './mysql-store';
import { once } from './once';
import { onceStoreContract } from './store-contract.test-helper';

/**
 * Runs against a real MySQL 8.4 server, only when APP_CONNECT_TEST_MYSQL_URL
 * is set, for example:
 *
 *   docker run --rm -d --cpus=2 -p 3307:3306 -e MYSQL_ROOT_PASSWORD=test \
 *     -e MYSQL_DATABASE=once_test mysql:8.4
 *   APP_CONNECT_TEST_MYSQL_URL=mysql://root:test@127.0.0.1:3307/once_test pnpm test
 *
 * Each run uses its own tables and drops them afterwards, except the
 * reserved-word test, which needs the fixed name `order`: it skips when that
 * table exists, so point the URL at a scratch database no other run is using.
 */
const url = process.env.APP_CONNECT_TEST_MYSQL_URL;

describe.runIf(Boolean(url))('MySQL once store (MySQL 8.4)', () => {
  let pool: Pool;
  const tables: string[] = [];
  const prefix = `once_${randomBytes(4).toString('hex')}`;

  function nextTable(): string {
    const table = `${prefix}_${tables.length}`;
    tables.push(table);
    return table;
  }

  beforeAll(() => {
    pool = createPool({ uri: url, connectionLimit: 8 });
  });

  afterAll(async () => {
    for (const table of tables) {
      await pool.query(`DROP TABLE IF EXISTS \`${table}\``);
    }
    await pool.end();
  });

  onceStoreContract((now) =>
    createMysqlOnceStore(pool, { table: nextTable(), now }),
  );

  it('lets exactly one of many concurrent callers claim a key', async () => {
    const store = createMysqlOnceStore(pool, { table: nextTable() });
    await store.claim('warm-up', 60_000);
    const claims = await Promise.all(
      Array.from({ length: 12 }, () => store.claim('evt_race', 60_000)),
    );
    expect(claims.filter((claim) => claim.status === 'claimed')).toHaveLength(
      1,
    );
    expect(claims.filter((claim) => claim.status === 'in_flight')).toHaveLength(
      11,
    );
  });

  it('runs the work once across stores sharing a table', async () => {
    const table = nextTable();
    const first = createMysqlOnceStore(pool, { table });
    const second = createMysqlOnceStore(pool, { table });
    let runs = 0;
    const work = async () => {
      runs += 1;
      return 'sent';
    };
    expect(await once(first, 'evt_1', work)).toEqual({
      status: 'done',
      value: 'sent',
    });
    expect(await once(second, 'evt_1', work)).toEqual({
      status: 'duplicate',
      outcome: { status: 'done' },
    });
    expect(runs).toBe(1);
  });

  it('works on a table created from the shipped DDL by a migration', async () => {
    const table = nextTable();
    await pool.query(onceTableDdl(table));
    const store = createMysqlOnceStore(pool, { table, createTable: false });
    expect((await store.claim('evt_1', 60_000)).status).toBe('claimed');
  });

  it('keeps a key of 255 characters outside the BMP', async () => {
    const store = createMysqlOnceStore(pool, { table: nextTable() });
    const key = '😀'.repeat(255);
    expect((await store.claim(key, 60_000)).status).toBe('claimed');
    expect(await store.claim(key, 60_000)).toEqual({ status: 'in_flight' });
  });

  it('quotes a table name that is a reserved word', async (context) => {
    const table = 'order';
    // Never touch an `order` table this run didn't create.
    const [existing] = await pool.query(
      'SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?',
      [table],
    );
    if (Number((existing as Array<{ n: unknown }>)[0]?.n) > 0) {
      context.skip();
    }
    tables.push(table);
    const store = createMysqlOnceStore(pool, { table });
    expect((await store.claim('evt_1', 60_000)).status).toBe('claimed');
  });

  it('never throws when claims race a release of the same key', async () => {
    const store = createMysqlOnceStore(pool, { table: nextTable() });
    for (let round = 0; round < 5; round += 1) {
      const key = `evt_release_${round}`;
      const first = await store.claim(key, 60_000);
      if (first.status !== 'claimed') throw new Error('not claimed');
      const results = await Promise.all([
        store.release(key, first.token).then(() => 'released'),
        ...Array.from({ length: 6 }, () =>
          store.claim(key, 60_000).then((claim) => claim.status),
        ),
      ]);
      const claimed = results.filter((status) => status === 'claimed');
      expect(claimed.length).toBeLessThanOrEqual(1);
    }
  });
});
