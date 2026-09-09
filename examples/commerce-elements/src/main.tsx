import {
  type CommerceClient,
  type CommerceConfig,
  configureCommerce,
  itemCount,
} from '@godaddy/commerce';
import {
  AddToCartButton,
  BuyNowButton,
  CartButton,
  useCart,
} from '@godaddy/commerce/react';
import '@godaddy/commerce/styles.css';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const env = import.meta.env;
const apiHost = (env.VITE_GODADDY_API_HOST || 'api.godaddy.com').replace(
  /^https?:\/\//,
  ''
);

/** `id|label` pairs, comma separated. */
const products: { id: string; label: string }[] = String(
  env.VITE_COMMERCE_DEMO_SKUS || ''
)
  .split(',')
  .map((entry: string) => entry.trim())
  .filter(Boolean)
  .map((entry: string) => {
    const [id, label] = entry.split('|');
    return { id, label: label || id };
  });

const checkout: CommerceConfig['checkout'] = {
  storeName: env.VITE_GODADDY_STORE_NAME || undefined,
  enableBillingAddressCollection: true,
  enableShippingAddressCollection: false,
  enableShipping: false,
  enableLocalPickup: false,
  enablePhoneCollection: false,
  enableTaxCollection: false,
  enablePaymentMethodCollection: true,
  enablePromotionCodes: true,
  paymentMethods: {
    card: { processor: 'godaddy', checkoutTypes: ['standard'] },
  },
  ...(env.VITE_COMMERCE_RETURN_URL && { returnUrl: env.VITE_COMMERCE_RETURN_URL }),
  ...(env.VITE_COMMERCE_SUCCESS_URL && {
    successUrl: env.VITE_COMMERCE_SUCCESS_URL,
  }),
  ...(env.VITE_COMMERCE_GOPAY_APP_ID && {
    experimental_rules: {
      gopay_override: { enabled: true, goPayAppId: env.VITE_COMMERCE_GOPAY_APP_ID },
    },
  }),
};

const client = configureCommerce({
  clientId: env.VITE_GODADDY_CLIENT_ID,
  storeId: env.VITE_GODADDY_STORE_ID,
  channelId: env.VITE_GODADDY_CHANNEL_ID,
  apiHost,
  locale: 'en-US',
  getAccessToken: async () => {
    const response = await fetch('/api/commerce-token', { method: 'POST' });
    const json = (await response.json()) as {
      accessToken?: string;
      error?: string;
    };
    if (!response.ok || !json.accessToken)
      throw new Error(json.error || 'Token endpoint failed');
    return json.accessToken;
  },
  checkout,
});
// Handy for driving the client from the browser console.
(window as Window & { gddy?: CommerceClient }).gddy = client;

function useElementErrors() {
  const [errors, setErrors] = useState<string[]>([]);
  useEffect(() => {
    const onError = (event: Event) => {
      const { error } = (event as CustomEvent<{ error: unknown }>).detail;
      const message = error instanceof Error ? error.message : String(error);
      setErrors(list => [...list.slice(-4), message]);
    };
    document.addEventListener('gddy:error', onError);
    return () => document.removeEventListener('gddy:error', onError);
  }, []);
  return errors;
}

function App() {
  const cart = useCart();
  const errors = useElementErrors();
  return (
    <main className='page'>
      <header className='bar'>
        <div>
          <h1>Commerce elements</h1>
          <p className='muted'>
            {apiHost} · store {env.VITE_GODADDY_STORE_ID?.slice(0, 8)}…
          </p>
        </div>
        <CartButton className='cart'>Basket</CartButton>
      </header>

      <section className='grid' aria-label='Products'>
        {products.length === 0 && (
          <p className='muted'>
            Set <code>VITE_COMMERCE_DEMO_SKUS</code> in <code>.env.local</code>.
          </p>
        )}
        {products.map(product => (
          <article className='card' key={product.id}>
            <h2>{product.label}</h2>
            <p className='muted mono'>{product.id}</p>
            <div className='actions'>
              <AddToCartButton skuId={product.id}>Add to cart</AddToCartButton>
              <BuyNowButton skuId={product.id} className='ghost'>
                Buy now
              </BuyNowButton>
            </div>
          </article>
        ))}
      </section>

      <section className='debug' aria-label='Client state'>
        <h2>useCart()</h2>
        <dl>
          <dt>status</dt>
          <dd data-testid='status'>{cart.status}</dd>
          <dt>pending</dt>
          <dd data-testid='pending'>{cart.pending}</dd>
          <dt>items</dt>
          <dd data-testid='items'>{itemCount(cart.cart)}</dd>
          <dt>cart id</dt>
          <dd className='mono' data-testid='cart-id'>
            {cart.cart?.id ?? '—'}
          </dd>
          <dt>subtotal</dt>
          <dd data-testid='subtotal'>
            {cart.cart?.totals?.subTotal
              ? `${cart.cart.totals.subTotal.value} ${cart.cart.totals.subTotal.currencyCode}`
              : '—'}
          </dd>
          <dt>error</dt>
          <dd data-testid='error'>{cart.error?.message ?? '—'}</dd>
          <dt>checkout</dt>
          <dd className='mono'>{cart.checkout?.url ?? '—'}</dd>
        </dl>
        {errors.length > 0 && (
          <ul className='errors' aria-label='Element errors'>
            {errors.map((message, index) => (
              <li key={`${index}-${message}`}>{message}</li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
