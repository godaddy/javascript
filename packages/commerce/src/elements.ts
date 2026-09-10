import { itemCount } from './cart';
import {
  type CommerceClient,
  getCommerce,
  onCommerceConfigured,
} from './index';
import { redirectToCheckout } from './redirect';
import type { CommerceSnapshot } from './types';

// Importing this entry on an SSR server must not access DOM globals.
const ElementBase = (globalThis.HTMLElement || class {}) as typeof HTMLElement;

const STYLE = [
  ':host{display:inline-block;font:inherit}',
  // Chrome is variable-driven so a host design system can flatten or restyle it
  // without ::part rules. Defaults reproduce the original look.
  'button{font:inherit;font-family:var(--gddy-font,inherit);font-weight:var(--gddy-button-weight,400);cursor:pointer;',
  'border:var(--gddy-button-border,1px solid var(--gddy-color,#303036));border-radius:var(--gddy-radius,10px);',
  'background:var(--gddy-button-background,linear-gradient(#ffffff12,#0000000a),var(--gddy-color,#303036));',
  'color:var(--gddy-on-color,#fff);padding:var(--gddy-button-padding,.7em 1.1em);min-height:var(--gddy-button-min-height,48px);',
  'box-shadow:var(--gddy-button-shadow,inset 0 1px 0 #ffffff26,0 2px 3px #18181b1a);transition:filter .15s,background-color .15s}',
  'button:not(:disabled):hover{filter:brightness(var(--gddy-hover-brightness,1.08))}',
  'button:not(:disabled):active{filter:brightness(var(--gddy-active-brightness,.96))}',
  ':host([flat]) button{background:var(--gddy-color,#303036);box-shadow:none;border-color:var(--gddy-color,#303036)}',
  'button:disabled{opacity:.55;cursor:default}',
  'button:focus-visible{outline:3px solid var(--gddy-focus,#51515b);outline-offset:3px}',
  '[part=count]{margin-left:.5em;padding:0 .55em;border-radius:999px;font-size:.85em;line-height:1.7;',
  'background:var(--gddy-badge-background,var(--gddy-on-color,#fff));color:var(--gddy-badge-color,var(--gddy-color,#303036))}',
  '[part=count]:empty{display:none}',
  '[role=status]{display:block;font-size:.85em;max-width:30ch;margin-top:.3em;color:var(--gddy-error,#a31919)}',
  '[role=status]:empty{display:none}',
].join('');

abstract class CommerceButton extends ElementBase {
  static observedAttributes = ['sku-id', 'quantity', 'reference', 'disabled'];
  private unsubscribe?: () => void;
  private unconfigure?: () => void;
  private button?: HTMLButtonElement;
  private countBadge?: HTMLElement;
  private status?: HTMLElement;
  protected client?: CommerceClient;
  /** Fallback label when the element has no text content. */
  protected abstract label: string;
  /** Whether the button is unavailable while the cart is busy or a checkout is open. */
  protected readonly waitsForCart: boolean = true;
  protected abstract activate(client: CommerceClient): Promise<unknown>;

  /** A count rendered in `::part(count)` and the accessible name, or null for none. */
  protected badge(_snapshot: CommerceSnapshot | undefined): number | null {
    return null;
  }

  connectedCallback(): void {
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = STYLE;
      this.button = document.createElement('button');
      this.button.type = 'button';
      this.button.setAttribute('part', 'button');
      const slot = document.createElement('slot');
      slot.textContent = this.label;
      this.countBadge = document.createElement('span');
      this.countBadge.setAttribute('part', 'count');
      this.countBadge.setAttribute('aria-hidden', 'true');
      this.button.append(slot, this.countBadge);
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
      (this.waitsForCart && Boolean(snapshot?.pending || snapshot?.checkout));
    this.button.setAttribute('aria-busy', String(Boolean(snapshot?.pending)));
    const count = this.badge(snapshot);
    if (this.countBadge)
      this.countBadge.textContent = count ? String(count) : '';
    if (count) {
      const text = this.textContent?.trim() || this.label;
      this.button.setAttribute('aria-label', `${text} (${count})`);
    } else {
      this.button.removeAttribute('aria-label');
    }
  }

  private async clickAction(): Promise<void> {
    try {
      if (this.status) this.status.textContent = '';
      await this.activate(this.client ?? getCommerce());
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
  /** The cart can always be opened, including while it is updating. */
  protected readonly waitsForCart = false;
  protected badge(snapshot: CommerceSnapshot | undefined): number | null {
    return itemCount(snapshot?.cart);
  }
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
