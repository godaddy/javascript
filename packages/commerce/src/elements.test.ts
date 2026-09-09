import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureCommerce } from './index';
import './elements';
import type { Cart, CommerceSnapshot, Session } from './types';

const client = configureCommerce({
  clientId: 'client',
  storeId: 'store',
  channelId: 'channel',
});
afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('web component integration', () => {
  it.each([
    ['gddy-buy-now', 'buyNow', 'sku-id', 'red-large'],
    ['gddy-payment-button', 'pay', 'reference', 'invoice-123'],
  ] as const)(
    'redirects %s to the returned hosted URL without opening a drawer',
    async (tag, method, attribute, value) => {
      const assign = vi.fn();
      vi.stubGlobal('location', { assign });
      const session = {
        id: 'hosted',
        url: 'https://checkout.example/c/hosted?token=opaque',
      } as Session;
      const purchase = vi.spyOn(client, method).mockResolvedValue(session);
      const element = document.createElement(tag);
      element.setAttribute(attribute, value);
      document.body.append(element);
      await client.ready();
      element.shadowRoot!.querySelector('button')!.click();
      await vi.waitFor(() => expect(assign).toHaveBeenCalledWith(session.url));
      expect(purchase.mock.calls[0][0]).toBe(value);
      expect(document.querySelector('[data-gddy-root]')).toBeNull();
    }
  );

  it('reports session creation failures without navigating', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { assign });
    vi.spyOn(client, 'buyNow').mockRejectedValue(
      new Error('Checkout unavailable')
    );
    const element = document.createElement('gddy-buy-now');
    element.setAttribute('sku-id', 'shirt');
    document.body.append(element);
    await client.ready();
    element.shadowRoot!.querySelector('button')!.click();
    await vi.waitFor(() =>
      expect(
        element.shadowRoot!.querySelector('[role=status]')!.textContent
      ).toContain('Checkout unavailable')
    );
    expect(assign).not.toHaveBeenCalled();
    expect(element.shadowRoot!.querySelector('button')!.disabled).toBe(false);
  });

  it('uses the selected SKU and quantity, emits addition, and respects disabled', async () => {
    const add = vi.spyOn(client, 'addItem').mockResolvedValue(null);
    const element = document.createElement('gddy-add-to-cart');
    element.setAttribute('sku-id', 'red-small');
    element.setAttribute('quantity', '2');
    const changed = vi.fn();
    element.addEventListener('gddy:cart-change', changed);
    document.body.append(element);
    await client.ready();
    const button = element.shadowRoot!.querySelector('button')!;
    button.click();
    await vi.waitFor(() => expect(changed).toHaveBeenCalledTimes(1));
    expect(add).toHaveBeenCalledWith('red-small', 2);
    element.setAttribute('disabled', '');
    button.click();
    expect(add).toHaveBeenCalledTimes(1);
    element.removeAttribute('disabled');
    element.setAttribute('quantity', '3');
    button.click();
    expect(add).toHaveBeenLastCalledWith('red-small', 3);
  });

  it('renders errors without interpreting merchant/API text as HTML', async () => {
    vi.spyOn(client, 'addItem').mockRejectedValue(
      new Error('<img src=x onerror=alert(1)>')
    );
    const element = document.createElement('gddy-add-to-cart');
    element.setAttribute('sku-id', 'missing');
    document.body.append(element);
    await client.ready();
    element.shadowRoot!.querySelector('button')!.click();
    await vi.waitFor(() =>
      expect(
        element.shadowRoot!.querySelector('[role=status]')!.textContent
      ).toContain('<img')
    );
    expect(element.shadowRoot!.querySelector('img')).toBeNull();
  });

  it('survives removal and reconnection without duplicating click listeners', async () => {
    const add = vi.spyOn(client, 'addItem').mockResolvedValue(null);
    const element = document.createElement('gddy-add-to-cart');
    element.setAttribute('sku-id', 'sku');
    document.body.append(element);
    element.remove();
    document.body.append(element);
    await client.ready();
    element.shadowRoot!.querySelector('button')!.click();
    expect(add).toHaveBeenCalledTimes(1);
  });
});

describe('cart button', () => {
  it('shows the item count beside slotted label text and stays usable while the cart updates', async () => {
    const cart = {
      id: 'cart',
      lineItems: [
        { id: 'a', quantity: 2 },
        { id: 'b', quantity: 1 },
      ],
    } as unknown as Cart;
    let snapshot: CommerceSnapshot = {
      ...client.getSnapshot(),
      cart,
      pending: 1,
      status: 'loading',
    };
    const listeners = new Set<() => void>();
    vi.spyOn(client, 'getSnapshot').mockImplementation(() => snapshot);
    vi.spyOn(client, 'subscribe').mockImplementation(listener => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    });
    vi.spyOn(client, 'ready').mockResolvedValue();
    const element = document.createElement('gddy-cart-button');
    element.textContent = 'Basket';
    const add = document.createElement('gddy-add-to-cart');
    add.setAttribute('sku-id', 'sku');
    document.body.append(element, add);
    const button = element.shadowRoot!.querySelector('button')!;
    expect(button.querySelector('[part=count]')!.textContent).toBe('3');
    expect(button.getAttribute('aria-label')).toBe('Basket (3)');
    expect(button.querySelector('slot')!.textContent).toBe('Cart');
    expect(button.disabled).toBe(false);
    expect(add.shadowRoot!.querySelector('button')!.disabled).toBe(true);
    snapshot = {
      ...snapshot,
      cart: { ...cart, lineItems: [] } as Cart,
      pending: 0,
      status: 'ready',
    };
    for (const listener of listeners) listener();
    expect(button.querySelector('[part=count]')!.textContent).toBe('');
    expect(button.hasAttribute('aria-label')).toBe(false);
    expect(add.shadowRoot!.querySelector('button')!.disabled).toBe(false);
  });

  it('reports a non-HTTP hosted URL as a CommerceError without navigating', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { assign });
    vi.spyOn(client, 'buyNow').mockResolvedValue({
      id: 'hosted',
      url: 'javascript:alert(1)',
    } as Session);
    const element = document.createElement('gddy-buy-now');
    element.setAttribute('sku-id', 'shirt');
    const errors = vi.fn();
    element.addEventListener('gddy:error', errors);
    document.body.append(element);
    await client.ready();
    element.shadowRoot!.querySelector('button')!.click();
    await vi.waitFor(() => expect(errors).toHaveBeenCalledOnce());
    expect(assign).not.toHaveBeenCalled();
    expect(errors.mock.calls[0][0].detail.error).toMatchObject({
      code: 'INVALID_URL',
    });
    expect(
      element.shadowRoot!.querySelector('[role=status]')!.textContent
    ).toContain('HTTP or HTTPS');
  });
});
