# Independent commerce storefront example

This React Router application consumes the compiled `@godaddy/commerce-storefront` package and its shipped CSS. It has no app-builder runtime or Tailwind dependency/configuration.

Run from the repository root with Node 24:

```sh
pnpm install
pnpm --filter @godaddy/commerce-storefront build
pnpm --filter commerce-storefront-example dev
```

Open <http://127.0.0.1:5184/shop>. The Vite development server serves a demonstration catalog and in-memory cart at `/api/commerce`. Try adding the mug, changing quantities, removing items, and selecting the blue or sold-out clay tote. Reloading the browser restores a saved cart while the demo server remains running. Restarting the server expires it.

This mock is for local UI demonstration only. It creates no Commerce orders or payments and is not a production server implementation. Checkout is intentionally disabled. The production build verifies bundling; it does not include the mock API, so a deployed build needs an implementation of the [server contract](../../packages/commerce-storefront/docs/server-api.md).

```sh
pnpm --filter commerce-storefront-example build
```
