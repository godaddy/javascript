import { expect, it } from 'vitest';
import { OnceClaimLostError, type OnceOutcome, type OnceStore } from './store';

export interface Clock {
  now: number;
}

/**
 * The semantics every OnceStore adapter shares. `makeStore` builds an empty
 * store that reads the time from the clock it is given.
 */
export function onceStoreContract(
  makeStore: (clock: () => number) => Promise<OnceStore> | OnceStore,
): void {
  async function setup() {
    const clock: Clock = { now: 1_000 };
    const store = await makeStore(() => clock.now);
    return { clock, store };
  }

  it('claims a new key once, then reports it done after completion', async () => {
    const { store } = await setup();
    const claim = await store.claim('evt_1', 60_000);
    expect(claim.status).toBe('claimed');
    expect(await store.claim('evt_1', 60_000)).toEqual({ status: 'in_flight' });
    if (claim.status !== 'claimed') throw new Error('unreachable');
    await store.complete('evt_1', claim.token, { status: 'done' });
    expect(await store.claim('evt_1', 60_000)).toEqual({ status: 'done' });
  });

  it('records a refusal with its reason, and never runs it again', async () => {
    const { clock, store } = await setup();
    const claim = await store.claim('evt_1', 60_000);
    if (claim.status !== 'claimed') throw new Error('not claimed');
    await store.complete('evt_1', claim.token, {
      status: 'refused',
      reason: 'invalid_email',
    });
    clock.now += 10 * 60_000;
    expect(await store.claim('evt_1', 60_000)).toEqual({
      status: 'refused',
      reason: 'invalid_email',
    });
  });

  it('cuts a long refusal reason to 255 characters', async () => {
    const { store } = await setup();
    const claim = await store.claim('evt_1', 60_000);
    if (claim.status !== 'claimed') throw new Error('not claimed');
    await store.complete('evt_1', claim.token, {
      status: 'refused',
      reason: 'é'.repeat(300),
    });
    expect(await store.claim('evt_1', 60_000)).toEqual({
      status: 'refused',
      reason: 'é'.repeat(255),
    });
  });

  it('holds a claim until its lease has passed, then lets another caller take it over', async () => {
    const { clock, store } = await setup();
    const first = await store.claim('evt_1', 60_000);
    if (first.status !== 'claimed') throw new Error('not claimed');
    clock.now += 60_000;
    expect(await store.claim('evt_1', 60_000)).toEqual({ status: 'in_flight' });
    clock.now += 1;
    const second = await store.claim('evt_1', 60_000);
    expect(second.status).toBe('claimed');
    if (second.status !== 'claimed') throw new Error('not claimed');
    expect(second.token).not.toBe(first.token);

    // The caller that lost the claim can neither record nor release it.
    await expect(
      store.complete('evt_1', first.token, { status: 'done' }),
    ).rejects.toBeInstanceOf(OnceClaimLostError);
    await store.release('evt_1', first.token);
    expect(await store.claim('evt_1', 60_000)).toEqual({ status: 'in_flight' });

    await store.complete('evt_1', second.token, { status: 'done' });
    expect(await store.claim('evt_1', 60_000)).toEqual({ status: 'done' });
  });

  it('forgets a released claim, so a retry can run the work again', async () => {
    const { store } = await setup();
    const claim = await store.claim('evt_1', 60_000);
    if (claim.status !== 'claimed') throw new Error('not claimed');
    await store.release('evt_1', claim.token);
    expect((await store.claim('evt_1', 60_000)).status).toBe('claimed');
  });

  it('never releases or reopens a finished key', async () => {
    const { store } = await setup();
    const claim = await store.claim('evt_1', 60_000);
    if (claim.status !== 'claimed') throw new Error('not claimed');
    await store.complete('evt_1', claim.token, { status: 'done' });
    await store.release('evt_1', claim.token);
    await expect(
      store.complete('evt_1', claim.token, { status: 'refused', reason: 'x' }),
    ).rejects.toBeInstanceOf(OnceClaimLostError);
    expect(await store.claim('evt_1', 60_000)).toEqual({ status: 'done' });
  });

  it('refuses to record a key nobody claimed', async () => {
    const { store } = await setup();
    await expect(
      store.complete('evt_unknown', 'token', { status: 'done' }),
    ).rejects.toBeInstanceOf(OnceClaimLostError);
  });

  it('keeps keys apart that differ only in case, accents or trailing spaces', async () => {
    const { store } = await setup();
    for (const key of ['evt_a', 'EVT_A', 'evt_á', 'evt_a ']) {
      expect((await store.claim(key, 60_000)).status).toBe('claimed');
    }
  });

  it('refuses a bad key or lease when called directly', async () => {
    const { store } = await setup();
    for (const key of ['', 'x'.repeat(256), 'evt_\uD800']) {
      await expect(store.claim(key, 60_000)).rejects.toThrow(TypeError);
    }
    for (const leaseMs of [0, -1, 1.5, Number.NaN, undefined]) {
      await expect(
        store.claim('evt_1', leaseMs as unknown as number),
      ).rejects.toThrow(TypeError);
    }
    expect((await store.claim('evt_1', 60_000)).status).toBe('claimed');
  });

  it('refuses an outcome that is neither done nor refused', async () => {
    const { store } = await setup();
    const claim = await store.claim('evt_1', 60_000);
    if (claim.status !== 'claimed') throw new Error('not claimed');
    await expect(
      store.complete('evt_1', claim.token, {
        status: 'failed',
      } as unknown as OnceOutcome),
    ).rejects.toThrow(TypeError);
    // The claim is untouched and can still be recorded.
    await store.complete('evt_1', claim.token, { status: 'done' });
    expect(await store.claim('evt_1', 60_000)).toEqual({ status: 'done' });
  });
}
