# Commerce storefront

`@godaddy/commerce-storefront` provides complete React storefront templates: a catalog, product details with variant selection, a shared cart, and a cart drawer. Applications import compiled components instead of copying and maintaining their implementation.

This is an opinionated package for React applications that use React Router 7 or 8.3+, TanStack Query 5, and the documented same-origin Commerce API. It works with the host application’s router and query provider and does not require Tailwind configuration.

## Installation

This package is not published yet. Use the local workspace example while reviewing this branch. After the first release, install it with:

```sh
pnpm add @godaddy/commerce-storefront @tanstack/react-query react react-dom react-router
```

Import the stylesheet once. Mount `CommerceStorefront` once inside your application's existing router and query provider. It owns the commerce state and renders one cart drawer. Keep your header and page routes inside it so cart buttons share that state.

#### Example application

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router';
import {
  Catalog, CartButton, CommerceStorefront, ProductDetails,
} from '@godaddy/commerce-storefront';
import '@godaddy/commerce-storefront/styles.css';

const client = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <CommerceStorefront>
          <header><a href='/'>My store</a><CartButton /></header>
          <main>
            <Routes>
              <Route path='/shop' element={<Catalog />} />
              <Route path='/products/:productId' element={<ProductDetails />} />
            </Routes>
          </main>
        </CommerceStorefront>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

Use the providers your application already has; do not create another router or query client for this package. Your server must implement the [server API contract](docs/server-api.md) before these components can load products. Express hosts can mount `@godaddy/commerce-server`; custom servers can implement the contract directly. The host owns store credentials, merchant provisioning, payment readiness, and runtime configuration.

## Configuration

| Option | Default | Meaning |
| --- | --- | --- |
| `catalogPath` | `/shop` | Same-origin catalog route |
| `productPath` | `/products` | Same-origin prefix for product links; register `${productPath}/:productId` |
| `checkoutSuccessPath` | unset | Same-origin return route; enables checkout UI only when supplied |
| `theme` | neutral palette | CSS custom properties applied to storefront surfaces and the portalled drawer |

Provide root-relative paths without a trailing slash. Enable `checkoutSuccessPath` only after your server supports checkout and validates merchant readiness. Mount a corresponding return page. A redirect back from checkout is **not proof of payment**; that page must obtain authoritative payment status from your server. This package does not provide a payment receipt page or merchant onboarding.

`GET /api/commerce/config` supplies the currency and opaque cart scope. The scope must change when the store/channel binding changes. Applications do not pass store IDs or credentials into the browser package. One storefront binding is supported per page and query client.

A connection failure leaves the surrounding application and its state mounted. Catalog and product surfaces show the connection error and retry action. Custom integrations can render `CommerceStatus` or inspect `useCommerce().connection`.

#### Example appearance and copy

```tsx
<CommerceStorefront
  catalogPath='/collection'
  productPath='/item'
  theme={{
    '--commerce-accent': '#174c3c',
    '--commerce-accent-hover': '#10362b',
    '--commerce-on-accent': '#ffffff',
    '--commerce-surface': '#ffffff',
    '--commerce-text': '#171717',
    '--commerce-radius': '0.75rem',
  }}
>
  {/* Register /collection and /item/:productId in your router. */}
  <Catalog title='Our collection' description='Made for everyday use.' />
</CommerceStorefront>
```

The stylesheet includes all required utilities and scopes them to the package's surfaces. The build removes CSS layer wrappers in their declared order, so the exported CSS can pass through a host Tailwind v3 PostCSS pipeline without `@tailwind` directives. Import it directly; consumers do not need to copy or rewrite the CSS. It does not add a global reset or require dependency scanning by a host Tailwind build. The `theme` prop reaches the drawer even though it is portalled into `document.body`. Keep text, controls and focus indicators accessible when changing colors. Utility class names and internal markup are not a customization API.

The first release uses English UI text and `en-US` currency formatting. Catalog title and description are configurable. Full localization and arbitrary component slots are outside this initial API.

## Compatibility

The package supports React Router 7 and React Router 8.3 or later in the 8.x series. The host still owns the router and query client; no integration API changes are needed between these versions.

The repository example uses React Router 7. Follow each router version's own React and browser requirements.

## Components and hooks

| Export | Purpose |
| --- | --- |
| `CommerceStorefront` | Recommended integration: provider and one drawer |
| `Catalog` | Six products per cursor page, with `title`, `description`, and `showHeader` props |
| `ProductDetails` | Reads `:productId`; validates URL option selections against catalog results |
| `ProductCard` | Renders one `SKUGroup` with direct add or a product-details link |
| `CartButton` | Opens the shared drawer and displays item count |
| `AddToCartButton` | Adds a verified `sku`, `name`, and optional integer `quantity` |
| `CommerceStatus` | Connection progress/error/retry for custom layouts |
| `useCommerce` | Cart, connection, pending/error state and serialized cart actions |
| `CommerceProvider`, `CartDrawer` | Lower-level composition when the recommended wrapper does not fit; mount each once |

The package exports TypeScript catalog/cart response types and selection/summary helpers for custom product layouts. `useCommerce` actions return `Promise<boolean>`: `false` means an operation failed or its connection became stale. Inspect `error` for active-session failures. Do not automatically retry a failed mutation: the server may have committed it before the response failed. `applyDiscount(code)` is available to custom layouts; the default drawer does not render a promotion form.

`Catalog` renders its `title` as an H1 by default. When the host page owns its semantic heading, render that page H1 and pass `showHeader={false}` so the document still has exactly one H1.

## How it works

Products are SKU groups. The package purchases only an unambiguous SKU, verifies all selected attributes through the server, uses SKU prices/images, and distinguishes untracked inventory from sold-out inventory. Server-side inventory and pricing checks remain mandatory.

Cart mutations share one queue, including initial cart creation. The cart ID is saved under `godaddy:commerce-storefront:cart:<scope>`. Browser Web Locks coordinate tabs where supported; storage/focus events refresh the cart. If storage fails, the current page keeps the cart ID in memory and shows a warning. Browsers without Web Locks have only per-provider serialization; the server must handle concurrent writes correctly.

Changing the server-provided cart scope resets cart state and prevents old responses from affecting the new connection. A failed configuration refresh temporarily disables commerce and also invalidates pending responses. Normal configuration loading and failures do not unmount host content.

## Guides

- [Server API contract](docs/server-api.md)
- [Independent Vite consumer](../../examples/commerce-storefront/README.md)

## Commands

From the repository root, with Node 24:

```sh
pnpm install
pnpm --filter @godaddy/commerce-storefront build
pnpm --filter @godaddy/commerce-storefront typecheck
pnpm --filter @godaddy/commerce-storefront lint
pnpm --filter @godaddy/commerce-storefront test
pnpm --filter commerce-storefront-example build
pnpm --filter commerce-storefront-example dev
```

Build before testing: artifact tests check the compiled JavaScript and shipped CSS as well as source behavior. The build uses local locked tool versions. Nothing in these commands publishes the package.

## License

[MIT](LICENSE.md).
