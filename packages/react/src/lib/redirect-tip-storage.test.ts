import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearRedirectTipAmount,
  getRedirectTipAmount,
  setRedirectTipAmount,
} from './redirect-tip-storage';

const KEY = 'godaddy-checkout-redirect-tip';

describe('redirect tip storage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
  });

  it('round-trips a tip for the session it was saved for', () => {
    setRedirectTipAmount('session-1', 500);

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

  it('ignores a request without a session id', () => {
    setRedirectTipAmount('', 500);

    expect(window.sessionStorage.getItem(KEY)).toBeNull();
    expect(getRedirectTipAmount('')).toBeNull();
  });

  it('returns null for unparsable stored data', () => {
    window.sessionStorage.setItem(KEY, 'not-json');

    expect(getRedirectTipAmount('session-1')).toBeNull();
  });

  it('returns null when the stored tip is not a number', () => {
    window.sessionStorage.setItem(
      KEY,
      JSON.stringify({ sessionId: 'session-1', tipAmount: '500' })
    );

    expect(getRedirectTipAmount('session-1')).toBeNull();
  });

  it('clears the saved tip', () => {
    setRedirectTipAmount('session-1', 500);
    clearRedirectTipAmount();

    expect(getRedirectTipAmount('session-1')).toBeNull();
  });

  it('overwrites the tip saved for an earlier redirect', () => {
    setRedirectTipAmount('session-1', 500);
    setRedirectTipAmount('session-1', 750);

    expect(getRedirectTipAmount('session-1')).toBe(750);
  });

  it('does not throw when storage is unavailable', () => {
    for (const method of ['setItem', 'getItem', 'removeItem'] as const) {
      vi.spyOn(Storage.prototype, method).mockImplementation(() => {
        throw new Error('storage disabled');
      });
    }

    expect(() => setRedirectTipAmount('session-1', 500)).not.toThrow();
    expect(getRedirectTipAmount('session-1')).toBeNull();
    expect(() => clearRedirectTipAmount()).not.toThrow();
  });
});
