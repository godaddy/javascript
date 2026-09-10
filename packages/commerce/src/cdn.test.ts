import { afterEach, describe, expect, it, vi } from 'vitest';

const config = { clientId: 'client', storeId: 'store', channelId: 'channel' };

afterEach(() => {
  vi.resetModules();
  delete window.gddyCommerceConfig;
  delete window.GddyCommerce;
  document.head.replaceChildren();
  document.body.replaceChildren();
});

describe('cdn runtime', () => {
  it('applies the inline config, exposes the library, links styles, and announces readiness', async () => {
    const ready = vi.fn();
    window.addEventListener('gddy:ready', ready, { once: true });
    window.gddyCommerceConfig = config;
    await import('./cdn');
    expect(ready).toHaveBeenCalledTimes(1);
    const runtime = window.GddyCommerce!;
    expect(runtime.getCommerce().config.storeId).toBe('store');
    expect(runtime.release.version).toBeTypeOf('string');
    expect((ready.mock.calls[0][0] as CustomEvent).detail.release.version).toBe(
      runtime.release.version
    );
    expect(customElements.get('gddy-add-to-cart')).toBeDefined();
    const link = document.head.querySelector<HTMLLinkElement>(
      'link[rel=stylesheet]'
    );
    // The build replaces the placeholder; the source keeps it.
    expect(link?.href).toContain('__GDDY_STYLESHEET__');
  });

  it('lets the page configure after gddy:ready when there is no inline config', async () => {
    const errors = vi.fn();
    window.addEventListener('gddy:error', errors);
    await import('./cdn');
    expect(() => window.GddyCommerce!.getCommerce()).toThrow();
    window.GddyCommerce!.configureCommerce(config);
    expect(window.GddyCommerce!.getCommerce().config.channelId).toBe('channel');
    expect(errors).not.toHaveBeenCalled();
  });

  it('reports a rejected inline config as gddy:error and still becomes ready', async () => {
    const ready = vi.fn();
    const errors = vi.fn();
    window.addEventListener('gddy:ready', ready, { once: true });
    window.addEventListener('gddy:error', errors, { once: true });
    // A browser token without the explicit opt-in is refused.
    window.gddyCommerceConfig = {
      ...config,
      getAccessToken: async () => 'token',
    };
    await import('./cdn');
    expect(errors).toHaveBeenCalledTimes(1);
    expect(
      String((errors.mock.calls[0][0] as CustomEvent).detail.error)
    ).toMatch(/dangerouslyAllowBrowserToken/);
    expect(ready).toHaveBeenCalledTimes(1);
    expect(() => window.GddyCommerce!.getCommerce()).toThrow();
  });

  it('does not add a second stylesheet when loaded twice', async () => {
    await import('./cdn');
    const { boot } = await import('./cdn');
    boot();
    expect(document.head.querySelectorAll('link[rel=stylesheet]')).toHaveLength(
      1
    );
  });
});
