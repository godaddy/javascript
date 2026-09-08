import {
  type CommerceClient,
  getCommerce,
  onCommerceConfigured,
} from './index';
import { redirectToCheckout } from './redirect';

// Importing this entry on an SSR server must not access DOM globals.
const ElementBase = (globalThis.HTMLElement || class {}) as typeof HTMLElement;

abstract class CommerceButton extends ElementBase {
  static observedAttributes = ['sku-id', 'quantity', 'reference', 'disabled'];
  private unsubscribe?: () => void;
  private unconfigure?: () => void;
  private button?: HTMLButtonElement;
  private status?: HTMLElement;
  protected client?: CommerceClient;
  protected abstract label: string;
  protected abstract activate(client: CommerceClient): Promise<unknown>;

  connectedCallback(): void {
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = `:host{display:inline-block;font:inherit}button{font:inherit;cursor:pointer;border:1px solid var(--gddy-color,#303036);border-radius:var(--gddy-radius,10px);background:linear-gradient(#ffffff12,#0000000a),var(--gddy-color,#303036);color:var(--gddy-on-color,#fff);padding:.7em 1.1em;min-height:48px;box-shadow:inset 0 1px 0 #ffffff26,0 2px 3px #18181b1a}button:disabled{opacity:.55;cursor:default}button:focus-visible{outline:3px solid var(--gddy-focus,#51515b);outline-offset:3px}[role=status]{display:block;font-size:.85em;max-width:30ch;margin-top:.3em;color:var(--gddy-error,#a31919)}[role=status]:empty{display:none}`;
      this.button = document.createElement('button');
      this.button.type = 'button';
      this.button.setAttribute('part', 'button');
      const slot = document.createElement('slot');
      slot.textContent = this.label;
      this.button.append(slot);
      this.status = document.createElement('span');
      this.status.setAttribute('role', 'status');
      this.status.setAttribute('part', 'status');
      this.button.addEventListener('click', () => {
        void this.clickAction();
      });
      root.append(style, this.button, this.status);
    }
    this.unconfigure = onCommerceConfigured(() => this.connectClient());
    this.connectClient();
  }

  disconnectedCallback(): void {
    this.unsubscribe?.();
    this.unconfigure?.();
  }
  attributeChangedCallback(): void {
    this.renderState();
  }

  private connectClient(): void {
    try {
      this.client = getCommerce();
    } catch {
      this.renderState();
      return;
    }
    this.unsubscribe?.();
    this.unsubscribe = this.client.subscribe(() => this.renderState());
    this.renderState();
    void this.client.ready().catch(error => this.report(error));
  }

  private renderState(): void {
    if (!this.button) return;
    const snapshot = this.client?.getSnapshot();
    this.button.disabled =
      !this.client ||
      this.hasAttribute('disabled') ||
      (this.localName !== 'gddy-cart-button' &&
        Boolean(snapshot?.pending || snapshot?.checkout));
    this.button.setAttribute('aria-busy', String(Boolean(snapshot?.pending)));
    if (this.localName === 'gddy-cart-button') {
      const count =
        snapshot?.cart?.lineItems?.reduce(
          (sum, line) => sum + (line.quantity || 0),
          0
        ) || 0;
      const slot = this.button.querySelector('slot');
      if (slot) slot.textContent = `Cart (${count})`;
      this.button.setAttribute(
        'aria-label',
        `${this.textContent?.trim() || 'Cart'} (${count})`
      );
    }
  }

  private async clickAction(): Promise<void> {
    try {
      if (this.status) this.status.textContent = '';
      await this.activate(getCommerce());
    } catch (error) {
      this.report(error);
    }
  }

  private report(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    if (this.status) this.status.textContent = message;
    this.dispatchEvent(
      new CustomEvent('gddy:error', {
        bubbles: true,
        composed: true,
        detail: { error },
      })
    );
  }

  protected count(): number {
    return this.hasAttribute('quantity')
      ? Number(this.getAttribute('quantity'))
      : 1;
  }
}

export class GddyAddToCart extends CommerceButton {
  protected label = 'Add to cart';
  protected async activate(client: CommerceClient): Promise<void> {
    const cart = await client.addItem(
      this.getAttribute('sku-id') || '',
      this.count()
    );
    this.dispatchEvent(
      new CustomEvent('gddy:cart-change', {
        bubbles: true,
        composed: true,
        detail: { cart },
      })
    );
  }
}

export class GddyCartButton extends CommerceButton {
  protected label = 'Cart';
  protected async activate(client: CommerceClient): Promise<void> {
    const { openCart } = await import('./drawer');
    openCart(client);
  }
}

export class GddyBuyNow extends CommerceButton {
  protected label = 'Buy now';
  protected async activate(client: CommerceClient): Promise<void> {
    const session = await client.buyNow(
      this.getAttribute('sku-id') || '',
      this.count()
    );
    redirectToCheckout(client, session);
  }
}

export class GddyPaymentButton extends CommerceButton {
  protected label = 'Pay now';
  protected async activate(client: CommerceClient): Promise<void> {
    const session = await client.pay(this.getAttribute('reference') || '');
    redirectToCheckout(client, session);
  }
}

if (typeof customElements !== 'undefined') {
  for (const [name, elementClass] of Object.entries({
    'gddy-add-to-cart': GddyAddToCart,
    'gddy-cart-button': GddyCartButton,
    'gddy-buy-now': GddyBuyNow,
    'gddy-payment-button': GddyPaymentButton,
  })) {
    if (!customElements.get(name)) customElements.define(name, elementClass);
  }
}
