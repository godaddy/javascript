# @godaddy/commerce-server

An opinionated Express router for GoDaddy Commerce catalog, cart, and hosted checkout APIs.

```ts
import express from 'express';
import { createCommerceRouter, createRuntimeCommerceConfiguration } from '@godaddy/commerce-server';

const app = express();
app.use(express.json());
app.use('/api/commerce', createCommerceRouter({
  configuration: createRuntimeCommerceConfiguration(),
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

`createCommerceCatalogRouter(configuration)` installs catalog, public configuration, and cart routes. `createGoDaddyPaymentsRouter(configuration)` installs checkout and read-only order-status routes without requiring catalog UI. `createCommerceRouter({ configuration })` installs both by default or accepts explicit feature flags.

Hosted checkout supports an existing `draftOrderId`, a direct `skuId`, or non-catalog `lineItemData`. Server callers can use `createCheckoutSession(params, configuration)` and `getOrderStatus(orderId, configuration)` without an HTTP loopback.

A return from hosted checkout is not proof of payment. The order-status route reports `status: 'unknown'` because the current order storefront contract does not expose settled payment status.
