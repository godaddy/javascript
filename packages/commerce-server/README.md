# @godaddy/commerce-server

An opinionated Express router for GoDaddy Commerce catalog, cart, and hosted checkout APIs.

```ts
import express from 'express';
import {
  createCommerceRouter,
  createRuntimeCommerceConfiguration,
} from '@godaddy/commerce-server';

const app = express();
app.use(express.json());
app.use(
  '/api/commerce',
  createCommerceRouter({
    configuration: createRuntimeCommerceConfiguration(),
  }),
);
```

The router keeps OAuth credentials on the server. The default runtime configuration reads platform values from `/local/config.json` with `/alloc/config.json` compatibility and local environment fallbacks. Consumers can supply their own `CommerceConfiguration` implementation.

`createCommerceCatalogRouter()` installs catalog, public configuration, and cart routes. `createGoDaddyPaymentsRouter()` installs checkout and read-only order-status routes without requiring catalog UI. `createCommerceRouter()` installs both by default or accepts explicit feature flags.

Hosted checkout supports an existing `draftOrderId`, a direct `skuId`, or non-catalog `lineItemData`. Checkout flags come from `GODADDY_CHECKOUT_CONFIGURATION`. A return from hosted checkout is not proof of payment, and the order-status route reports `status: 'unknown'` because the current order storefront contract does not expose settled payment status.
