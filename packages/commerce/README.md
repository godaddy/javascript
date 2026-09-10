# GoDaddy Commerce

Managed carts and one-time checkout for any website. Configure once, then use `gddy-*` web components. No public React provider, framework, or consumer package installation is required for the CDN integration.

This package is under development and has not been released. The managed CDN runtime has not been published. Provisioning CDN infrastructure does not make the loader or runtime available. Examples use placeholders; replace the script URL with a published URL supplied by the library operator before using the CDN integration.

## CDN quickstart

Cart operations need only public storefront identifiers. Checkout needs your OAuth client, which stays on your server: configure `createSession` to call a same-origin route that creates the hosted session with your client credentials and returns only the session `id` and `url`. Never expose an OAuth client secret or a Commerce access token to the browser, and never build a route that returns a token to the page. Commerce has no shopper-scoped grant, so any token that can create a session can also act on the merchant's orders.

```html
<script>
  window.gddyCommerceConfig = {
    clientId: 'YOUR_CLIENT_ID',
    storeId: 'YOUR_STORE_ID',
    channelId: 'YOUR_CHANNEL_ID',
    // Your server creates the session with its OAuth client credentials and
    // returns { id, url }. It owns store, channel, settings, and pricing.
    createSession: async input => {
      const response = await fetch('/api/commerce/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Checkout is unavailable');
      return response.json();
    },
  };
</script>
<script defer src="https://YOUR_CDN_DOMAIN/v1/commerce.js"></script>

<gddy-add-to-cart sku-id="SKU_RED_SMALL">Add to cart</gddy-add-to-cart>
<gddy-add-to-cart sku-id="SKU_BLUE_LARGE" quantity="2"></gddy-add-to-cart>
<gddy-cart-button></gddy-cart-button>
<gddy-buy-now sku-id="SKU_RED_SMALL">Buy now</gddy-buy-now>
```

The script loads a shared runtime and registers the elements. The cart drawer loads on demand; payment takes place on hosted checkout. Each open page keeps the release it loaded, including its later lazy imports. Compatible updates reach newly loaded pages through `/v1`; breaking changes require a new major channel. You do not need to update an npm package to receive CDN fixes.

You can instead call `window.GddyCommerce.configureCommerce(config)` after the `gddy:ready` event. Choose one configuration method and configure once per page. Elements added before configuration stay disabled until configuration completes. Listen for `gddy:error` before loading the script to provide a fallback if the CDN is unavailable.

## Elements

| Element | Required attributes | Behavior |
| --- | --- | --- |
| `gddy-add-to-cart` | `sku-id` | Adds the selected catalog SKU; optional positive integer `quantity`, default 1. |
| `gddy-cart-button` | None | Opens the shared cart drawer; shows the item count in `::part(count)` when the cart has items. Stays enabled while the cart updates. |
| `gddy-buy-now` | `sku-id` | Redirects to hosted checkout for that SKU; optional `quantity`. Preserves the saved cart. |
| `gddy-payment-button` | `reference` | Resolves a standalone payment and redirects to hosted checkout. Preserves the saved cart. |

All elements accept `disabled` and text content for their button label. `disabled` is a boolean HTML attribute: remove it to enable the button. Use SKU IDs for selected variants, not parent product IDs. One configured storefront is supported per page. The headless factory supports independent clients.

## Standalone charges

An application reference can represent a deposit, invoice, or other one-time charge:

```html
<gddy-payment-button reference="INVOICE_REFERENCE">Pay invoice</gddy-payment-button>
```

With `createSession`, the request your server receives carries `reference` and no `lineItems`. Look the reference up in your own data, build a single `lineItems` entry with `lineItemData: { name, priceData: { unitAmount, currencyCode } }`, and create the session. Amounts use integer currency minor units, such as `2500` for USD 25.00. The browser never supplies a price, so the server is the price authorization boundary; reconcile the payment to the invoice through your trusted order workflow.

Only the browser-token path (`getAccessToken`) needs a browser `resolvePayment` callback, and even then it is not an authorization boundary because the shopper can call Commerce with the same token.

## Configuration and behavior

`clientId`, `storeId`, and `channelId` are required. `apiHost` optionally selects an existing Commerce API hostname, without a scheme or path. Cart-only usage needs no credentials. Checkout uses `createSession(input)`: it receives the complete session request (`storeId`, `channelId`, `draftOrderId` or `lineItems`, `returnUrl`, `successUrl`, your `checkout` settings, and `reference` for standalone payments) and creates the session on your server, so no Commerce token reaches the browser. Treat every field as untrusted input, take store, channel, settings, and prices from server configuration, and return the session Commerce created, at least its `id` and `url`. The client rejects a returned session whose store or channel differs from its configuration.

`getAccessToken` is an advanced alternative that has the browser call Commerce with a token from your callback. Because that token can act on the merchant's orders, the client refuses it unless `dangerouslyAllowBrowserToken: true` is also set, and it is ignored whenever `createSession` is configured. Use it only with a short-lived token that can do nothing but create checkout sessions.

`checkout` accepts existing checkout session options, including merchant shipping, pickup, tax, promotion, appearance, and navigation settings. Purchase inputs and store/channel IDs are owned by the client. Processor configuration and payment collection belong to hosted checkout; this library does not provision payment accounts or collect payment details.

Cart checkout, Buy now, and standalone payment buttons always navigate in the current tab to the session URL returned by Commerce. There is no inline checkout or presentation switch. Return and success URLs default to the current page; override them in `checkout` where appropriate. Relative overrides resolve against the current page, and only HTTP(S) URLs are accepted (`INVALID_URL`). Commerce rejects `localhost` return and success URLs, so local development must override both with public URLs; see `examples/commerce-elements`. Redirecting does not emit a local completion event or clear the cart on return.

The cart persists only its draft-order ID in local storage, scoped by API host, client, store, and channel. Prices and totals are read from Commerce. `ready()` reads the saved cart once, without locking; every element and `useCart` call shares that read. If Commerce no longer knows the saved order (a null result or a not-found error), the saved ID is released and the cart starts empty. Mutations are serialized and re-read the cart before writing; browsers with Web Locks also serialize same-origin tabs. Browsers without Web Locks do not have cross-tab write serialization. Storage-denied browsers keep the cart in memory. Cart mutations are never automatically retried after uncertain network failures. Refresh to inspect the authoritative state before retrying a failed action.

Typed quantity edits are submitted on blur or Enter. The field keeps its typed value while the mutation is pending, then resumes showing the server quantity. Empty or invalid edits revert without a request; entering zero removes the item.

The first `gddy-add-to-cart` click creates an empty draft order internally, then calls `addLineItemBySkuId` with that draft ID, the selected SKU ID, and quantity. This two-call flow lets Commerce resolve catalog pricing; inline draft creation requires caller-supplied line-item amounts. The component saves the draft ID immediately and refetches the cart after adding the item. Later additions reuse that draft; adding the same SKU increases its quantity. Adopting applications do not create a separate draft or maintain a second cart.

Checkout resolves the OAuth token first, then waits for queued cart changes, refreshes the draft, and creates a session from its ID. The cart lock is held only for the refresh and session creation, so a slow token callback does not block other tabs. Repeated identical checkout requests share the in-flight operation; different concurrent purchases are rejected. The managed buttons release the transient session state when handing off, so a failed navigation or browser Back does not leave controls locked. The saved cart is preserved.

Verify payment/order status through your existing backend/webhook workflow before fulfillment. Do not derive payment success from navigation or return URL parameters.

## Events and customization

| Event | Target | Detail |
| --- | --- | --- |
| `gddy:ready` | `window` | The CDN runtime is available. |
| `gddy:error` | Trigger, bubbling, or `window` for loader errors | `{ error }` |
| `gddy:cart-change` | Add-to-cart trigger, bubbling | `{ cart }` after a successful addition. Use client subscriptions for all state changes. |

Hosted checkout uses the existing Commerce appearance settings. `locale` controls cart currency formatting; cart labels currently use English. See Styling below for the buttons and drawer.

## Styling

The buttons render in shadow DOM and the drawer renders in light DOM, but both read the same CSS custom properties. Set them on `:root`, on an ancestor, or on an individual element; nothing in the package redefines them, so a host page's values always win.

| Variable | Default | Applies to |
| --- | --- | --- |
| `--gddy-color` | `#303036` | button fill and border, drawer primary action |
| `--gddy-on-color` | `#fff` | text on `--gddy-color` |
| `--gddy-radius` | `10px` buttons, `6px` drawer controls | corner radius |
| `--gddy-focus` | `#51515b` | focus-visible outline |
| `--gddy-error` / `--gddy-error-surface` | `#a31919` / `#fff0f0` | button status text, drawer alert |
| `--gddy-font` | inherit (buttons), system stack (drawer) | font family |
| `--gddy-surface` / `--gddy-text` | `#fff` / `#252529` | drawer background and text |
| `--gddy-subtle` | `#ededf0` | drawer hover fills, badges, image placeholder |
| `--gddy-border` / `--gddy-muted` | `#e6e6e8` / `#68686f` | drawer borders, secondary text |
| `--gddy-gutter` | `16px` | drawer horizontal padding (header, body, summary, footer) |
| `--gddy-color-scheme` | `light` | drawer form-control color scheme |
| `--gddy-button-background` / `--gddy-button-border` / `--gddy-button-shadow` | subtle gradient, 1px border, soft shadow | button chrome |
| `--gddy-button-padding` / `--gddy-button-min-height` / `--gddy-button-weight` | `.7em 1.1em` / `48px` / `400` | button size and weight |
| `--gddy-hover-brightness` / `--gddy-active-brightness` | `1.08` / `.96` | built-in hover and press feedback (`1` disables) |
| `--gddy-badge-background` / `--gddy-badge-color` | `--gddy-on-color` / `--gddy-color` | cart button count |

Add the `flat` attribute to any button (`<gddy-add-to-cart flat>`) for a solid fill with no gradient, shadow, or contrasting border. For anything else, target the parts from page CSS: `::part(button)`, `::part(label)`, `::part(count)` on the cart button, `::part(spinner)`, and `::part(status)`. Slotted text or markup replaces the default label.

While a button's own action runs it carries a `busy` attribute, its label hides, and a ring in `::part(spinner)` takes its place, so the button keeps its size. `gddy-buy-now` and `gddy-payment-button` stay busy after a successful redirect until the page unloads. The other buttons only disable while the cart updates; they do not spin for work they did not start. Set `--gddy-hover-brightness` and friends as usual; the ring inherits the label colour.

A host design system maps its own tokens onto these once, and every element then follows the host theme, including dark mode. For a shadcn-style token set:

```css
:root {
  --gddy-color: hsl(var(--primary));
  --gddy-on-color: hsl(var(--primary-foreground));
  --gddy-radius: var(--radius);
  --gddy-focus: hsl(var(--ring));
  --gddy-error: hsl(var(--destructive));
  --gddy-font: var(--font-sans);
  --gddy-surface: hsl(var(--background));
  --gddy-text: hsl(var(--foreground));
  --gddy-subtle: hsl(var(--muted));
  --gddy-border: hsl(var(--border));
  --gddy-muted: hsl(var(--muted-foreground));
  --gddy-button-shadow: none;
  --gddy-button-background: var(--gddy-color);
  --gddy-button-weight: 500;
  --gddy-button-min-height: 2.5rem;
  --gddy-button-padding: .5rem 1rem;
}
.dark { --gddy-color-scheme: dark; }
```

## Optional npm and React usage

For applications that intentionally bundle and pin the implementation, React and React DOM 18 or 19 are required peers. Use the same React major version for both; the library uses the host application's React instance. Development and tests use React 19. The managed CDN bundles its own runtime and does not require consumers to install these npm peers.

```tsx
import { configureCommerce } from '@godaddy/commerce';
import { AddToCartButton, CartButton } from '@godaddy/commerce/react';
import '@godaddy/commerce/styles.css';

// Run once during browser initialization, outside rendering.
configureCommerce(config);

function Product() {
  return <><AddToCartButton skuId="SKU_ID" /><CartButton /></>;
}
```

The React entry wraps the same elements and provides `useCart`, which returns the snapshot (`cart`, `status`, `pending`, `error`, `checkout`) plus stable actions: `addItem`, `setQuantity`, `removeItem`, `applyDiscount`, `startCheckout`, `buyNow`, `pay`, `refresh`, `closeCheckout`, and the `client`. The wrappers translate `disabled` and `className` into attributes, so they behave the same on React 18 and 19. For SSR, render the elements normally and configure in browser bootstrap; call `useCart(client)` with an explicit client if reading state during SSR. Never configure the browser singleton on a server. Do not combine the CDN runtime and bundled npm elements on the same page.

For custom UI, `createCommerce(config)` returns an isolated client with `ready`, `refresh`, `addItem`, `setQuantity`, `removeItem`, `applyDiscount`, `checkout`, `buyNow`, `pay`, `getSnapshot`, `subscribe`, `closeCheckout`, and `dispose`; `itemCount(cart)` sums line quantities. The snapshot's `status` is derived from `pending` and `error`. Setting quantity to zero removes an item. An empty discount string removes the applied code. `checkout`/`buyNow`/`pay` return a session; headless callers navigate to `session.url` and call `closeCheckout()` to release transient session state without clearing the cart.

## Public library and managed CDN

This repository owns the library, the elements, the React bindings, the docs, and the source of the managed CDN runtime. `pnpm --filter @godaddy/commerce build` produces the npm package. `pnpm --filter @godaddy/commerce build:cdn` produces `cdn/`, a self-contained browser build that is never published to npm:

| File | Cache life | Purpose |
| --- | --- | --- |
| `commerce.js` | 5 minutes | The `/v1/commerce.js` loader, a few hundred bytes of classic script that imports the current runtime chunk relative to its own URL. Include it with `<script defer src>`, not `type="module"`. If the import fails it dispatches `gddy:error` on `window`. |
| `chunks/runtime-*.js` | 1 year, immutable | The runtime. Registers the elements, exposes `window.GddyCommerce` (the library plus `release.version` and `release.commit`), applies `window.gddyCommerceConfig`, links the stylesheet, and fires `gddy:ready` with `{ release }`. |
| `chunks/*` | 1 year, immutable | The other content-hashed pieces: the drawer with its own React, the redirect helper, and the stylesheet. |
| `manifest.json` | 5 minutes | Version, commit, build time, and file list of the release currently served. |

The protected checkout repository deploys it. Its workflow checks out this repository at a chosen git ref, runs `build:cdn`, uploads `chunks/` without deleting earlier chunks, then uploads the entry and manifest and invalidates those two paths. The entry has a short cache life and every chunk it references is immutable, so a page that has already loaded keeps its release, new page loads pick up the new build within minutes, and rolling back means uploading an earlier entry again. Merging here changes nothing on the CDN until that workflow runs, and a CDN update needs no npm release.

For a local run, `pnpm --filter @godaddy/commerce cdn:serve` serves `cdn/` at `http://localhost:5181/v1/` with the production cache and CORS headers, and `examples/commerce-elements/cdn.html` loads it from a plain script tag.

See [agent integration instructions](./AGENT-INTEGRATION.md) for the small, consistent contract to use when generating a storefront.
