# Integration contract for coding agents

1. Choose either CDN (default) or bundled npm, never both. For CDN, use a published `/v1/commerce.js` URL supplied by the library operator and verify the loader is available. Infrastructure deployment alone does not publish the runtime. The README placeholders are not working URLs; do not invent a hostname. For npm, use a released package version.
2. Configure once in browser bootstrap with the actual client ID, store ID, channel ID, merchant checkout settings, public processor settings, and a callback into the application's existing OAuth client. Never invent keys, OAuth methods, credentials, API endpoints, or merchant settings.
3. Use `gddy-add-to-cart` with a selected catalog **SKU ID** and integer quantity. Put one `gddy-cart-button` in the navigation. All product buttons share the same cart automatically.
4. Use `gddy-buy-now` for a direct SKU purchase. Use `gddy-payment-button reference="..."` only after configuring `resolvePayment` for the adopting application's standalone charge data.
5. Let the library own cart persistence, totals, mutations, checkout creation, and drawer UI. Do not add a React provider, parallel local cart, price calculations, or alternate checkout request code.
6. Use slots, CSS variables, and button parts for customization. Subscribe to the client when custom UI needs state. Treat loading/errors explicitly.
7. A browser completion event is informational. Use trusted order/payment status for fulfillment and invoice reconciliation.
8. Verify a two-SKU cart, variant selection, reload, quantity change/removal, cancellation, direct buy, standalone payment, and a declined payment. Check keyboard focus, narrow screens, and the merchant's actual payment methods before launch.

See [README](./README.md) for exact attributes, options, events, and examples. This contract applies to any website or app builder.
