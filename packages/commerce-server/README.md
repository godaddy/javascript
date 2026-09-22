# @godaddy/commerce-server

An opinionated Express router for GoDaddy Commerce catalog, cart, and hosted checkout APIs.

```ts
import express from 'express';
import { createCommerceRouter, createRuntimeCommerceConfiguration } from '@godaddy/commerce-server';

const app = express();
app.use(express.json());
app.use('/api/commerce', createCommerceRouter({
  configuration: createRuntimeCommerceConfiguration(),
  checkoutReturnUrls: {
    returnUrls: ['https://shop.example.com/shop'],
    successUrls: ['https://shop.example.com/checkout/success'],
  },
}));
```

The default configuration reads these **server-only environment variables** on each request:

- `GODADDY_OAUTH_CLIENT_ID` and `GODADDY_OAUTH_CLIENT_SECRET`
- `GODADDY_STORE_ID` and `GODADDY_CHANNEL_ID`
- `GODADDY_CURRENCY_CODE`
- Optional `GODADDY_CHECKOUT_CONFIGURATION`: JSON with boolean `enablePromotionCodes`, `enableTaxCollection`, and `enableShipping` fields. All three default to false when this variable is absent. Optional `shipping` accepts the checkout API's `originAddress` or `fulfillmentLocationId`; omit it to use store configuration.

The API origin defaults to `https://api.godaddy.com`. The package does not load files, provision merchants, or assign application attribution. Hosts own these concerns and any readiness checks or retries before invoking Commerce.

## Host configuration

For an alternate API origin, pass an explicit server-controlled option. It must be an HTTPS origin without credentials, a path, query, or fragment. The host is responsible for trusting the destination, which receives OAuth credentials. Request bodies never select the API origin or attribution.

```ts
const configuration = createRuntimeCommerceConfiguration({
  apiBaseUrl: process.env.COMMERCE_API_ORIGIN, // undefined uses production
  sourceApp: process.env.COMMERCE_SOURCE_APP,
  owner: process.env.COMMERCE_ORDER_OWNER,
});
```

`apiBaseUrl` controls catalog, order, and OAuth requests; checkout uses the corresponding `checkout.commerce.` subdomain. There is no built-in list of alternate environments. `sourceApp` and `owner` are optional host-owned attribution values: checkout uses both, while draft orders use `owner`. Supply values required by your Commerce integration; the package omits them by default.

Hosts with their own configuration service can implement `CommerceConfiguration` directly. `read()` returns `clientId`, `clientSecret`, `storeId`, `channelId`, `currencyCode`, `apiBaseUrl`, and optional attribution. `readCheckout()` returns the checkout flags and optional shipping settings. Return validated, ready-to-use settings from one consistent binding. Both functions run on the server; credentials must never reach browser code.

## Routers and helpers

`createCommerceCatalogRouter(configuration)` installs catalog, public configuration, and cart routes. `createGoDaddyPaymentsRouter(configuration, checkoutReturnUrls)` installs checkout and read-only order-status routes without requiring catalog UI. `createCommerceRouter({ configuration })` installs both by default or accepts explicit feature flags.

The HTTP checkout route accepts an existing `draftOrderId` or a direct `skuId`; Commerce resolves catalog prices. It rejects `lineItemData`. For non-catalog charges such as fixed-price deposits, calculate the amount on the server and call `createCheckoutSession(params, configuration)` directly. Never forward browser-supplied prices to this trusted helper. Server callers can also use `getOrderStatus(orderId, configuration)` without an HTTP loopback.

## Checkout return destinations

Configure `checkoutReturnUrls` on the router using trusted deployment settings. Both lists contain complete absolute HTTPS URLs; scheme, origin, port, path, and configured query parameters must match. Success URLs may add a single `orderId` query parameter. Additional query parameters, fragments, credentials, relative URLs, and unlisted destinations are rejected. Configure separate cancel and success destinations as shown above; do not derive the allowlist from request headers or request bodies.

Without this policy, HTTP checkout returns 503 before creating a session. Invalid request destinations return 400. This applies to both router presets that expose checkout. Trusted in-process callers of `createCheckoutSession()` own their return URLs and must construct or validate them server-side.

A return from hosted checkout is not proof of payment. The order-status route reports `status: 'unknown'` because the current order storefront contract does not expose settled payment status.
