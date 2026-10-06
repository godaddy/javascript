---
'@godaddy/gd-commerce-server': minor
---

Standardize route error handling. Every failure now responds with `{ error, code, requestId }` and no longer includes internal error text in a `message` field.

Status codes now reflect the cause:

- 502 for Commerce failures, including rejected OAuth credentials (`upstream_unauthorized`); previously 500. This includes order-status upstream failures, which were 500. An OAuth 400 is `upstream_unauthorized` only for `invalid_client`, `invalid_grant`, `unauthorized_client`, or `invalid_scope`.
- 503 for missing or unreadable configuration on every route; previously 500 everywhere except `/config`.
- 404 for writes to an existing cart (`/cart/:id/...`) that is missing, expired, or completed; previously 500. Creating a cart and checkout are not classified this way and return 502.
- 500 only for unexpected errors.

Hosts can pass `logger` and `getRequestId` to the router factories to receive failure detail and reuse their own request ids; a throwing `getRequestId` falls back to a generated id. In-process helpers, including `getOrderStatus()` and `createCheckoutSession()`, throw exported `CommerceError` subclasses, also when a host configuration throws while being read. Check `error.code` rather than `instanceof` or `error.name`; it holds when a host has more than one copy of this package. `validateCommerceCartScope` was internal and is replaced by a throwing `assertCommerceCartScope`.

Hosts that read `message` or check for status 500 should switch to `code` and server-side logs.
