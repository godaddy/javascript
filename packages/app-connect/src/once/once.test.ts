import { describe, expect, it, vi } from 'vitest';
import { createMemoryOnceStore } from './memory-store';
import { OnceNotRecordedError, Refused, once } from './once';
import type { OnceClaim, OnceStore } from './store';

function clockedStore() {
  const clock = { now: 1_000 };
  return { clock, store: createMemoryOnceStore({ now: () => clock.now }) };
}

describe('once', () => {
  it('runs the work and returns its value, then reports a duplicate', async () => {
    const { store } = clockedStore();
    const fn = vi.fn(async () => 'sent');
    expect(await once(store, 'evt_1', fn)).toEqual({
      status: 'done',
      value: 'sent',
    });
    expect(await once(store, 'evt_1', fn)).toEqual({
      status: 'duplicate',
      outcome: { status: 'done' },
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('accepts work that is not async', async () => {
    const { store } = clockedStore();
    expect(await once(store, 'evt_1', () => 42)).toEqual({
      status: 'done',
      value: 42,
    });
  });

  it('runs the work once when two callers race for the same key', async () => {
    const { store } = clockedStore();
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const fn = vi.fn(async () => {
      await gate;
      return 'sent';
    });
    const first = once(store, 'evt_1', fn);
    const second = await once(store, 'evt_1', fn);
    release();
    expect(second).toEqual({ status: 'in_flight' });
    expect(await first).toEqual({ status: 'done', value: 'sent' });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('records a Refused for good and returns its reason', async () => {
    const { clock, store } = clockedStore();
    const fn = vi.fn(async () => {
      throw new Refused('invalid_email');
    });
    expect(await once(store, 'evt_1', fn)).toEqual({
      status: 'refused',
      reason: 'invalid_email',
    });
    clock.now += 24 * 3600_000;
    expect(await once(store, 'evt_1', fn)).toEqual({
      status: 'duplicate',
      outcome: { status: 'refused', reason: 'invalid_email' },
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('recognizes a Refused from another copy of this package by its brand', async () => {
    const { store } = clockedStore();
    const foreign = Object.assign(new Error('gone'), {
      reason: 'gone',
      [Symbol.for('@godaddy/app-connect/once/refused')]: true,
    });
    expect(
      await once(store, 'evt_1', async () => {
        throw foreign;
      }),
    ).toEqual({ status: 'refused', reason: 'gone' });
  });

  it('still records a refusal whose reason cannot become text', async () => {
    const { store } = clockedStore();
    const foreign = Object.assign(new Error('odd'), {
      reason: Object.create(null),
      [Symbol.for('@godaddy/app-connect/once/refused')]: true,
    });
    expect(
      await once(store, 'evt_1', async () => {
        throw foreign;
      }),
    ).toEqual({ status: 'refused', reason: '' });
  });

  it('never runs the work on a claim status it does not know', async () => {
    const store: OnceStore = {
      claim: async () => ({ status: 'busy' }) as unknown as OnceClaim,
      complete: async () => {},
      release: async () => {},
    };
    const fn = vi.fn(async () => 'sent');
    await expect(once(store, 'evt_1', fn)).rejects.toThrow(TypeError);
    expect(fn).not.toHaveBeenCalled();
  });

  it('releases the claim and rethrows when the thrown value can not be inspected', async () => {
    const { store } = clockedStore();
    const { proxy, revoke } = Proxy.revocable({}, {});
    revoke();
    await expect(
      once(store, 'evt_1', async () => {
        throw proxy;
      }),
    ).rejects.toBe(proxy);
    // Released, so a retry runs the work.
    expect(await once(store, 'evt_1', async () => 'sent')).toEqual({
      status: 'done',
      value: 'sent',
    });
  });

  it('still records a refusal whose reason getter throws', async () => {
    const { store } = clockedStore();
    const foreign = Object.defineProperty(
      Object.assign(new Error('odd'), {
        [Symbol.for('@godaddy/app-connect/once/refused')]: true,
      }),
      'reason',
      {
        get() {
          throw new Error('no reason for you');
        },
      },
    );
    expect(
      await once(store, 'evt_1', async () => {
        throw foreign;
      }),
    ).toEqual({ status: 'refused', reason: '' });
    expect(await once(store, 'evt_1', async () => 'sent')).toEqual({
      status: 'duplicate',
      outcome: { status: 'refused', reason: '' },
    });
  });

  it('reports a recorded refusal without a reason with an empty one', async () => {
    const store: OnceStore = {
      claim: async () => ({ status: 'refused' }),
      complete: async () => {},
      release: async () => {},
    };
    expect(await once(store, 'evt_1', async () => 'sent')).toEqual({
      status: 'duplicate',
      outcome: { status: 'refused', reason: '' },
    });
  });

  it('stores a refusal reason that is not a string as text', async () => {
    const { store } = clockedStore();
    const foreign = Object.assign(new Error('422'), {
      reason: 422,
      [Symbol.for('@godaddy/app-connect/once/refused')]: true,
    });
    expect(
      await once(store, 'evt_1', async () => {
        throw foreign;
      }),
    ).toEqual({ status: 'refused', reason: '422' });
    expect(await once(store, 'evt_1', async () => 'sent')).toEqual({
      status: 'duplicate',
      outcome: { status: 'refused', reason: '422' },
    });
  });

  it('releases the key and rethrows any other error, so a retry runs again', async () => {
    const { store } = clockedStore();
    const failure = new Error('vendor unavailable');
    await expect(
      once(store, 'evt_1', async () => {
        throw failure;
      }),
    ).rejects.toBe(failure);
    expect(await once(store, 'evt_1', async () => 'sent')).toEqual({
      status: 'done',
      value: 'sent',
    });
  });

  it('rethrows the work error even when the release fails', async () => {
    const { store } = clockedStore();
    const failing: OnceStore = {
      ...store,
      release: async () => {
        throw new Error('db down');
      },
    };
    const failure = new Error('vendor unavailable');
    await expect(
      once(failing, 'evt_1', async () => {
        throw failure;
      }),
    ).rejects.toBe(failure);
    const onReleaseError = vi.fn(() => {
      throw new Error('logger broke');
    });
    await expect(
      once(
        failing,
        'evt_2',
        async () => {
          throw failure;
        },
        { onReleaseError },
      ),
    ).rejects.toBe(failure);
    expect(onReleaseError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'db down' }),
      'evt_2',
    );
  });

  it('takes over a key whose lease passed, after a crash mid-work', async () => {
    const { clock, store } = clockedStore();
    const claim = await store.claim('evt_1', 1_000);
    expect(claim.status).toBe('claimed');
    expect(
      await once(store, 'evt_1', async () => 'x', { leaseMs: 1_000 }),
    ).toEqual({ status: 'in_flight' });
    clock.now += 1_001;
    expect(
      await once(store, 'evt_1', async () => 'x', { leaseMs: 1_000 }),
    ).toEqual({ status: 'done', value: 'x' });
  });

  it('throws OnceNotRecordedError when the work finished but could not be recorded', async () => {
    const { clock, store } = clockedStore();
    // The lease passes during the work and another caller takes the key over.
    const result = once(
      store,
      'evt_1',
      async () => {
        clock.now += 2_000;
        await store.claim('evt_1', 60_000);
        return 'sent';
      },
      { leaseMs: 1_000 },
    );
    await expect(result).rejects.toBeInstanceOf(OnceNotRecordedError);
    await expect(result).rejects.toMatchObject({
      key: 'evt_1',
      outcome: { status: 'done' },
    });
    const error = (await result.catch((caught: unknown) => caught)) as
      | OnceNotRecordedError
      | undefined;
    expect(error?.value).toBe('sent');
    // Kept out of serialized logs: it may hold vendor or shopper data.
    expect(Object.keys(error ?? {})).not.toContain('value');
  });

  it('records a refusal reason with lone surrogates as well-formed text', async () => {
    const { store } = clockedStore();
    expect(
      await once(store, 'evt_1', async () => {
        throw new Refused('bad_\uD800');
      }),
    ).toEqual({ status: 'refused', reason: 'bad_�' });
  });

  it('never lets a rejecting onReleaseError go unhandled', async () => {
    const { store } = clockedStore();
    const failing: OnceStore = {
      ...store,
      release: async () => {
        throw new Error('db down');
      },
    };
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    try {
      const failure = new Error('vendor unavailable');
      await expect(
        once(
          failing,
          'evt_1',
          async () => {
            throw failure;
          },
          { onReleaseError: async () => Promise.reject(new Error('log down')) },
        ),
      ).rejects.toBe(failure);
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', unhandled);
    }
  });

  it('refuses a key that is empty or too long, and a bad lease', async () => {
    const { store } = clockedStore();
    const fn = vi.fn();
    await expect(once(store, '', fn)).rejects.toThrow(TypeError);
    await expect(once(store, 'x'.repeat(256), fn)).rejects.toThrow(TypeError);
    await expect(once(store, 'evt_\uD800', fn)).rejects.toThrow(TypeError);
    await expect(once(store, '😀'.repeat(255), fn)).resolves.toMatchObject({
      status: 'done',
    });
    for (const leaseMs of [0, -1, 1.5, Number.NaN]) {
      await expect(once(store, 'evt_1', fn, { leaseMs })).rejects.toThrow(
        TypeError,
      );
    }
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
