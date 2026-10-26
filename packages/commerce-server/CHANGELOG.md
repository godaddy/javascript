# @godaddy/gd-commerce-server

## 0.4.0

### Minor Changes

- 7e94726: The product details route returns each SKU's attribute value names (`attributeValues`), so the storefront can mark option values that are sold out.

## 0.3.0

### Minor Changes

- b39d49d: Return 400 from the order-status route for invalid order IDs, including IDs the Orders API rejects as malformed, and 404 when the Orders API reports the order missing or it belongs to another store or channel, instead of 500. A 404 without the Orders API's `NOT_FOUND` code, such as from a misconfigured base URL, stays a logged 500. The 500 response no longer includes the internal error message; it is logged server-side instead. Export `InvalidOrderIdError`, `OrderNotFoundError`, and `ORDER_STATUS_UNKNOWN` for in-process `getOrderStatus()` callers; check `error.name` rather than `instanceof` so the check holds when a host has more than one copy of this package.
- 9a172d8: Standardize route error handling. Every failure now responds with `{ error, code, requestId }` and no longer includes internal error text in a `message` field.
  
  Status codes now reflect the cause:
  
  - 502 for Commerce failures, including rejected OAuth credentials (`upstream_unauthorized`); previously 500. This includes order-status upstream failures, which were 500. An OAuth 400 is `upstream_unauthorized` only for `invalid_client`, `invalid_grant`, `unauthorized_client`, or `invalid_scope`.
  - 503 for missing or unreadable configuration on every route; previously 500 everywhere except `/config`. Data and checkout routes also return 503 `not_configured` when the host reports a connection state other than `ready`; previously 500.
  - 404 for writes to an existing cart (`/cart/:id/...`) that is missing, expired, or completed; previously 500. Creating a cart and checkout are not classified this way and return 502.
  - 500 only for unexpected errors.
  
  Hosts can pass `logger` and `getRequestId` to the router factories to receive failure detail and reuse their own request ids; a throwing `getRequestId` falls back to a generated id. In-process helpers, including `getOrderStatus()` and `createCheckoutSession()`, throw exported `CommerceError` subclasses, also when a host configuration throws while being read. Check `error.code` rather than `instanceof` or `error.name`; it holds when a host has more than one copy of this package. `validateCommerceCartScope` was internal and is replaced by a throwing `assertCommerceCartScope`.
  
  Hosts that read `message` or check for status 500 should switch to `code` and server-side logs.

## 0.2.0

### Minor Changes

- 2aba6ea: Support storefronts that are not connected to a store yet. `Catalog sampleProducts` shows built-in sample products and a local sample cart only while the server reports `unbound`, and the components switch to the connected store automatically, without source changes. Unknown state, empty live catalogs, and failures never show samples. Add optional `CommerceConfiguration.readConnectionState()` to the server config contract, and reject live operations until the state is `ready`. Existing successful config responses and live cart behavior are unchanged.

## 0.1.1

### Patch Changes

- 8bb3830: Remove the unsupported SKUGroup status selection from product details requests so variant products load through the Commerce API. Return 404 for products excluded by the catalog's ACTIVE filter, and show the storefront's not-found page for those responses.
- c0cf16c: Load active catalog products and SKUs in merchant-defined variant order, while keeping inactive product details visible without purchase controls.
- c0cf16c: Show the draft-order subtotal and explain that shipping, taxes, and discounts are calculated at checkout.

## 0.1.0

### Minor Changes

- 6724278: Add an Express server package for GoDaddy Commerce catalog, cart, and hosted checkout routes, with production API defaults and host-owned configuration and attribution.
  
  Require host-approved checkout return URLs and keep non-catalog pricing in trusted server helpers. Recover saved carts when the Orders API reports a missing or completed draft.
  
  Read completed orders through the authorized Orders REST API with the `commerce.order:read` scope.
