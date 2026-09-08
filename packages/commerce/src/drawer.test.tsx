import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CommerceClient } from './client';
import { openCart } from './drawer';
import type { Cart, Session } from './types';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

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
  const snapshot = { ...client.getSnapshot(), status: 'ready' as const, cart };
  vi.spyOn(client, 'getSnapshot').mockReturnValue(snapshot);
  vi.spyOn(client, 'ready').mockResolvedValue();
  const quantity = vi.spyOn(client, 'setQuantity').mockResolvedValue(cart);
  const remove = vi.spyOn(client, 'removeItem').mockResolvedValue(cart);
  await act(async () => openCart(client));
  return { client, quantity, remove };
}

async function click(label: string) {
  const button = document.querySelector<HTMLButtonElement>(
    `button[aria-label="${label}"]`
  );
  expect(button).not.toBeNull();
  await act(async () => button!.click());
}

afterEach(async () => {
  await click('Close cart');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

describe('cart drawer', () => {
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
