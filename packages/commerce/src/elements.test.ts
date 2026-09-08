import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureCommerce } from './index';
import './elements';

const client = configureCommerce({
  clientId: 'client',
  storeId: 'store',
  channelId: 'channel',
});
afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe('web component integration', () => {
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
