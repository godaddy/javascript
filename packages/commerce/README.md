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
    // Existing Commerce checkout settings and public processor configuration.
    checkout: merchantCheckoutSettings,
    payment: merchantPaymentConfiguration,
  };
</script>
<script defer src="https://YOUR_CDN_DOMAIN/v1/commerce.js"></script>

<gddy-add-to-cart sku-id="SKU_RED_SMALL">Add to cart</gddy-add-to-cart>
<gddy-add-to-cart sku-id="SKU_BLUE_LARGE" quantity="2"></gddy-add-to-cart>
<gddy-cart-button></gddy-cart-button>
<gddy-buy-now sku-id="SKU_RED_SMALL">Buy now</gddy-buy-now>
```

The script loads a shared runtime and registers the elements. Cart and checkout UI load on demand. Each open page keeps the release it loaded, including its later lazy imports. Compatible updates reach newly loaded pages through `/v1`; breaking changes require a new major channel. You do not need to update an npm package to receive CDN fixes.

You can instead call `window.GddyCommerce.configureCommerce(config)` after the `gddy:ready` event. Choose one configuration method and configure once per page. Elements added before configuration stay disabled until configuration completes. Listen for `gddy:error` before loading the script to provide a fallback if the CDN is unavailable.

## Elements

| Element | Required attributes | Behavior |
| --- | --- | --- |
| `gddy-add-to-cart` | `sku-id` | Adds the selected catalog SKU; optional positive integer `quantity`, default 1. |
| `gddy-cart-button` | None | Shows the current item count and opens the shared cart drawer. |
| `gddy-buy-now` | `sku-id` | Checks out that SKU directly; optional `quantity`. Preserves the saved cart. |
| `gddy-payment-button` | `reference` | Resolves a standalone payment and opens checkout. Preserves the saved cart. |

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

`checkout` accepts existing checkout session options, including merchant shipping, pickup, tax, promotion, appearance, and navigation settings. Purchase inputs and store/channel IDs are owned by the client. `payment` forwards the existing Checkout component's public `godaddyPaymentsConfig`, `stripeConfig`, `squareConfig`, `paypalConfig`, `mercadoPagoConfig`, or `ccavenueConfig`. Supply the configuration appropriate to the merchant's enabled processor. The library does not provision payment accounts or infer missing merchant settings.

`presentation` defaults to `drawer`. Use `redirect` to open the session's hosted checkout URL when a payment method requires top-level navigation. Return and success URLs default to the current page; override them in `checkout` where appropriate. Hosted/processor redirects do not emit a local completion event or automatically clear the cart on return.

The cart persists only its draft-order ID in local storage, scoped by API host, client, store, and channel. Prices and totals are read from Commerce. Mutations are serialized and refresh server state; browsers with Web Locks also serialize same-origin tabs. Browsers without Web Locks do not have cross-tab write serialization. Storage-denied browsers keep the cart in memory. Cart mutations are never automatically retried after uncertain network failures. Refresh to inspect the authoritative state before retrying a failed action.

Checkout waits for queued cart changes, refreshes the draft, and creates a session from its ID. Repeated identical checkout requests share the in-flight operation; different concurrent purchases are rejected. The cart is locked while checkout is open. Cancellation preserves it. Accepted embedded confirmation retires only the purchased cart reference, leaving a newer cart from another tab intact.

`gddy:checkout-complete` means the confirmation API accepted checkout. It is not evidence that a payment has settled or an order should be fulfilled. Verify payment/order status through your existing backend/webhook workflow. Do not derive fulfillment from browser events or return URL parameters.

## Events and customization

| Event | Target | Detail |
| --- | --- | --- |
| `gddy:ready` | `window` | The CDN runtime is available. |
| `gddy:error` | Trigger, bubbling, or `window` for loader errors | `{ error }` |
| `gddy:cart-change` | Add-to-cart trigger, bubbling | `{ cart }` after a successful addition. Use client subscriptions for all state changes. |
| `gddy:checkout-complete` | `window` | `{ sessionId, orderId, source }`; no credentials. |

Buttons expose `::part(button)` and `::part(status)`. Set `--gddy-color`, `--gddy-on-color`, `--gddy-radius`, and `--gddy-focus` on elements and/or the document. Checkout uses the existing Commerce appearance settings. The drawer contains checkout CSS and portals within its own scope. `locale` controls currency formatting and is forwarded to Checkout; cart labels currently use English.

## Optional npm and React usage

For applications that intentionally bundle and pin the implementation:

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

The React entry wraps the same elements and provides `useCart`. For SSR, render the elements normally and configure in browser bootstrap; call `useCart(client)` with an explicit client if reading state during SSR. Never configure the browser singleton on a server. Do not combine the CDN runtime and bundled npm elements on the same page.

For custom UI, `createCommerce(config)` returns an isolated client with `ready`, `refresh`, `addItem`, `setQuantity`, `removeItem`, `applyDiscount`, `checkout`, `buyNow`, `pay`, `getSnapshot`, `subscribe`, `closeCheckout`, and `dispose`. Setting quantity to zero removes an item. An empty discount string removes the applied code. `checkout`/`buyNow`/`pay` return a session; headless callers own displaying or navigating to it. `completeCheckout` is reserved for an accepted checkout confirmation callback.

## Public library and managed CDN

This OSS repository owns the reusable library, web components, React bindings, types, tests, and integration documentation. It builds the npm package and its stylesheet only.

A separate protected repository owns the managed CDN entry point, loader, bundle build, release manifests, AWS infrastructure, and deployment/promotion/rollback automation. It consumes an explicitly pinned, reviewed version of this library. Publishing or merging here does not deploy the CDN. The CDN URL and browser global/event contract above describe the intended managed integration; its implementation and deployment belong to that protected repository.

Build the public library from the monorepo root with `pnpm --filter @godaddy/commerce... build`, then run `pnpm --filter @godaddy/commerce test` and `pnpm --filter @godaddy/commerce typecheck`. Generated package files and scoped checkout CSS are ignored by git.

See [agent integration instructions](./AGENT-INTEGRATION.md) for the small, consistent contract to use when generating a storefront.
