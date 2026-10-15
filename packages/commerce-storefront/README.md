# Commerce storefront

`@godaddy/gd-commerce-storefront` provides complete React storefront templates: a catalog, product details with variant selection, a shared cart, and a cart drawer. Applications import compiled components instead of copying and maintaining their implementation.

This is an opinionated package for React applications that use React Router 7 or 8.3+, TanStack Query 5, and the documented same-origin Commerce API. It works with the host application’s router and query provider and does not require Tailwind configuration.

## Installation

This package is not published yet. Use the local workspace example while reviewing this branch. After the first release, install it with:

```sh
pnpm add @godaddy/gd-commerce-storefront @tanstack/react-query react react-dom react-router
```

Import the stylesheet once. Mount `CommerceStorefront` once inside your application's existing router and query provider. It owns the commerce state and renders one cart drawer. Keep your header and page routes inside it so cart buttons share that state.

#### Example application

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router';
import {
  Catalog, CartButton, CommerceStorefront, ProductDetails,
} from '@godaddy/gd-commerce-storefront';
import '@godaddy/gd-commerce-storefront/styles.css';

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

Use the providers your application already has; do not create another router or query client for this package. Your server must implement the [server API contract](docs/server-api.md) before these components can load products. Express hosts can mount `@godaddy/gd-commerce-server`; custom servers can implement the contract directly. The host owns store credentials, merchant provisioning, payment readiness, and runtime configuration.

## Configuration

| Option | Default | Meaning |
| --- | --- | --- |
| `catalogPath` | `/shop` | Same-origin catalog route |
| `productPath` | `/products` | Same-origin prefix for product links; register `${productPath}/:productId` |
| `checkoutSuccessPath` | unset | Same-origin return route; enables checkout UI only when supplied |
| `theme` | inherited text and transparent wrappers; neutral control palette | CSS custom properties applied to storefront surfaces and the portalled drawer |

Provide root-relative paths without a trailing slash. Enable `checkoutSuccessPath` only after your server supports checkout and validates merchant readiness. Mount a corresponding return page. A redirect back from checkout is **not proof of payment**; that page must obtain authoritative payment status from your server. This package does not provide a payment receipt page or merchant onboarding.

`GET /api/commerce/config` supplies the currency and opaque cart scope. The scope must change when the store, channel, or currency binding changes. The draft-order cart displays its subtotal and explains that shipping, taxes, and discounts are calculated at checkout. The explanation has the stable `commerce-cart-checkout-adjustments-note` class so applications can hide it when needed. The cart does not create a checkout session or calculate adjustments. Applications do not pass store IDs or credentials into the browser package. One storefront binding is supported per page and query client.

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

The stylesheet includes all required utilities and scopes them to the package's surfaces. The build removes CSS layer wrappers in their declared order, so the exported CSS can pass through a host Tailwind v3 PostCSS pipeline without `@tailwind` directives. Import it directly; consumers do not need to copy or rewrite the CSS. It does not add a global reset or require dependency scanning by a host Tailwind build. The `theme` prop reaches the drawer even though it is portalled into `document.body`.

By default, `.commerce-storefront` wrappers do not paint a background and inherit the host's text color. Set page and section backgrounds on the host application's layout elements. `--commerce-surface` colors controls and the opaque cart drawer, and supplies the base for muted colors; it does not color component wrappers. Set `--commerce-surface` and `--commerce-text` together to adapt controls and the drawer to a dark theme. Avoid setting wrapper backgrounds through CSS or the `theme` prop's `background`, `backgroundColor`, or `backgroundImage` properties, which can still override the transparent default. Descendants inherit the surface text and body font instead of global heading styles. Keep text, controls and focus indicators accessible when changing colors. Internal utility class names and markup are not a customization API; use the [product parts](#custom-product-layouts) to change a product page's layout.

The first release uses English UI text and `en-US` currency formatting. Catalog title and description are configurable. Full localization is outside this initial API.

## Compatibility

The package supports React Router 7 and React Router 8.3 or later in the 8.x series. The host still owns the router and query client; no integration API changes are needed between these versions.

The repository example uses React Router 7. Follow each router version's own React and browser requirements.

## Components and hooks

| Export | Purpose |
| --- | --- |
| `CommerceStorefront` | Recommended integration: provider and one drawer |
| `Catalog` | Six products per cursor page, with `title`, `description`, and `showHeader` props |
| `CatalogRoot` and catalog parts | Build a [custom catalog or card layout](#custom-catalog-layouts) with the same rules as `Catalog` |
| `ProductDetails` | Reads `:productId`; validates URL option selections against catalog results |
| `ProductDetailsRoot` and product parts | Build a [custom product layout](#custom-product-layouts) with the same rules as `ProductDetails` |
| `ProductCard` | Renders one `SKUGroup` with direct add or a product-details link; `ProductCardRoot` and card parts customize it |
| `CartButton` | Opens the shared drawer and displays item count |
| `AddToCartButton` | Adds a verified `sku`, `name`, and optional integer `quantity` |
| `CommerceStatus` | Connection progress/error/retry for custom layouts |
| `useCommerce` | Cart, connection, pending/error state and serialized cart actions |
| `CommerceProvider`, `CartDrawer` | Lower-level composition when the recommended wrapper does not fit; mount each once |

The package exports TypeScript catalog/cart response types and selection/summary helpers for custom product layouts. `useCommerce` actions return `Promise<boolean>`: `false` means an operation failed or its connection became stale. Inspect `error` for active-session failures. Do not automatically retry a failed mutation: the server may have committed it before the response failed. `applyDiscount(code)` is available to custom layouts; the default drawer does not render a promotion form.

`Catalog` renders its `title` as an H1 by default. When the host page owns its semantic heading, render that page H1 and pass `showHeader={false}` so the document still has exactly one H1.

## Custom product layouts

`ProductDetails` is the recommended product page. When its layout does not fit, compose the same parts inside `ProductDetailsRoot`. The root loads the route's `:productId` and shows the connection, loading, error and not-found states itself, so parts render only once the product exists. This is the packaged layout, written out:

```tsx
import {
  ProductDetailsBackLink, ProductDetailsDescription, ProductDetailsGallery, ProductDetailsPrice,
  ProductDetailsPurchase, ProductDetailsRoot, ProductDetailsTitle,
} from '@godaddy/gd-commerce-storefront';

<ProductDetailsRoot>
  <ProductDetailsBackLink className='mb-8 sm:mb-10' />
  <div className='grid items-start gap-8 lg:grid-cols-12 lg:gap-12'>
    <ProductDetailsGallery className='min-w-0 lg:col-span-7' />
    <div className='min-w-0 lg:col-span-5 lg:py-4'>
      <ProductDetailsTitle />
      <ProductDetailsPrice className='mt-6' />
      <ProductDetailsDescription className='my-8' />
      <ProductDetailsPurchase className='border-t border-neutral-200 pt-8' />
    </div>
  </div>
</ProductDetailsRoot>
```

The grid, spacing and border classes come from your own stylesheet in a custom layout. Without them, the parts stack in one column with no space between them.

Add your own elements between parts, reorder them, or leave out display parts. `ProductDetailsPurchase` renders the purchase parts below in order. Replace it with individual parts to place options apart from the add button:

| Part | Renders |
| --- | --- |
| `ProductDetailsOptions` | A select for every attribute, or the SKU list for products without attributes |
| `ProductDetailsOption` | A select for one attribute, by `attribute` name; nothing when the product lacks it |
| `ProductDetailsPurchaseStatus` | The one message explaining why the selection is not purchasable yet; nothing when ready |
| `ProductDetailsAvailability`, `ProductDetailsQuantity` | Stock and quantity for the verified SKU; nothing before verification |
| `ProductDetailsAddToCart` | Adds the verified SKU and quantity; before a SKU is verified, its accessible description gives the reason |

Every part is named `ProductDetails*` because it works only inside `ProductDetailsRoot`. `AddToCartButton` is the standalone button for a SKU you already have.

Parts read state from the root and take no product, SKU, price or quantity props. Whatever the layout, only a server-verified SKU can be added, and changing a selection resets the quantity and image. Every part throws if it is rendered outside `ProductDetailsRoot`. In development builds, if no control is rendered for an attribute the product requires, a console warning names the missing ones. A control that mounts later, such as one in a closed accordion, can trigger it; the product becomes purchasable once the control renders. Products without attributes but with several SKUs need `ProductDetailsOptions` or `ProductDetailsPurchase`. Parts can be rendered more than once, such as in a sticky mobile purchase bar; each copy gets its own element IDs.

Every part accepts `className`, which is added to the part's outer element, a wrapper the package's CSS reset leaves alone. Host classes there control margin, padding, border, color, width and grid placement, including layered utilities such as Tailwind v4's. The packaged layout sets its spacing and grid placement this way. Elements inside the part, such as the title's `<h1>`, keep the package's own styles: a host font size on `ProductDetailsTitle` does not change the heading's size, but a host color does reach it, because the heading inherits its color.

Two hooks support custom parts inside the root:

- `useProductDetails()` returns read-only `product`, `name`, `selectedSku`, `quantity`, `availableQuantity`, `images` and `status` (`incomplete`, `checking`, `variant-error`, `unavailable`, `not-purchasable` or `ready`). `selectedSku` is set only when `status` is `ready`.
- `useProductDetailsOption(attribute)` returns `{ name, label, selected, values, select }` for building swatches or buttons, or `null` when the product has no such attribute. `select(value)` accepts only that attribute's value names, or `null` to clear. Other values are ignored. A hook-based control counts toward the layout check.

```tsx
function ColorSwatches() {
  const color = useProductDetailsOption('color');
  if (!color) return null;
  return (
    <div role='group' aria-label={color.label}>
      {color.values.map((value) => (
        <button key={value.name} type='button' aria-pressed={value.selected} onClick={() => color.select(value.name)}>
          {value.label}
        </button>
      ))}
    </div>
  );
}
```

Parts are flat named exports, not properties such as `ProductDetails.Title`, so each one is an ordinary module export.

## Custom catalog layouts

`Catalog` is the recommended catalog. When its layout or its cards do not fit, compose the same parts inside `CatalogRoot`. The root loads one cursor page of six products, or the built-in samples when `sampleProducts` is set and no store is connected, and shows the connection state itself. This is the packaged catalog, written out with its packaged card:

```tsx
import {
  CatalogHeader, CatalogPagination, CatalogProducts, CatalogRoot, CatalogSummary, ProductCardAction,
  ProductCardDescription, ProductCardImage, ProductCardPrice, ProductCardRoot, ProductCardTitle,
} from '@godaddy/gd-commerce-storefront';

<CatalogRoot sampleProducts>
  <CatalogHeader className='border-b border-neutral-200 pb-10 pt-4 sm:pb-14 sm:pt-8' />
  <CatalogSummary className='border-b border-neutral-200 py-6 sm:py-8' />
  <CatalogProducts className='grid grid-cols-1 gap-6 py-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8 lg:py-10'>
    <ProductCardRoot className='flex min-w-0 flex-col overflow-hidden rounded-lg border border-neutral-200'>
      <ProductCardImage />
      <div className='flex flex-1 flex-col p-6'>
        <ProductCardTitle />
        <ProductCardDescription className='mt-3' />
        <div className='mt-auto pt-6'>
          <div className='flex flex-wrap items-end justify-between gap-4 border-t border-neutral-200 pt-5'>
            <ProductCardPrice className='min-w-0 flex-1' />
            <ProductCardAction className='max-w-full' />
          </div>
        </div>
      </div>
    </ProductCardRoot>
  </CatalogProducts>
  <CatalogPagination className='border-t border-neutral-200 pt-6' />
</CatalogRoot>
```

As with product layouts, the grid, spacing and border classes come from your own stylesheet in a custom layout. Without them, the cards stack in one column.

| Part | Renders |
| --- | --- |
| `CatalogHeader` | The `title` as the page's H1 and a `description`; leave it out when the host page owns the H1 |
| `CatalogSummary` | The loading, failure or product-count status line |
| `CatalogProducts` | One card per product. Its children are the card, rendered once for each product; without children, the packaged card |
| `CatalogPagination` | First-page and next-page buttons; nothing for samples |
| `ProductCardImage`, `ProductCardTitle` | The first image and the name as an H2, each linked to the product page |
| `ProductCardDescription`, `ProductCardPrice` | Up to three lines of description (nothing without one), and the price or price range |
| `ProductCardAction` | Adds the product directly only when it has one SKU and no options; otherwise links to the product page to choose |

`className` on `CatalogProducts` goes on the element whose direct children are the cards, so a host grid places them, and `className` on `ProductCardRoot` goes on each card, so classes such as `col-span-2` work. The loading placeholder (three cards, one to three columns), the error with its retry button, and the empty message render just before that element, whatever the layout. Card parts take no product, SKU or price props. Inside `CatalogProducts`, `ProductCardRoot` takes no `product` prop either and throws if it gets one, so a card always shows the product it is rendered for. Samples use the same card: they show a placeholder image, no description and no links, and add only to the sample cart. Card and catalog parts throw if they are rendered outside their root. Packaged cards fill their grid row, with the price and action at the bottom of each card.

For a product the host already has, such as a featured product, use `ProductCard` or `ProductCardRoot` with a `product` prop outside the catalog. `useProductCard()` returns read-only `product` (`null` for samples), `name`, `href` (`null` for samples) and `isSample` for building custom card parts. Every part accepts `className` on an outer wrapper that the package's CSS reset leaves alone, with the same limits as [product parts](#custom-product-layouts).

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
pnpm --filter @godaddy/gd-commerce-storefront build
pnpm --filter @godaddy/gd-commerce-storefront typecheck
pnpm --filter @godaddy/gd-commerce-storefront lint
pnpm --filter @godaddy/gd-commerce-storefront test
pnpm --filter commerce-storefront-example build
pnpm --filter commerce-storefront-example dev
```

Build before testing: artifact tests check the compiled JavaScript and shipped CSS as well as source behavior. The build uses local locked tool versions. Nothing in these commands publishes the package.

## License

[MIT](LICENSE.md).

### Before a store is connected

A site can mount the same components before it has a connected store:

```tsx
<CommerceStorefront theme={theme}>
  <Header><CartButton /></Header>
  <Catalog sampleProducts />
</CommerceStorefront>
```

`Catalog.sampleProducts` defaults to `false`. It allows six built-in sample products
(Product 1–6, $10–$60 USD) **only** when `/api/commerce/config` reports `state: 'unbound'`.
When a store is connected, the server reports a different state and the components show real
products. You do not need to change props or the component tree. The prop has no effect while
a store is connected. Real empty catalogs and errors never fall back to samples.

The sample cart supports adding items, changing quantities (1–999), removing items, and an
example subtotal. It uses the existing drawer and theme, keeps its items during navigation under
the shared provider, and resets on reload, unmount, or any change away from `unbound`. It uses no
live cart storage and makes no product, cart, checkout, or upstream Commerce requests.
Configuration reads continue. Sample entries are not SKUs or draft orders and never move into a
real cart. Checkout is unavailable, including direct `useCommerce().checkout()` calls.

`useCommerce().connection` now includes `unbound` and `connecting` in addition to `loading`,
`ready`, and `error`. Only `ready` means a usable store connection. The public `cart` and live
mutation methods apply only to the connected store; sample cart data is internal. A catalog
without `sampleProducts`, and direct product-detail visits, show the unconnected state.
Sample grids and drawers have the attribute `data-commerce-source="sample"`.

The provider reads configuration on mount and focus, and every five seconds while the page is
visible and the state is `unbound` or `connecting`. The first failed refresh hides samples and
clears the sample cart; a later `unbound` response starts an empty sample cart. While
connecting, refresh failures keep the connecting state for up to 60 seconds before showing
the error. Polling stops
when the state is `ready`; focus and explicit retry still refresh configuration.

Use a server that reports connection state before you enable `sampleProducts`. Successful
config responses without `state` still mean ready. A server that does not report `unbound`
never shows samples. See the [server contract](docs/server-api.md) for the host's
responsibilities.
