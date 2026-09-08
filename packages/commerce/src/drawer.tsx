import * as Dialog from '@radix-ui/react-dialog';
import {
  Component,
  lazy,
  type ReactNode,
  Suspense,
  useState,
  useSyncExternalStore,
} from 'react';
import { createRoot } from 'react-dom/client';
import type { CommerceClient } from './client';
import './drawer.css';

const CheckoutView = lazy(() => import('./checkout-view'));
let active: { client: CommerceClient; container: HTMLElement } | undefined;

class CheckoutBoundary extends Component<
  { children: ReactNode },
  { error?: Error }
> {
  state: { error?: Error } = {};
  static getDerivedStateFromError(error: Error): { error: Error } {
    return { error };
  }
  render(): ReactNode {
    return this.state.error ? (
      <p role='alert'>
        Checkout could not load. Close this drawer and try again.
      </p>
    ) : (
      this.props.children
    );
  }
}

function money(
  value:
    | { value?: number | null; currencyCode?: string | null }
    | null
    | undefined,
  locale?: string
): string {
  if (value?.value == null || !value.currencyCode) return '—';
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: value.currencyCode,
  });
  return formatter.format(
    value.value / 10 ** (formatter.resolvedOptions().maximumFractionDigits ?? 2)
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
  const [confirming, setConfirming] = useState(false);
  const [discount, setDiscount] = useState('');
  const [localError, setLocalError] = useState<string>();
  const busy = Boolean(snapshot.pending || confirming);
  const cart = snapshot.cart;
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
  const complete = () => {
    client.completeCheckout();
    setConfirming(false);
    window.dispatchEvent(
      new CustomEvent('gddy:checkout-complete', {
        detail: {
          sessionId: snapshot.checkout?.id,
          orderId: snapshot.checkout?.draftOrder?.id ?? null,
          source: snapshot.checkoutSource,
        },
      })
    );
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
          className={`gddy-drawer${snapshot.checkout ? ' gddy-checkout' : ''}`}
          onEscapeKeyDown={event => {
            if (busy) event.preventDefault();
          }}
          onPointerDownOutside={event => event.preventDefault()}
        >
          <header className='gddy-header'>
            <div>
              <Dialog.Title>
                {snapshot.checkout ? 'Checkout' : 'Your cart'}
              </Dialog.Title>
              <Dialog.Description>
                {snapshot.checkout
                  ? 'Complete your purchase securely.'
                  : 'Review your items before checkout.'}
              </Dialog.Description>
            </div>
            <button
              type='button'
              className='gddy-close'
              disabled={busy}
              onClick={close}
              aria-label='Close cart'
            >
              ×
            </button>
          </header>
          <div className='gddy-body'>
            {(localError || snapshot.error) && (
              <p className='gddy-error' role='alert'>
                {localError || snapshot.error?.message}
              </p>
            )}
            {snapshot.checkoutComplete && (
              <div role='status'>
                <h3>Thanks for your order</h3>
                <p>We’re confirming your payment details.</p>
                <button className='gddy-primary' type='button' onClick={close}>
                  Continue shopping
                </button>
              </div>
            )}
            {!snapshot.checkoutComplete && snapshot.checkout && (
              <CheckoutBoundary>
                <Suspense
                  fallback={<p role='status'>Loading secure checkout…</p>}
                >
                  <CheckoutView
                    client={client}
                    session={snapshot.checkout}
                    onComplete={complete}
                    onConfirmingChange={setConfirming}
                  />
                </Suspense>
              </CheckoutBoundary>
            )}
            {!snapshot.checkoutComplete && !snapshot.checkout && (
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
                      <div className='gddy-line-content'>
                        <strong>{line.name}</strong>
                        <span>
                          {line.details?.selectedOptions
                            ?.map(option => option.values?.join(', '))
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                        <label>
                          Quantity{' '}
                          <input
                            aria-label={`Quantity for ${line.name}`}
                            type='number'
                            min='0'
                            step='1'
                            value={line.quantity || 0}
                            disabled={busy}
                            onChange={event => {
                              const count = event.target.valueAsNumber;
                              if (Number.isSafeInteger(count) && count >= 0)
                                void perform(() =>
                                  client.setQuantity(line.id, count)
                                );
                            }}
                          />
                        </label>
                        <button
                          type='button'
                          className='gddy-text-button'
                          disabled={busy}
                          onClick={() => {
                            void perform(() => client.removeItem(line.id));
                          }}
                        >
                          Remove
                        </button>
                      </div>
                      <strong>
                        {money(line.totals?.subTotal, client.config.locale)}
                      </strong>
                    </li>
                  ))}
                </ul>
                {Boolean(cart?.lineItems?.length) && (
                  <>
                    {client.config.checkout?.enablePromotionCodes && (
                      <form
                        className='gddy-discount'
                        onSubmit={event => {
                          event.preventDefault();
                          void perform(() => client.applyDiscount(discount));
                        }}
                      >
                        <label>
                          Discount code
                          <input
                            value={discount}
                            onChange={event => setDiscount(event.target.value)}
                          />
                        </label>
                        <button disabled={busy} type='submit'>
                          Apply
                        </button>
                      </form>
                    )}
                    <dl className='gddy-totals'>
                      <div>
                        <dt>Subtotal</dt>
                        <dd>
                          {money(cart?.totals?.subTotal, client.config.locale)}
                        </dd>
                      </div>
                      {Boolean(cart?.totals?.discountTotal?.value) && (
                        <div>
                          <dt>Discount</dt>
                          <dd>
                            −
                            {money(
                              cart?.totals?.discountTotal,
                              client.config.locale
                            )}
                          </dd>
                        </div>
                      )}
                    </dl>
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
                          if (client.config.presentation === 'redirect')
                            location.assign(session.url);
                        });
                      }}
                    >
                      {busy ? 'Updating…' : 'Checkout'}
                    </button>
                  </>
                )}
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
            )}
          </div>
          <footer className='gddy-footer'>Powered by GoDaddy Commerce</footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** A single overlay is shared by every trigger on the page. */
export function openCart(client: CommerceClient): void {
  if (
    client.config.presentation === 'redirect' &&
    client.getSnapshot().checkout
  ) {
    location.assign(client.getSnapshot().checkout?.url || '');
    return;
  }
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
