import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearRedirectTipAmount,
  getRedirectTipAmount,
  setRedirectTipAmount,
} from './redirect-tip-storage';

const KEY_PREFIX = 'godaddy-checkout-redirect-tip';
const keyFor = (sessionId: string) => `${KEY_PREFIX}:${sessionId}`;

function clearAll() {
  window.sessionStorage.clear();
  window.localStorage.clear();
}

describe('redirect tip storage', () => {
  beforeEach(clearAll);

  afterEach(() => {
    vi.restoreAllMocks();
    clearAll();
  });

  it('round-trips a tip for the session it was saved for', () => {
    expect(setRedirectTipAmount('session-1', 500)).toBe(true);

    expect(getRedirectTipAmount('session-1')).toBe(500);
  });

  it('saves a zero tip distinctly from nothing saved', () => {
    setRedirectTipAmount('session-1', 0);

    expect(getRedirectTipAmount('session-1')).toBe(0);
  });

  it('returns null when nothing was saved', () => {
    expect(getRedirectTipAmount('session-1')).toBeNull();
  });

  it('returns null for a different session id', () => {
    setRedirectTipAmount('session-1', 500);

    expect(getRedirectTipAmount('session-2')).toBeNull();
  });

  it('keeps a tip a later session in the same tab saved alongside it', () => {
    setRedirectTipAmount('session-1', 500);
    setRedirectTipAmount('session-2', 750);

    expect(getRedirectTipAmount('session-1')).toBe(500);
    expect(getRedirectTipAmount('session-2')).toBe(750);
  });

  it('ignores a request without a session id', () => {
    expect(setRedirectTipAmount('', 500)).toBe(false);

    expect(getRedirectTipAmount('')).toBeNull();
  });

  it('returns null for unparsable stored data', () => {
    window.sessionStorage.setItem(keyFor('session-1'), 'not-json');

    expect(getRedirectTipAmount('session-1')).toBeNull();
  });

  it('returns null when the stored tip is not a number', () => {
    window.sessionStorage.setItem(
      keyFor('session-1'),
      JSON.stringify({ tipAmount: '500', savedAt: Date.now() })
    );

    expect(getRedirectTipAmount('session-1')).toBeNull();
  });

  it('clears the saved tip', () => {
    setRedirectTipAmount('session-1', 500);
    clearRedirectTipAmount('session-1');

    expect(getRedirectTipAmount('session-1')).toBeNull();
  });

  it('clears the tip from every store it was mirrored to', () => {
    setRedirectTipAmount('session-1', 500);
    clearRedirectTipAmount('session-1');

    expect(window.sessionStorage.getItem(keyFor('session-1'))).toBeNull();
    expect(window.localStorage.getItem(keyFor('session-1'))).toBeNull();
  });

  it('overwrites the tip saved for an earlier redirect', () => {
    setRedirectTipAmount('session-1', 500);
    setRedirectTipAmount('session-1', 750);

    expect(getRedirectTipAmount('session-1')).toBe(750);
  });

  describe('durability across tabs', () => {
    it('mirrors the tip to localStorage so a return in a new tab can read it', () => {
      setRedirectTipAmount('session-1', 500);

      // sessionStorage is per-tab; a gateway returning to a different tab sees
      // only localStorage.
      window.sessionStorage.clear();

      expect(getRedirectTipAmount('session-1')).toBe(500);
    });

    it('reports success when only one store accepted the write', () => {
      vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
        throw new Error('storage full');
      });

      expect(setRedirectTipAmount('session-1', 500)).toBe(true);
      expect(getRedirectTipAmount('session-1')).toBe(500);
    });
  });

  describe('staleness', () => {
    it('ignores a tip older than the maximum age', () => {
      const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
      window.sessionStorage.setItem(
        keyFor('session-1'),
        JSON.stringify({ tipAmount: 500, savedAt: twoDaysAgo })
      );

      expect(getRedirectTipAmount('session-1')).toBeNull();
    });

    it('ignores a tip with no saved timestamp', () => {
      window.sessionStorage.setItem(
        keyFor('session-1'),
        JSON.stringify({ tipAmount: 500 })
      );

      expect(getRedirectTipAmount('session-1')).toBeNull();
    });

    it('sweeps expired entries on the next write', () => {
      const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
      window.localStorage.setItem(
        keyFor('abandoned'),
        JSON.stringify({ tipAmount: 500, savedAt: twoDaysAgo })
      );

      setRedirectTipAmount('session-1', 750);

      expect(window.localStorage.getItem(keyFor('abandoned'))).toBeNull();
      expect(getRedirectTipAmount('session-1')).toBe(750);
    });

    it('leaves unrelated keys alone when sweeping', () => {
      window.localStorage.setItem('some-other-app-key', 'keep me');

      setRedirectTipAmount('session-1', 500);

      expect(window.localStorage.getItem('some-other-app-key')).toBe('keep me');
    });
  });

  describe('when storage is unavailable', () => {
    it('reports failure rather than throwing', () => {
      for (const method of ['setItem', 'getItem', 'removeItem'] as const) {
        vi.spyOn(Storage.prototype, method).mockImplementation(() => {
          throw new Error('storage disabled');
        });
      }

      expect(setRedirectTipAmount('session-1', 500)).toBe(false);
      expect(getRedirectTipAmount('session-1')).toBeNull();
      expect(() => clearRedirectTipAmount('session-1')).not.toThrow();
    });

    it('reports failure when a write is accepted but not readable back', () => {
      // Safari with storage blocked accepts setItem and then returns null.
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(
        () => undefined
      );

      expect(setRedirectTipAmount('session-1', 500)).toBe(false);
    });
  });
});
