# Commerce elements example

A plain Vite page that exercises `@godaddy/commerce` end to end against a real
Commerce environment: `gddy-add-to-cart`, `gddy-cart-button` with the shared
drawer, `gddy-buy-now`, and hosted checkout handoff.

Cart calls need only the public storefront identifiers. Checkout needs the
OAuth client, so `vite.config.ts` adds a dev-only `POST /api/commerce/checkout`
route that performs the client-credentials grant and creates the hosted session
on the server side of Vite, returning only the session id and URL. Neither the
client secret nor an access token ever reaches the browser. A real site owns the
equivalent route on its own server and prices standalone payment references
there.

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

## CDN page

`/cdn.html` is the same storefront built the way a merchant would build it: a
config object, a `<script defer>` tag, and `gddy-*` tags in plain HTML. Nothing
is bundled. Build and serve the runtime first:

```bash
pnpm --filter @godaddy/commerce build:cdn
pnpm --filter @godaddy/commerce cdn:serve   # http://localhost:5181/v1/commerce.js
```

Then open http://localhost:5180/cdn.html. `VITE_COMMERCE_CDN_URL` in
`.env.local` selects the runtime; point it at a deployed `/v1/commerce.js` to
exercise a real release. The page shows the runtime version and commit from the
`gddy:ready` event.
