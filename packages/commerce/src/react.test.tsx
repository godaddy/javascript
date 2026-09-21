import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCommerce } from './index';
import { AddToCartButton, useCart } from './react';
import type { Session } from './types';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const roots: (() => Promise<void>)[] = [];

function mount() {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  roots.push(() => act(async () => root.unmount()));
  return {
    container,
    render: (node: Parameters<typeof root.render>[0]) =>
      act(async () => root.render(node)),
  };
}

afterEach(async () => {
  for (const unmount of roots.splice(0)) await unmount();
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe('react bindings', () => {
  it('passes disabled and className as attributes that React 18 also renders correctly', async () => {
    const { container, render } = mount();
    await render(
      createElement(
        AddToCartButton,
        { skuId: 'sku', quantity: 2, className: 'promo', disabled: false },
        'Add'
      )
    );
    const element = container.querySelector('gddy-add-to-cart')!;
    expect(element.getAttribute('class')).toBe('promo');
    expect(element.hasAttribute('disabled')).toBe(false);
    expect(element.getAttribute('sku-id')).toBe('sku');
    expect(element.getAttribute('quantity')).toBe('2');
    expect(element.textContent).toBe('Add');
    await render(
      createElement(AddToCartButton, { skuId: 'sku', disabled: true })
    );
    expect(element.getAttribute('disabled')).toBe('');
    expect(element.hasAttribute('quantity')).toBe(false);
    expect(element.hasAttribute('class')).toBe(false);
  });

  it('exposes the open session as checkout, with stable actions across renders', async () => {
    const client = createCommerce({
      clientId: 'client',
      storeId: 'store',
      channelId: 'channel',
    });
    const ready = vi.spyOn(client, 'ready').mockResolvedValue();
    const session = {
      id: 'session',
      url: 'https://checkout.example/session',
    } as Session;
    let snapshot = { ...client.getSnapshot(), checkout: session };
    const listeners = new Set<() => void>();
    vi.spyOn(client, 'getSnapshot').mockImplementation(() => snapshot);
    vi.spyOn(client, 'subscribe').mockImplementation(listener => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    });
    const checkout = vi.spyOn(client, 'checkout').mockResolvedValue(session);
    const seen: ReturnType<typeof useCart>[] = [];
    function Probe() {
      seen.push(useCart(client));
      return null;
    }
    const { render } = mount();
    await render(createElement(Probe));
    await act(async () => {
      snapshot = { ...snapshot, pending: 1 };
      for (const listener of listeners) listener();
    });
    expect(seen).toHaveLength(2);
    expect(seen[1].checkout).toBe(session);
    expect(seen[1].pending).toBe(1);
    expect(seen[1].client).toBe(client);
    expect(seen[1].addItem).toBe(seen[0].addItem);
    expect(seen[1].startCheckout).toBe(seen[0].startCheckout);
    await seen[1].startCheckout();
    expect(checkout).toHaveBeenCalledOnce();
    expect(ready).toHaveBeenCalledOnce();
  });
});
