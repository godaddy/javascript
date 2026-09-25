# Server API contract

The browser calls JSON endpoints under `/api/commerce` on its own origin. The consuming application provides these routes. This browser package contains no server credentials, platform configuration reader, merchant provisioning, or GraphQL transport. Express applications can use the companion `@godaddy/commerce-server` package; other hosts can implement this contract directly.

Server implementations can use GoDaddy Commerce APIs or their existing integration, but must return these shapes and enforce the same purchase rules. Returning a similar-looking GraphQL mutation result is insufficient: cart mutations return a complete refreshed cart.

## Requests and failures

- Requests use same-origin browser credentials. JSON writes set `Content-Type: application/json`.
- Cart, catalog and checkout requests include `X-Commerce-Scope` from `/config`. Validate that scope against the server's current store/channel binding, especially before writes. Treat it as a stale-binding guard, not authorization. Authenticate and authorize requests independently.
- Read requests use `cache: no-store`, cancellation, and a 15-second timeout. The initial cart creation/add request is also a write and is never retried automatically.
- Return a non-2xx response with `{ "error": "A useful customer-facing message" }` for failure. HTML error pages are also handled as failures.
- Only cart reads with HTTP 404 or 410 clear an expired saved cart. Network errors, 401/403/409/5xx, and other failures preserve the ID and block writes until hydration succeeds.
- Resolve prices and availability on the server. The cart does not calculate shipping, taxes, or discounts; it explains that they are calculated at checkout. Browser SKU names and quantities are input, not pricing authority. Protect mutations against CSRF as appropriate for the host application's authentication.

## Endpoints

| Method and path | Input | Successful JSON response |
| --- | --- | --- |
| `GET /config` | None | `{ cartScope, currencyCode }` |
| `GET /products?first=6&after=<cursor>` | Optional opaque cursor | `{ skuGroups: Connection<SKUGroup> }` |
| `GET /products/:id` | URI-encoded product ID | `{ skuGroup: SKUGroup \| null }` |
| `GET /products/:id?attributeValues=blue&attributeValues=large` | Repeated selected attribute **names**, not IDs | `{ skuGroup: SKUGroup \| null }` with matching SKU connection |
| `GET /cart/:id` | URI-encoded cart ID | `{ cart: CartOrder \| null }` |
| `POST /cart` | `{ lineItems: [{ skuId, name, quantity }] }` | `{ cart: CartOrder }` |
| `POST /cart/:id/items` | `{ skuId, name, quantity }` | `{ cart: CartOrder }` |
| `PATCH /cart/:id/items/:itemId` | `{ quantity }` | `{ cart: CartOrder }` |
| `DELETE /cart/:id/items/:itemId` | No body | `{ cart: CartOrder }` |
| `POST /cart/:id/discounts` | `{ discountCodes: string[] }` | `{ cart: CartOrder }` |
| `POST /checkout` | `{ draftOrderId, returnUrl, successUrl }` | `{ url: string }` |

`/checkout` is required only when checkout is enabled. `/discounts` is needed if the host uses `applyDiscount`. The standard catalog/detail/cart flow uses the other routes. All product/cart IDs in request paths are encoded.

## Configuration

`cartScope` is a nonempty opaque identifier for the effective store/channel/currency binding. It is not a secret. Rotate it when that binding changes so a saved cart cannot cross stores or currencies. `currencyCode` is a three-letter uppercase ISO 4217 code, for example `USD`. Money integers use that currency's smallest unit: USD 1234 is $12.34; JPY 1234 is ¥1,234. The cart shows the draft-order subtotal and the message “Shipping, taxes, and discounts are calculated at checkout.” The message has the stable `commerce-cart-checkout-adjustments-note` class so a host can hide it without changing the component.

The browser rechecks configuration on window focus when stale. Return current server configuration rather than a browser-selected store. Persisted IDs use the package-specific key documented in the README; migration from another application's storage keys belongs to that application's integration.

## Product responses

Exported `SKUGroup`, `SKU`, `Connection`, `SkuGroupsResult` and `SkuGroupResult` describe the public response types. Connections use `{ edges: [{ node }], totalCount?, pageInfo? }`.

#### Example simple product

```json
{
  "skuGroup": {
    "id": "mug",
    "label": "Studio mug",
    "description": "A ceramic mug.",
    "priceRange": { "min": 2400, "max": 2400 },
    "mediaObjects": { "edges": [{ "node": { "type": "IMAGE", "url": "/mug.jpg" } }] },
    "skus": {
      "totalCount": 1,
      "pageInfo": { "hasNextPage": false },
      "edges": [{ "node": {
        "id": "mug-blue",
        "prices": { "edges": [{ "node": { "value": { "value": 2400, "currencyCode": "USD" } } }] },
        "inventoryCounts": { "edges": [{ "node": { "type": "AVAILABLE", "quantity": 8 } }] }
      } }]
    }
  }
}
```

For options, return `attributes.edges[].node` with `name`, `label`, and `values.edges[].node` containing `name` and `label`. For example, the attribute `color` has values named `blue` and `clay`. The browser sends those value names as repeated `attributeValues` parameters. Return the group with a SKU connection filtered to that exact combination. Zero or multiple results cannot be purchased. Include accurate `totalCount` and `hasNextPage`; a truncated one-item result must never look like a complete match.

Products without attribute definitions can offer explicit SKU selection only when all SKUs are returned with unique IDs and unique nonempty labels/names. Ambiguous or incomplete collections cannot be purchased. No inventory records means untracked inventory; records without an `AVAILABLE` quantity mean unavailable. Supply appropriate records for physical inventory.

## Cart responses

A cart is a draft order. Return its `id`, complete `lineItems`, and authoritative `totals` after every mutation. Cart line items have their own `id`, separate from `skuId`. A new-cart/add response must include at least one line item. Update/delete/discount responses must retain the cart ID, even when deletion leaves the cart empty.

#### Example cart

```json
{
  "cart": {
    "id": "draft-123",
    "lineItems": [{
      "id": "line-456", "skuId": "mug-blue", "name": "Studio mug", "quantity": 2,
      "totals": { "subTotal": { "value": 4800, "currencyCode": "USD" } }
    }],
    "totals": {
      "subTotal": { "value": 4800, "currencyCode": "USD" },
      "total": { "value": 4800, "currencyCode": "USD" }
    }
  }
}
```

Optional totals include `shippingTotal`, `taxTotal`, and `discountTotal`. Optional line details include `productAssetUrl` and `selectedOptions: [{ attribute, values: string[] }]`. The drawer shows supplied totals; it does not calculate authoritative prices from catalog values. A missing total disables checkout.

## Checkout boundary

The client refreshes the cart before checkout and sends its ID, an absolute catalog `returnUrl`, and an absolute `successUrl` with `orderId` appended. The server must verify the cart's binding, contents, merchant readiness, and allowed return origins/paths before creating a session. Return an HTTPS checkout URL. The client rejects missing or non-HTTPS URLs and performs a browser navigation to the returned URL.

When using `@godaddy/commerce-server`, configure the router's `checkoutReturnUrls.returnUrls` with the absolute catalog return URL and `checkoutReturnUrls.successUrls` with the absolute success-page URL. The package matches these exact destinations and permits an additional `orderId` parameter on success URLs. Missing policy disables HTTP checkout. Public HTTP requests accept only cart or SKU checkout; non-catalog amounts belong in a trusted server handler.

Do not treat `checkoutSuccessPath`, a client-provided URL, the redirect itself, or a draft-order response as proof that payment succeeded. Verify payment using the checkout/payment service or trusted webhook state. Expire or reject paid/closed drafts on subsequent cart reads so returning customers cannot reuse a completed cart.
