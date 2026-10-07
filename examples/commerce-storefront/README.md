# Local storefront template

A standalone development fixture for preparing a reusable template without creating a store
or supplying Commerce credentials. It consumes the built workspace packages; it is not an AAB
template artifact or evidence of real merchant activation.

From the repository root (Node 24 and pnpm 10.14.0):

```sh
pnpm install
pnpm --filter @godaddy/gd-commerce-server build
pnpm --filter @godaddy/gd-commerce-storefront build
pnpm --filter commerce-storefront-example dev
```

Open http://127.0.0.1:5184. Both Home and Shop use `Catalog sampleProducts`, one provider,
and the shared header/cart drawer. Add Product 1, navigate between pages, change quantity,
and remove it. Reload clears the sample cart. No checkout exists.

The development controls alter the local server's authoritative state:

- **Unbound:** real server package config/router, package-owned samples and local cart.
- **Connecting:** samples disappear and actions suspend on the next automatic config read.
- **Configuration error:** the real config handler returns 503; samples do not return.
- **Live empty catalog (simulated):** ready config and an empty response from the existing
  development catalog fixture. No fallback to samples.
- **Existing live demo (simulated):** retains the example's pre-existing mug/tote and in-memory
  cart API, including variants and unavailable inventory. No upstream requests or payments.

Unbound/connecting configurations refresh automatically every five seconds while visible.
Use **Refresh configuration** to exercise ready-state failures or recovery immediately. No
component prop changes or page reloads are needed. Sample items never enter the live demo cart.
Development state controls only exist in Vite dev; a production build requires real host API
routes and authoritative binding projection. Never copy the development API or its fixed
configuration into a customer template. The sample catalog code and data live inside the package.

This fixture checks component behavior and the server state boundary. AAB import/projection
and a real store's catalog/cart/checkout still require their own integration verification.
