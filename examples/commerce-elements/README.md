# Commerce elements example

A plain Vite page that exercises `@godaddy/commerce` end to end against a real
Commerce environment: `gddy-add-to-cart`, `gddy-cart-button` with the shared
drawer, `gddy-buy-now`, and hosted checkout handoff.

Cart calls need only the public storefront identifiers. Checkout needs an OAuth
token, so `vite.config.ts` adds a dev-only `/api/commerce-token` endpoint that
performs the client-credentials grant on the server side of Vite and returns a
short-lived token to the page. The client secret never reaches the browser.

## Run

```bash
cp examples/commerce-elements/env.sample examples/commerce-elements/.env.local
# fill in the values, then
pnpm --filter commerce-elements dev
```

Open http://localhost:5180. The `dev` script builds `@godaddy/localizations`,
`@godaddy/react`, and `@godaddy/commerce` first; use `dev:only` to skip that.

`window.gddy` is the configured client, so the flow can also be driven from the
browser console, for example `await gddy.addItem('<sku-id>')`.
