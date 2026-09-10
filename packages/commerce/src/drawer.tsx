import * as Dialog from '@radix-ui/react-dialog';
import { useRef, useState, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { itemCount } from './cart';
import type { CommerceClient } from './client';
import { redirectToCheckout } from './redirect';
import type { Cart } from './types';
import './drawer.css';

let active: { client: CommerceClient; container: HTMLElement } | undefined;

const formatters = new Map<string, Intl.NumberFormat | null>();

/** Cached per locale and currency; an invalid merchant locale falls back to en-US. */
function formatter(
  locale: string | undefined,
  currency: string
): Intl.NumberFormat | null {
  const key = `${locale ?? ''}|${currency}`;
  if (!formatters.has(key)) {
    let created: Intl.NumberFormat | null = null;
    for (const candidate of [locale, 'en-US']) {
      try {
        created = new Intl.NumberFormat(candidate, {
          style: 'currency',
          currency,
        });
        break;
      } catch {
        /* Try the next locale. */
      }
    }
    formatters.set(key, created);
  }
  return formatters.get(key) ?? null;
}

function money(
  value:
    | { value?: number | null; currencyCode?: string | null }
    | null
    | undefined,
  locale?: string
): string {
  if (value?.value == null || !value.currencyCode) return '—';
  const format = formatter(locale, value.currencyCode);
  if (!format) return `${value.value} ${value.currencyCode}`;
  const digits = format.resolvedOptions().maximumFractionDigits ?? 2;
  return format.format(value.value / 10 ** digits);
}

function ProductImage({ src }: { src?: string | null }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className='gddy-product-image'>
      {src && !failed ? (
        <img
          src={src}
          alt=''
          width={64}
          height={64}
          loading='lazy'
          onError={() => setFailed(true)}
        />
      ) : (
        <svg
          aria-hidden='true'
          width='24'
          height='24'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='1.5'
        >
          <rect x='3.5' y='3.5' width='17' height='17' rx='2' />
          <circle cx='8.5' cy='8.5' r='1.5' />
          <path d='m4 17 5-5 3 3 3-4 5 6' />
        </svg>
      )}
    </div>
  );
}

function SelectedOptions({
  details,
}: {
  details: NonNullable<Cart['lineItems']>[number]['details'];
}) {
  const selections = [
    ...(details?.selectedOptions || []).map(option => ({
      label: option.attribute,
      values: option.values || [],
    })),
    ...(details?.selectedAddons || []).map(addon => ({
      label: addon.attribute,
      values: addon.values?.map(value => value.name).filter(Boolean) || [],
    })),
  ].filter(selection => selection.values.length > 0);
  if (!selections.length) return null;
  return (
    <dl className='gddy-options'>
      {selections.map((selection, index) => (
        <div key={`${selection.label}-${index}`}>
          {selection.label && <dt>{selection.label}:</dt>}
          <dd>{selection.values.join(', ')}</dd>
        </div>
      ))}
    </dl>
  );
}

function QuantityInput({
  name,
  quantity,
  disabled,
  onCommit,
}: {
  name: string | null;
  quantity: number;
  disabled: boolean;
  onCommit: (quantity: number) => Promise<unknown>;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const submitting = useRef(false);
  const commit = async () => {
    if (draft === null || submitting.current) return;
    const count = draft.trim() === '' ? Number.NaN : Number(draft);
    if (!Number.isSafeInteger(count) || count < 0 || count === quantity) {
      setDraft(null);
      return;
    }
    submitting.current = true;
    try {
      await onCommit(count);
    } finally {
      submitting.current = false;
      // Resume reading the authoritative quantity after success or failure.
      setDraft(null);
    }
  };
  return (
    <input
      aria-label={`Quantity for ${name}`}
      type='number'
      min='0'
      step='1'
      value={draft ?? quantity}
      disabled={disabled}
      onFocus={event => event.target.select()}
      onChange={event => setDraft(event.target.value)}
      onBlur={() => void commit()}
      onKeyDown={event => {
        if (event.key === 'Enter') {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
    />
  );
}

function Drawer({
  client,
  dismiss,
}: {
  client: CommerceClient;
  dismiss: () => void;
}) {
  const snapshot = useSyncExternalStore(
    client.subscribe,
    client.getSnapshot,
    client.getServerSnapshot
  );
  const [localError, setLocalError] = useState<string>();
  const busy = Boolean(snapshot.pending);
  const cart = snapshot.cart;
  const items = itemCount(cart);
  const close = () => {
    if (!busy) {
      client.closeCheckout();
      dismiss();
    }
  };
  const perform = async (work: () => Promise<unknown>) => {
    try {
      setLocalError(undefined);
      await work();
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <Dialog.Root
      open
      onOpenChange={open => {
        if (!open) close();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className='gddy-overlay' />
        <Dialog.Content
          className='gddy-drawer'
          onEscapeKeyDown={event => {
            if (busy) event.preventDefault();
          }}
          onPointerDownOutside={event => event.preventDefault()}
        >
          <header className='gddy-header'>
            <div>
              <Dialog.Title>
                Your cart
                {items > 0 && (
                  <span
                    className='gddy-item-count'
                    aria-label={`${items} ${items === 1 ? 'item' : 'items'}`}
                  >
                    {items}
                  </span>
                )}
              </Dialog.Title>
              <Dialog.Description className='gddy-sr-only'>
                Review your items before checkout.
              </Dialog.Description>
            </div>
            <button
              type='button'
              className='gddy-close'
              disabled={busy}
              onClick={close}
              aria-label='Close cart'
            >
              <svg
                aria-hidden='true'
                width='20'
                height='20'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='1.75'
              >
                <path d='m6 6 12 12M18 6 6 18' />
              </svg>
            </button>
          </header>
          <div className='gddy-body'>
            {(localError || snapshot.error) && (
              <p className='gddy-error' role='alert'>
                {localError || snapshot.error?.message}
              </p>
            )}
            <>
              {snapshot.status === 'loading' && !cart && (
                <p role='status'>Loading your cart…</p>
              )}
              {!cart?.lineItems?.length && snapshot.status !== 'loading' && (
                <div className='gddy-empty'>
                  <h3>Your cart is empty</h3>
                  <p>Add something you like, then come back here.</p>
                  <button type='button' onClick={close}>
                    Continue shopping
                  </button>
                </div>
              )}
              <ul className='gddy-lines'>
                {cart?.lineItems?.map(line => (
                  <li key={line.id}>
                    <ProductImage
                      key={line.details?.productAssetUrl || line.id}
                      src={line.details?.productAssetUrl}
                    />
                    <div className='gddy-line-content'>
                      <div className='gddy-line-heading'>
                        <strong title={line.name ?? undefined}>{line.name}</strong>
                        <span className='gddy-line-price'>
                          {money(line.totals?.subTotal, client.config.locale)}
                        </span>
                      </div>
                      <SelectedOptions details={line.details} />
                      <div className='gddy-line-controls'>
                        <div className='gddy-quantity'>
                          <button
                            type='button'
                            disabled={busy}
                            aria-label={`Decrease quantity for ${line.name}`}
                            onClick={() => {
                              void perform(() =>
                                client.setQuantity(
                                  line.id,
                                  Math.max(0, (line.quantity || 0) - 1)
                                )
                              );
                            }}
                          >
                            <svg
                              aria-hidden='true'
                              width='14'
                              height='14'
                              viewBox='0 0 16 16'
                              fill='none'
                              stroke='currentColor'
                              strokeWidth='1.5'
                            >
                              <path d='M3 8h10' />
                            </svg>
                          </button>
                          <QuantityInput
                            name={line.name}
                            quantity={line.quantity || 0}
                            disabled={busy}
                            onCommit={count =>
                              perform(() => client.setQuantity(line.id, count))
                            }
                          />
                          <button
                            type='button'
                            disabled={busy}
                            aria-label={`Increase quantity for ${line.name}`}
                            onClick={() => {
                              void perform(() =>
                                client.setQuantity(
                                  line.id,
                                  (line.quantity || 0) + 1
                                )
                              );
                            }}
                          >
                            <svg
                              aria-hidden='true'
                              width='14'
                              height='14'
                              viewBox='0 0 16 16'
                              fill='none'
                              stroke='currentColor'
                              strokeWidth='1.5'
                            >
                              <path d='M3 8h10M8 3v10' />
                            </svg>
                          </button>
                        </div>
                        <button
                          type='button'
                          className='gddy-text-button'
                          aria-label={`Remove ${line.name}`}
                          disabled={busy}
                          onClick={() => {
                            void perform(() => client.removeItem(line.id));
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {snapshot.status === 'error' && (
                <button
                  type='button'
                  disabled={busy}
                  onClick={() => {
                    void perform(() => client.refresh());
                  }}
                >
                  Refresh cart
                </button>
              )}
            </>
          </div>
          {Boolean(cart?.lineItems?.length) && (
            <section
              className='gddy-purchase-summary'
              aria-label='Cart summary'
            >
              <dl className='gddy-totals' aria-live='polite' aria-atomic='true'>
                <div>
                  <dt>Subtotal</dt>
                  <dd>{money(cart?.totals?.subTotal, client.config.locale)}</dd>
                </div>
                {Boolean(cart?.totals?.discountTotal?.value) && (
                  <div>
                    <dt>Discount</dt>
                    <dd>
                      −
                      {money(cart?.totals?.discountTotal, client.config.locale)}
                    </dd>
                  </div>
                )}
              </dl>
              <div className='gddy-cart-actions'>
                <p className='gddy-note'>
                  Shipping and taxes are confirmed at checkout.
                </p>
                <button
                  type='button'
                  className='gddy-primary'
                  disabled={busy}
                  onClick={() => {
                    void perform(async () => {
                      const session = await client.checkout();
                      redirectToCheckout(client, session);
                    });
                  }}
                >
                  {busy && <span className='gddy-spinner' aria-hidden='true' />}
                  {busy ? 'Updating…' : 'Continue to checkout'}
                </button>
              </div>
            </section>
          )}
          <footer className='gddy-footer'>
            <svg
              className='gddy-footer-logo'
              viewBox='0 0 38.2 34'
              fill='currentColor'
              aria-hidden='true'
              focusable='false'
            >
              <path d='M32.9368 1.5539C28.9685-.9255 23.7444-.3348 19.085 2.5929 14.4404-.3348 9.213-.9255 5.2496 1.5539c-6.2696 3.918-7.0318 14.0086-1.701 22.539 3.9295 6.2891 10.0745 9.9741 15.5446 9.9062 5.4701.068 11.615-3.6171 15.5445-9.9061 5.3245-8.5305 4.5687-18.621-1.701-22.5391zM6.431 22.2917a20.4336 20.4336 0 01-2.46-5.632 16.1045 16.1045 0 01-.534-5.3098c.238-3.1526 1.5213-5.6077 3.6122-6.9137 2.091-1.306 4.8552-1.3853 7.799-.2169.4418.1764.8788.3804 1.3125.6053a24.0895 24.0895 0 00-4.2272 5.0817c-3.2368 5.1788-4.224 10.9418-3.0943 15.5364a20.911 20.911 0 01-2.4082-3.151zm27.786-5.6335a20.4822 20.4822 0 01-2.46 5.632 21.1004 21.1004 0 01-2.4082 3.1574c1.01-4.1188.3237-9.1649-2.1524-13.897a.6247.6247 0 00-.895-.2428l-7.7196 4.8228a.6312.6312 0 00-.2007.8707l1.1329 1.811a.6295.6295 0 00.869.2006l5.004-3.1267c.1619.4855.3237.971.4451 1.4566.472 1.7257.653 3.518.5357 5.3034-.238 3.151-1.5213 5.606-3.6122 6.9137a7.0593 7.0593 0 01-3.5783 1.0357h-.1601a7.0513 7.0513 0 01-3.5783-1.0357c-2.0926-1.3077-3.376-3.7628-3.6138-6.9137a16.1433 16.1433 0 01.534-5.31 21.0146 21.0146 0 016.4444-10.3138A16.1368 16.1368 0 0123.335 4.216c2.9357-1.1685 5.7047-1.0908 7.7973.2169 2.0926 1.3076 3.3743 3.761 3.6122 6.9137a16.145 16.145 0 01-.5276 5.3115z' />
            </svg>
            <span>Powered by GoDaddy Commerce</span>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** A single overlay is shared by every trigger on the page. */
export function openCart(client: CommerceClient): void {
  if (active) {
    if (active.client !== client)
      throw new Error(
        'Close the current storefront cart before opening another'
      );
    return;
  }
  const previousFocus = document.activeElement;
  const container = document.createElement('div');
  container.dataset.gddyRoot = '';
  document.body.append(container);
  const root = createRoot(container);
  active = { client, container };
  const dismiss = () => {
    queueMicrotask(() => {
      root.unmount();
      container.remove();
      active = undefined;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus();
    });
  };
  root.render(<Drawer client={client} dismiss={dismiss} />);
  void client.ready().catch(() => {
    /* The drawer renders the client's published error. */
  });
}
