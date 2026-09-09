# GoDaddy Commerce

Managed carts and one-time checkout for any website. Configure once, then use `gddy-*` web components. No public React provider, framework, or consumer package installation is required for the CDN integration.

This package is under development and has not been released. The managed CDN runtime has not been published. Provisioning CDN infrastructure does not make the loader or runtime available. Examples use placeholders; replace the script URL with a published URL supplied by the library operator before using the CDN integration.

## CDN quickstart

Use your existing OAuth client and merchant configuration. The token callback must return a token authorized to create checkout sessions for this store. A client ID identifies an application; it does not replace the checkout API's OAuth authorization. Never expose an OAuth client secret or an unrestricted merchant token in a storefront.

```html
<script>
  window.gddyCommerceConfig = {
    clientId: 'YOUR_CLIENT_ID',
    storeId: 'YOUR_STORE_ID',
    channelId: 'YOUR_CHANNEL_ID',
    // oauthClient is your application's existing OAuth integration.
    // Replace this adapter with the actual method exposed by your OAuth client.
    getAccessToken: () => oauthClient.getAccessToken(),
    // Existing Commerce hosted checkout settings.
    checkout: merchantCheckoutSettings,
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

An application reference can represent a deposit, invoice, or other one-time charge. Configure a resolver using your application's existing data source:

```js
window.gddyCommerceConfig.resolvePayment = async reference => {
  const response = await fetch(`/api/invoices/${encodeURIComponent(reference)}`);
  if (!response.ok) throw new Error('Invoice unavailable');
  const invoice = await response.json();
  return {
    name: invoice.description,
    unitAmount: invoice.amountDue,
    currencyCode: invoice.currencyCode,
    quantity: 1,
  };
};
```

```html
<gddy-payment-button reference="INVOICE_REFERENCE">Pay invoice</gddy-payment-button>
```

Configure the resolver before the CDN script loads. Amounts use integer currency minor units, such as `2500` for USD 25.00. The library creates an existing Commerce checkout session using `lineItemData`; it does not invent an invoice API or a new payment-request resource. The example `/api/invoices/` endpoint belongs to the adopting application. A browser resolver is not a price authorization boundary: fixed invoice amounts and payment-to-invoice reconciliation must be enforced by the application's trusted payment workflow.

## Configuration and behavior

`clientId`, `storeId`, and `channelId` are required. `apiHost` optionally selects an existing Commerce API hostname, without a scheme or path. Cart-only usage does not require `getAccessToken`; checkout does. The callback is invoked when creating a session, allowing the existing OAuth client to refresh credentials.

`checkout` accepts existing checkout session options, including merchant shipping, pickup, tax, promotion, appearance, and navigation settings. Purchase inputs and store/channel IDs are owned by the client. Processor configuration and payment collection belong to hosted checkout; this library does not provision payment accounts or collect payment details.

Cart checkout, Buy now, and standalone payment buttons always navigate in the current tab to the session URL returned by Commerce. There is no inline checkout or presentation switch. Return and success URLs default to the current page; override them in `checkout` where appropriate. Relative overrides resolve against the current page, and only HTTP(S) URLs are accepted (`INVALID_URL`). Redirecting does not emit a local completion event or clear the cart on return.

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

Buttons expose `::part(button)`, `::part(status)`, and, on the cart button, `::part(count)`. Set `--gddy-color`, `--gddy-on-color`, `--gddy-radius`, and `--gddy-focus` on elements and/or the document. Hosted checkout uses the existing Commerce appearance settings. `locale` controls cart currency formatting; cart labels currently use English.

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

This OSS repository owns the reusable library, web components, React bindings, types, tests, and integration documentation. It builds the npm package and its stylesheet only.

A separate protected repository owns the managed CDN entry point, loader, bundle build, release manifests, AWS infrastructure, and deployment/promotion/rollback automation. It consumes an explicitly pinned, reviewed version of this library. Publishing or merging here does not deploy the CDN. The CDN URL and browser global/event contract above describe the intended managed integration; its implementation and deployment belong to that protected repository.

Build the public library from the monorepo root with `pnpm --filter @godaddy/commerce... build`, then run `pnpm --filter @godaddy/commerce test` and `pnpm --filter @godaddy/commerce typecheck`. Generated package files are ignored by git.

See [agent integration instructions](./AGENT-INTEGRATION.md) for the small, consistent contract to use when generating a storefront.
