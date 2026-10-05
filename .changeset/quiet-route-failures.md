---
'@godaddy/gd-commerce-server': minor
---

Standardize route error handling. Every failure now responds with `{ error, code, requestId }` and no longer includes internal error text in a `message` field.

Status codes now reflect the cause:

- 502 for Commerce failures, including rejected OAuth credentials (`upstream_unauthorized`); previously 500.
- 503 for missing or unreadable configuration on every route; previously 500 everywhere except `/config`.
- 404 for cart writes against a missing, expired, or completed cart; previously 500.
- 500 only for unexpected errors.

Hosts can pass `logger` and `getRequestId` to the router factories to receive failure detail and reuse their own request ids. In-process helpers throw exported `CommerceError` subclasses. `validateCommerceCartScope` was internal and is replaced by a throwing `assertCommerceCartScope`.

Hosts that read `message` or check for status 500 should switch to `code` and server-side logs.
