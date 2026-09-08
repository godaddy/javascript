import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CommerceClient } from './client';
import { openCart } from './drawer';
import type { Cart, CommerceSnapshot, Session } from './types';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let resetCart: (() => void) | undefined;

async function renderCart(image?: string, selections = false) {
  const client = new CommerceClient({
    clientId: 'client',
    storeId: 'store',
    channelId: 'channel',
    checkout: { enablePromotionCodes: true },
  });
  const cart = {
    id: 'cart',
    lineItems: [
      {
        id: 'line-shirt',
        name: 'Shirt',
        quantity: 1,
        details: {
          productAssetUrl: image,
          selectedOptions: selections
            ? [
                { attribute: 'Color', values: ['Red'] },
                { attribute: 'Size', values: ['Large'] },
                {
                  attribute: 'Finish',
                  values: [
                    'Brushed cotton with embroidered detailing',
                    'Gift wrap',
                  ],
                },
              ]
            : [],
          selectedAddons: selections
            ? [
                {
                  attribute: 'Personalization',
                  values: [{ name: 'Initials: WC' }],
                },
              ]
            : [],
        },
        totals: { subTotal: { value: 1250, currencyCode: 'USD' } },
      },
    ],
    totals: { subTotal: { value: 1250, currencyCode: 'USD' } },
  } as unknown as Cart;
  let snapshot = {
    ...client.getSnapshot(),
    status: 'ready' as const,
    cart,
  } as CommerceSnapshot;
  const listeners = new Set<() => void>();
  vi.spyOn(client, 'getSnapshot').mockImplementation(() => snapshot);
  vi.spyOn(client, 'subscribe').mockImplementation(listener => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  });
  const publish = (patch: Partial<CommerceSnapshot>) => {
    snapshot = { ...snapshot, ...patch };
    for (const listener of listeners) listener();
  };
  resetCart = () => publish({ pending: 0 });
  vi.spyOn(client, 'ready').mockResolvedValue();
  const quantity = vi.spyOn(client, 'setQuantity').mockResolvedValue(cart);
  const remove = vi.spyOn(client, 'removeItem').mockResolvedValue(cart);
  await act(async () => openCart(client));
  return { client, quantity, remove, cart, publish };
}

async function typeQuantity(input: HTMLInputElement, value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    )!.set!.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

async function click(label: string) {
  const button = document.querySelector<HTMLButtonElement>(
    `button[aria-label="${label}"]`
  );
  expect(button).not.toBeNull();
  await act(async () => button!.click());
}

afterEach(async () => {
  await act(async () => resetCart?.());
  await click('Close cart');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

describe('cart drawer', () => {
  it.each(['blur', 'Enter'])(
    'keeps typed quantity through pending updates and commits once on %s',
    async commit => {
      const { quantity, cart, publish } = await renderCart();
      let complete!: () => void;
      quantity.mockImplementation(() => {
        publish({ pending: 1, status: 'loading' });
        return new Promise(resolve => {
          complete = () => {
            const updated = {
              ...cart,
              lineItems: cart.lineItems!.map(line => ({
                ...line,
                quantity: 12,
              })),
            };
            publish({ cart: updated, pending: 0, status: 'ready' });
            resolve(updated);
          };
        });
      });
      const input = document.querySelector<HTMLInputElement>(
        '.gddy-quantity input'
      )!;
      await act(async () => input.focus());
      await typeQuantity(input, '');
      expect(input.value).toBe('');
      await typeQuantity(input, '1');
      await typeQuantity(input, '12');
      expect(input.value).toBe('12');
      expect(quantity).not.toHaveBeenCalled();
      await act(async () => {
        if (commit === 'blur') input.blur();
        else
          input.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
          );
      });
      expect(quantity).toHaveBeenCalledExactlyOnceWith('line-shirt', 12);
      expect(input.disabled).toBe(true);
      expect(input.value).toBe('12');
      await act(async () => complete());
      expect(input.disabled).toBe(false);
      expect(input.value).toBe('12');
      await act(async () =>
        publish({
          cart: {
            ...cart,
            lineItems: cart.lineItems!.map(line => ({ ...line, quantity: 7 })),
          },
        })
      );
      expect(input.value).toBe('7');
    }
  );

  it('restores the server quantity after a rejected edit and allows retrying', async () => {
    const { quantity, publish, cart } = await renderCart();
    let rejectEdit!: () => void;
    quantity.mockImplementation(() => {
      publish({ pending: 1, status: 'loading' });
      return new Promise((_, reject) => {
        rejectEdit = () => {
          publish({ pending: 0, status: 'error' });
          reject(new Error('Quantity unavailable'));
        };
      });
    });
    const input = document.querySelector<HTMLInputElement>(
      '.gddy-quantity input'
    )!;
    await act(async () => input.focus());
    await typeQuantity(input, '12');
    await act(async () => input.blur());
    expect(input.value).toBe('12');
    await act(async () => rejectEdit());
    expect(input.value).toBe('1');
    expect(input.disabled).toBe(false);
    expect(document.querySelector('[role=alert]')?.textContent).toContain(
      'Quantity unavailable'
    );
    await act(async () => input.focus());
    await typeQuantity(input, '2');
    expect(input.value).toBe('2');
    quantity.mockResolvedValue(cart);
    await act(async () => input.blur());
    expect(quantity).toHaveBeenLastCalledWith('line-shirt', 2);
  });

  it.each(['', '-1', '1.5', '9007199254740992'])(
    'restores invalid quantity %s without submitting it',
    async value => {
      const { quantity } = await renderCart();
      const input = document.querySelector<HTMLInputElement>(
        '.gddy-quantity input'
      )!;
      await act(async () => input.focus());
      await typeQuantity(input, value);
      await act(async () => input.blur());
      expect(input.value).toBe('1');
      expect(quantity).not.toHaveBeenCalled();
    }
  );

  it('commits a typed zero as removal', async () => {
    const { quantity } = await renderCart();
    const input = document.querySelector<HTMLInputElement>(
      '.gddy-quantity input'
    )!;
    await act(async () => input.focus());
    await typeQuantity(input, '0');
    expect(quantity).not.toHaveBeenCalled();
    await act(async () => input.blur());
    expect(quantity).toHaveBeenCalledExactlyOnceWith('line-shirt', 0);
  });

  it('redirects cart checkout and keeps the cart visible without inline payment fields', async () => {
    const { client } = await renderCart();
    const assign = vi.fn();
    vi.stubGlobal('location', { assign });
    const session = {
      id: 'hosted',
      url: 'https://checkout.example/c/hosted',
    } as Session;
    vi.spyOn(client, 'checkout').mockResolvedValue(session);
    const closeCheckout = vi.spyOn(client, 'closeCheckout');
    const button = document.querySelector<HTMLButtonElement>(
      '.gddy-cart-actions .gddy-primary'
    )!;
    await act(async () => button.click());
    expect(assign).toHaveBeenCalledWith(session.url);
    expect(closeCheckout).toHaveBeenCalledOnce();
    expect(document.querySelector('.gddy-lines')?.textContent).toContain(
      'Shirt'
    );
    expect(document.querySelector('.gddy-checkout-scope')).toBeNull();
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('shows navigation failure in the cart so the shopper can retry', async () => {
    const { client } = await renderCart();
    vi.stubGlobal('location', {
      assign: vi.fn(() => {
        throw new Error('Navigation blocked');
      }),
    });
    vi.spyOn(client, 'checkout').mockResolvedValue({
      id: 'hosted',
      url: 'https://checkout.example/c/hosted',
    } as Session);
    const closeCheckout = vi.spyOn(client, 'closeCheckout');
    await act(async () =>
      document
        .querySelector<HTMLButtonElement>('.gddy-cart-actions .gddy-primary')!
        .click()
    );
    expect(document.querySelector('[role=alert]')?.textContent).toContain(
      'Navigation blocked'
    );
    expect(closeCheckout).toHaveBeenCalledOnce();
    expect(
      document.querySelector<HTMLButtonElement>(
        '.gddy-cart-actions .gddy-primary'
      )!.disabled
    ).toBe(false);
  });

  it('shows every selected variant and add-on with its attribute label', async () => {
    await renderCart(undefined, true);
    const options = document.querySelector('.gddy-options');
    expect(
      [...options!.querySelectorAll('dt')].map(label => label.textContent)
    ).toEqual(['Color:', 'Size:', 'Finish:', 'Personalization:']);
    expect(
      [...options!.querySelectorAll('dd')].map(value => value.textContent)
    ).toEqual([
      'Red',
      'Large',
      'Brushed cotton with embroidered detailing, Gift wrap',
      'Initials: WC',
    ]);
  });

  it('keeps quantity and removal actions on the correct item, including decrement to zero', async () => {
    const { quantity, remove } = await renderCart();
    expect(document.querySelector('.gddy-product-image svg')).not.toBeNull();
    expect(document.querySelector('details')?.open).toBe(false);
    await click('Increase quantity for Shirt');
    expect(quantity).toHaveBeenLastCalledWith('line-shirt', 2);
    await click('Decrease quantity for Shirt');
    expect(quantity).toHaveBeenLastCalledWith('line-shirt', 0);
    await click('Remove Shirt');
    expect(remove).toHaveBeenCalledWith('line-shirt');
  });

  it('replaces a failed product image with the placeholder without dropping the item', async () => {
    await renderCart('https://example.invalid/missing.png');
    const image = document.querySelector('.gddy-product-image img');
    expect(image).not.toBeNull();
    await act(async () => image!.dispatchEvent(new Event('error')));
    expect(document.querySelector('.gddy-product-image img')).toBeNull();
    expect(document.querySelector('.gddy-product-image svg')).not.toBeNull();
    expect(document.querySelector('.gddy-lines')?.textContent).toContain(
      'Shirt'
    );
  });
});
